'use client'

/**
 * 첫 화면 플레이스홀더. 프로젝트의 진짜 홈이 생기면 이 폴더를 그 화면으로 바꾼다.
 * 목적은 하나 — 어디에 무엇을 쓰는지 보여주는 것.
 */

const LAYERS: { name: string; path: string; role: string }[] = [
  {
    name: 'repository',
    path: 'src/server/repository',
    role: '데이터 접근의 단일 관문. mock 으로 시작하고, DB 는 필요해질 때 붙인다.',
  },
  {
    name: 'api',
    path: 'src/services/app/api/{domain}',
    role: '화면에 맞춘 서버 액션. 표시용 가공까지 여기서 끝낸다.',
  },
  {
    name: 'state',
    path: 'src/services/app/state/{domain}',
    role: '도메인 상태와 액션. 부수효과는 전부 액션 안에 둔다.',
  },
  {
    name: 'page',
    path: 'src/services/app/page/{route}',
    role: '섹션 단위 화면. 상태를 읽고 액션을 부를 뿐, 데이터를 가공하지 않는다.',
  },
]

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-10 px-6 py-20">
      <header className="flex flex-col gap-3">
        <h1 className="text-display-md text-balance text-foreground">
          화면부터 만들고, 데이터는 나중에 붙입니다.
        </h1>
        <p className="text-body text-soft-foreground">
          각 폴더의 <code className="font-mono">.ai.md</code> 가 그 레이어의 규칙입니다. 코드를
          쓰기 전에 <code className="font-mono">AGENTS.md</code> 와 함께 읽으세요.
        </p>
      </header>

      <dl className="flex flex-col">
        {LAYERS.map((layer) => (
          <div
            key={layer.name}
            className="flex flex-col gap-1 border-t border-border py-5 sm:flex-row sm:gap-6"
          >
            <dt className="text-title-sm text-foreground sm:w-28 sm:shrink-0">{layer.name}</dt>
            <dd className="flex flex-col gap-1">
              <p className="font-mono text-body-sm text-foreground">{layer.path}</p>
              <p className="text-body-sm text-soft-foreground">{layer.role}</p>
            </dd>
          </div>
        ))}
      </dl>
    </main>
  )
}
