/**
 * An error safe to expose to users.
 * Only messages thrown with this class inside server actions reach clients unchanged.
 * Other throws are masked and replaced with a generic message.
 */
export class ActionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ActionError'
  }
}
