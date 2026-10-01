---
name: seo-optimize
description: SEO 최적화 - 공통 메타데이터 유틸 + OG / favicon / JSON-LD / sitemap / robots를 한 번에 챙긴다. Triggers - "SEO 최적화", "검색 최적화", "메타태그", "og 설정", "공유 이미지", "파비콘", "favicon", "구조화 데이터", "jsonld".
---

# SEO 최적화 스킬

"SEO 최적화" 요청이 오면 아래를 **빠짐없이** 챙긴다. Claude Code, Codex, Antigravity 어느 쪽이 실행해도 동일하게 동작하도록 작성됨.

핵심: **공통 SEO 유틸(`src/lib/seo`)을 한 번 설치**하면, 각 페이지는 `buildMetadata({ ... })`로 **필요한 값만 부분 수정**한다. 값이 사이트 전역에서 일관되게 유지된다.

## 0. 사용자에게 먼저 받을 것 (파일 얘기 금지)

유저는 폴더/파일을 못 본다. 채팅으로만 받는다.

- **OG 공유 이미지**: "카톡/링크 공유할 때 뜨는 썸네일 이미지를 채팅창에 올려주세요 (가로형, 1200×630 권장)" → 받으면 `public/og.png`로 저장
- **파비콘**: "브라우저 탭에 뜨는 작은 아이콘(로고)을 정사각형으로 올려주세요" → 받으면 `src/app/icon.png` (+ `src/app/apple-icon.png`)로 저장
- **사이트 정보**: 서비스 이름 / 한 줄 설명 / 도메인(있으면) — 모르면 현재 기획에서 가져와 채우고 나중에 바꿀 수 있다고 안내

이미지를 아직 못 받았으면 기존 `public/og.png`와 `src/app/favicon.ico`를 그대로 두고 나머지를 먼저 진행한다.

## 1. 공통 유틸 설치 (이미 있으면 건너뛰기)

`src/lib/seo/`가 없으면 에셋을 복사한다:

```bash
mkdir -p src/lib/seo
cp .agents/skills/seo-optimize/assets/site-config.ts src/lib/seo/site-config.ts
cp .agents/skills/seo-optimize/assets/metadata.ts    src/lib/seo/metadata.ts
cp .agents/skills/seo-optimize/assets/json-ld.tsx    src/lib/seo/json-ld.tsx
cp .agents/skills/seo-optimize/assets/index.ts       src/lib/seo/index.ts
```

그 다음 **`src/lib/seo/site-config.ts`의 값(name / title / description / locale / lang / twitterHandle)을 서비스에 맞게 수정**한다. 이게 전역 기본값이다.

## 2. 루트 레이아웃 연결 (`src/app/layout.tsx`)

인라인으로 박혀있는 메타데이터를 공통 유틸로 교체한다.

- 상단 import 추가:
  ```ts
  import { JsonLd, rootMetadata, websiteJsonLd } from "@/lib/seo";
  import { config } from "@/server/config";
  ```
- 기존 `metadata` / `generateMetadata` 블록 전체를 삭제하고:
  ```ts
  export const metadata: Metadata = rootMetadata(config.SITE_URL);
  ```
- `config.SITE_URL`은 배포 주소다. 배포 환경(필요하면 로컬 `.env`)의 `SITE_URL` 변수에서 읽으며, 도메인이 바뀌면 그 값만 바꾼다.
  이 값이 `metadataBase`가 되어 `/og.png` 같은 상대 경로를 절대 URL로 바꾼다 — 카카오톡·페이스북 미리보기는 절대 URL만 읽는다.
- **메타데이터·sitemap·robots에서 `headers()`로 host를 읽지 않는다.** Cache Components(`cacheComponents: true`)에서
  메타데이터가 요청 데이터를 읽으면 정적 페이지 빌드가 막히고, 우회하면 메타데이터가 스트리밍되어
  카카오톡 크롤러(`kakaotalk-scrap`, Next 기본 봇 목록에 없음)에게 og 태그가 `<head>` 밖으로 나간다.
- `rootMetadata`는 canonical·og:url을 두지 않는다(하위 페이지가 물려받으면 모두 "/"를 가리킨다). 페이지가 `buildMetadata({ path })`로 정한다.
- `<html lang="en">` → `siteConfig.lang`에 맞게 `<html lang="ko">`로 수정 (locale과 일치시켜야 함)
- `<body>` 안 최상단에 JSON-LD 삽입:
  ```tsx
  <JsonLd data={websiteJsonLd()} />
  ```

## 3. sitemap / robots 설치 (없으면)

```bash
cp .agents/skills/seo-optimize/assets/sitemap.ts src/app/sitemap.ts
cp .agents/skills/seo-optimize/assets/robots.ts  src/app/robots.ts
```

- 두 파일 모두 `config.SITE_URL`을 기준 주소로 쓴다(요청 host를 읽지 않아 정적으로 빌드된다).
- `robots.ts`의 `disallow`가 `ADMIN_BASE_PATH`와 다른 비공개 경로를 포함하는지 확인
- `sitemap.ts`의 `routes`에 공개 페이지 경로를 추가. 동적 목록(블로그 등)은 repository에서 읽어 `map`으로 펼친다.

## 4. 파비콘 / OG 이미지 배치

- 받은 파비콘 → `src/app/icon.png` (정사각, 512×512 권장). 애플 기기용으로 `src/app/apple-icon.png`도 같이 둔다. (App Router가 자동으로 `<link>` 생성 — 코드 작성 불필요)
- 기존 `src/app/favicon.ico`는 `icon.png`가 있으면 함께 fallback으로 둬도 무방
- 받은 OG 이미지 → `public/og.png` (1200×630)

## 5. 페이지별 부분 수정 (핵심 사용법)

각 페이지는 전역 기본값을 그대로 쓰되, **다른 값만** 넘긴다.

```ts
// 정적 페이지: src/services/app/page/about/...
import { buildMetadata } from "@/lib/seo";
export const metadata = buildMetadata({
  title: "소개",
  description: "우리 서비스를 소개합니다",
  path: "/about",
});
```

```ts
// 동적 라우트(글 상세 등)
import { buildMetadata } from "@/lib/seo";
export function generateMetadata({ params }) {
  const post = /* repository에서 조회 */;
  return buildMetadata({
    title: post.title,
    description: post.excerpt,
    ogImage: post.coverImage,   // 글마다 다른 공유 이미지
    path: `/blog/${post.slug}`,
    type: "article",
  });
}
```

```tsx
// 글 상세에 Article 구조화 데이터 추가
import { JsonLd, articleJsonLd } from "@/lib/seo";
<JsonLd data={articleJsonLd({ title: post.title, image: post.coverImage, datePublished: post.createdAt })} />
```

- 관리자/임시 페이지는 `buildMetadata({ noIndex: true })`로 검색 노출 차단
- 홈처럼 "타이틀 | 사이트명" 템플릿을 붙이지 않을 페이지는 `{ ...buildMetadata({ path: "/" }), title: { absolute: siteConfig.title } }`

## 6. 검증

```bash
pnpm run validate   # typecheck + lint, 에러 0 만들기
```

확인 체크리스트:
- [ ] `<title>` / `<meta name="description">` 가 페이지마다 맞게 나온다
- [ ] OG (`og:title`, `og:description`, `og:image`) + Twitter Card 채워짐
- [ ] `og:image`가 `https://<앱 기본 주소>/og.png` 같은 절대 URL이고 `<head>` 안에 있다
      (`curl -A "kakaotalk-scrap/1.0" <주소>`로 확인. localhost가 나오면 `config.SITE_URL`이 비어 있는 것)
- [ ] favicon / apple-icon 적용
- [ ] `/sitemap.xml`, `/robots.txt` 응답
- [ ] JSON-LD (`<script type="application/ld+json">`) 삽입
- [ ] `<html lang>` 가 locale과 일치

## 마무리 안내 (유저에게)

- OG 이미지/파비콘을 아직 안 올렸으면 "채팅창에 이미지 올려주시면 교체할게요"라고 안내
- 공유 미리보기는 카톡/슬랙 등에 링크를 붙여 직접 확인하는 건 유저 몫
