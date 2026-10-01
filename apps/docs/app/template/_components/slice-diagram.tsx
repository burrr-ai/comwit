'use client'

import * as React from 'react'

type Domain = {
  name: string
  page: string
  state: string
  api: string
  /** repository file the slice reads — admin/member reads the same user.ts as app/user */
  repository: string
}

const SERVICES: { name: string; who: string; domains: Domain[] }[] = [
  {
    name: 'app',
    who: 'end users',
    domains: [
      { name: 'post', page: 'posts/', state: 'usePost', api: 'findAll()', repository: 'post.ts' },
      { name: 'user', page: 'profile/', state: 'useUser', api: 'getMe()', repository: 'user.ts' },
      { name: 'cart', page: 'cart/', state: 'useCart', api: 'addItem()', repository: 'cart.ts' },
    ],
  },
  {
    name: 'admin',
    who: 'operators',
    domains: [
      {
        name: 'member',
        page: 'members/',
        state: 'useMember',
        api: 'suspend()',
        repository: 'user.ts',
      },
      {
        name: 'report',
        page: 'reports/',
        state: 'useReport',
        api: 'summary()',
        repository: 'report.ts',
      },
    ],
  },
]

const LAYERS = ['page', 'state', 'api'] as const
const REPOSITORY_FILES = ['post.ts', 'user.ts', 'cart.ts', 'report.ts']

/*
 * 도메인 열의 그리드 위치. 넓은 화면: 1열은 레이어 이름, 서비스 사이에 좁은 틈 열.
 * 좁은 화면: 레이어 이름이 띠 위 한 줄로 올라가므로 1열이 없다. CSS 가 --col / --col-narrow 중 하나를 쓴다.
 */
const columns = SERVICES.flatMap((service, serviceIndex) =>
  service.domains.map((domain, domainIndex) => {
    const before = SERVICES.slice(0, serviceIndex).reduce((n, s) => n + s.domains.length, 0)
    const index = before + domainIndex + serviceIndex // 서비스마다 틈 열 하나
    return {
      domain,
      service: service.name,
      first: domainIndex === 0,
      last: domainIndex === service.domains.length - 1,
      index,
    }
  })
)

const serviceSpan = SERVICES.map((service, serviceIndex) => {
  const before = SERVICES.slice(0, serviceIndex).reduce((n, s) => n + s.domains.length, 0)
  return { ...service, start: before + serviceIndex, span: service.domains.length }
})

function place(index: number, span = 1) {
  return {
    '--col': `${index + 2} / span ${span}`,
    '--col-narrow': `${index + 1} / span ${span}`,
  } as React.CSSProperties
}

/**
 * One slice per domain, four layers inside it. Pointing at (or focusing, or tapping) a domain lights
 * its column through page, state and api, and the repository file it reaches. `post` starts lit so
 * the idea reads without interaction, including on touch screens.
 */
export function SliceDiagram() {
  const [pinned, setPinned] = React.useState('post')
  const [hovered, setHovered] = React.useState<string | null>(null)
  const active = hovered ?? pinned
  const activeDomain = columns.find((c) => c.domain.name === active)?.domain

  return (
    <div className="slice-mat" data-active={active} onPointerLeave={() => setHovered(null)}>
      <div className="slice-grid">
        {serviceSpan.map((service) => (
          <div
            key={service.name}
            className="slice-service"
            style={place(service.start, service.span)}
          >
            <span>
              <code>{service.name}</code>
              <span className="slice-service-who">{service.who}</span>
            </span>
          </div>
        ))}

        <div className="slice-direction" aria-hidden="true">
          <span>depends</span>
          <svg viewBox="0 0 12 100" preserveAspectRatio="none" focusable="false">
            <line x1="6" y1="0" x2="6" y2="100" vectorEffect="non-scaling-stroke" />
          </svg>
          <svg className="slice-direction-head" viewBox="0 0 12 10" focusable="false">
            <path d="M0 0 L6 10 L12 0 Z" />
          </svg>
        </div>

        {columns.map(({ domain, service, index }) => {
          const lit = active === domain.name
          return (
            <React.Fragment key={domain.name}>
              <button
                type="button"
                className="slice-head"
                style={place(index)}
                data-lit={lit}
                aria-pressed={pinned === domain.name}
                aria-label={`${service}/${domain.name}: trace the slice`}
                onPointerEnter={(event) => {
                  if (event.pointerType === 'mouse') setHovered(domain.name)
                }}
                onFocus={() => setHovered(domain.name)}
                onBlur={() => setHovered(null)}
                onClick={() => setPinned(domain.name)}
              >
                {domain.name}
              </button>
              <span className="slice-outline" style={place(index)} data-lit={lit} aria-hidden />
            </React.Fragment>
          )
        })}

        {LAYERS.map((layer) => (
          <React.Fragment key={layer}>
            <span className="slice-label" data-layer={layer}>
              <code>{layer}</code>
            </span>
            {columns.map(({ domain, first, last, index }) => (
              <span
                key={domain.name}
                className="slice-cell"
                data-layer={layer}
                data-first={first}
                data-last={last}
                data-lit={active === domain.name}
                style={place(index)}
                onPointerEnter={(event) => {
                  if (event.pointerType === 'mouse') setHovered(domain.name)
                }}
              >
                <code>{domain[layer]}</code>
              </span>
            ))}
          </React.Fragment>
        ))}

        <span className="slice-label" data-layer="repository">
          <code>repository</code>
        </span>
        <div className="slice-foundation" style={place(0, columns.at(-1)!.index + 1)}>
          <span className="slice-foundation-path">
            <code>src/server/repository</code>
            <span>shared by every service</span>
          </span>
          <span className="slice-files">
            {REPOSITORY_FILES.map((file) => (
              <code key={file} data-lit={activeDomain?.repository === file}>
                {file}
              </code>
            ))}
          </span>
        </div>
      </div>
      <p className="slice-readout" aria-live="polite">
        {activeDomain && (
          <>
            <code>{columns.find((c) => c.domain.name === active)!.service}/</code>
            <code>{activeDomain.name}</code> lives in <code>page/{activeDomain.page}</code>,{' '}
            <code>state/{activeDomain.name}/</code> and <code>api/{activeDomain.name}/</code>, and
            reads <code>{activeDomain.repository}</code>.
          </>
        )}
      </p>
    </div>
  )
}
