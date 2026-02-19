import { Validate, ValidationError } from '../src/interceptors/validate'
import { OnError } from '../src/interceptors/error'

describe('Validate', () => {
  test('valid args → method executes normally', () => {
    class Actions {
      @Validate({
        name: (v) => typeof v === 'string' || 'Must be string',
      })
      greet(name: string) {
        return `Hello, ${name}`
      }
    }

    const actions = new Actions()
    expect(actions.greet('World')).toBe('Hello, World')
  })

  test('invalid args → throws ValidationError with correct errors object', () => {
    class Actions {
      @Validate({
        name: (v) => (typeof v === 'string' && v.length > 0) || 'Name required',
      })
      greet(name: string) {
        return `Hello, ${name}`
      }
    }

    const actions = new Actions()
    try {
      actions.greet('' as any)
      expect.unreachable('should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError)
      expect((err as ValidationError).errors).toEqual({ name: 'Name required' })
    }
  })

  test('multiple validators — some pass, some fail', () => {
    class Actions {
      @Validate({
        title: (v) => (typeof v === 'string' && v.length > 0) || 'Title required',
        priority: (v) => [1, 2, 3].includes(v) || 'Priority must be 1-3',
      })
      createTodo(title: string, priority: number) {
        return { title, priority }
      }
    }

    const actions = new Actions()
    try {
      actions.createTodo('Buy milk', 5 as any)
      expect.unreachable('should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError)
      const ve = err as ValidationError
      expect(ve.errors).toEqual({ priority: 'Priority must be 1-3' })
      expect('title' in ve.errors).toBe(false)
    }
  })

  test('all validators pass → method executes and returns result', () => {
    class Actions {
      @Validate({
        a: (v) => typeof v === 'number' || 'Must be number',
        b: (v) => typeof v === 'number' || 'Must be number',
      })
      add(a: number, b: number) {
        return a + b
      }
    }

    const actions = new Actions()
    expect(actions.add(2, 3)).toBe(5)
  })

  test('works with async methods', async () => {
    class Actions {
      @Validate({
        id: (v) => (typeof v === 'number' && v > 0) || 'ID must be positive number',
      })
      async fetchUser(id: number) {
        return { id, name: 'Alice' }
      }
    }

    const actions = new Actions()

    // Valid
    await expect(actions.fetchUser(1)).resolves.toEqual({ id: 1, name: 'Alice' })

    // Invalid — should throw synchronously before async execution
    expect(() => actions.fetchUser(-1)).toThrow(ValidationError)
  })

  test('ValidationError has correct message and errors property', () => {
    class Actions {
      @Validate({
        email: (v) => (typeof v === 'string' && v.includes('@')) || 'Invalid email',
        age: (v) => (typeof v === 'number' && v >= 18) || 'Must be 18+',
      })
      register(email: string, age: number) {
        return true
      }
    }

    const actions = new Actions()
    try {
      actions.register('bad', 10 as any)
      expect.unreachable('should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError)
      const ve = err as ValidationError
      expect(ve.name).toBe('ValidationError')
      expect(ve.errors).toEqual({
        email: 'Invalid email',
        age: 'Must be 18+',
      })
      expect(ve.message).toBe('Validation failed: Invalid email, Must be 18+')
    }
  })

  test('composes with @OnError interceptor', () => {
    const errorHandler = vi.fn()

    class Actions {
      @OnError(errorHandler)
      @Validate({
        value: (v) => v > 0 || 'Must be positive',
      })
      process(value: number) {
        return value * 2
      }
    }

    const actions = new Actions()
    expect(() => actions.process(-1)).toThrow(ValidationError)
    expect(errorHandler).toHaveBeenCalledWith(expect.any(ValidationError))
  })

  test('method is not called when validation fails', () => {
    const fn = vi.fn()

    class Actions {
      @Validate({
        x: (v) => typeof v === 'number' || 'Must be number',
      })
      doSomething(x: number) {
        fn(x)
        return x
      }
    }

    const actions = new Actions()
    expect(() => actions.doSomething('bad' as any)).toThrow(ValidationError)
    expect(fn).not.toHaveBeenCalled()
  })
})
