# 프로젝트 정리 및 최적화 계획

## 진단 요약

- 현재 코드베이스는 `src` 기준 약 `67개 파일 / 9.7k LOC` 규모다.
- 가장 큰 노이즈는 ESLint가 `public/tinymce/**` 벤더 파일까지 검사하면서 발생한다.
- 현재 `npm run lint` 결과는 `2641개 이슈`이며, 이 중 다수가 실제 앱 코드가 아닌 정적 벤더 코드에서 나온다.
- `tsc --noUnusedLocals --noUnusedParameters` 기준으로 즉시 확인된 불필요 코드가 존재한다.
- 검색, 캐시 무효화, 대형 클라이언트 컴포넌트, 크롤러 의존성 쪽에 성능 개선 여지가 있다.

## 우선순위 0: 진단 신호 복구

목표: 실제 앱 코드 이슈가 벤더 노이즈에 묻히지 않도록 먼저 관측 가능성을 회복한다.

- `eslint.config.mjs`
  - `public/tinymce/**` 또는 필요 시 `public/**`를 lint ignore에 추가
  - 이유: 현재 lint 결과 대부분이 TinyMCE 배포 파일이라 실제 불필요 import, dead code 탐지가 가려짐
- lint 기준 재실행
  - 벤더 제외 후 남는 앱 코드 경고/에러만 다시 분류

## 우선순위 1: 확정 dead code / stale code 정리

목표: 사용되지 않는 컴포넌트, 레거시 fallback, 불필요 선언을 제거한다.

- [완료] `src/components/EventList.tsx`
  - 현재 사용처가 보이지 않는다. 제거 후보 1순위
- [완료] `src/actions/nexon.ts`
  - `EventList`와 함께만 연결된 것으로 보여 제거 후보
- [완료] `src/components/YouTuberSection.tsx`
  - 홈 화면이 별도 인라인 구현을 사용하고 있어 미사용 후보
- [완료] `src/data/runes.ts`
  - 파일 주석상 deprecated이며 `RUNE_DATABASE = {}` 상태
  - `src/app/runes/RunesClient.tsx` fallback 경로까지 같이 정리 필요
- [완료] `src/app/guide/GuideClient.tsx`
  - 미사용 상수 `C` 제거

정리 원칙:

- 검색 결과가 없는 항목만 제거
- 페이지/동적 import/테스트 전용 참조 여부를 한 번 더 확인
- 제거 후 `lint`와 `build`로 회귀 확인

## 우선순위 2: 불필요 import / 타입 / lint 정리

목표: 실제 유지보수 비용을 올리는 경고를 줄이고, 죽은 코드를 더 잘 드러나게 만든다.

- [완료] `src/app/search/SearchClient.tsx`
  - 선언 순서, hook dependency, `any` 정리 우선
  - 현재 lint 기준 가장 위험 신호가 강한 파일 중 하나
- [완료] `any` 사용 축소
  - 우선 대상:
    - `src/app/guide/[id]/TipDetailClient.tsx`
    - `src/app/guide/write/GuideWriteClient.tsx`
    - `src/app/homework/HomeworkClient.tsx`
    - `src/app/runes/page.tsx`
    - `src/app/search/SearchClient.tsx`
    - `src/lib/auth.ts`
    - `src/lib/mongodb.ts`
    - `src/lib/redis.ts`
- [완료] hook dependency 경고 정리
  - 대상:
    - `src/app/guide/write/GuideWriteClient.tsx`
    - `src/app/homework/HomeworkClient.tsx`
    - `src/app/search/SearchClient.tsx`
    - `src/components/Editor/RichTextEditorSimple.tsx`
- [완료] `<img>` 경고를 `next/image` 전환 가능 여부 기준으로 정리
  - `GuideWriteClient`, `TipDetailClient` 전환 완료
  - 전체 `npm run lint` 잔여 이슈는 우선순위 2 범위 밖 항목과 `public/tinymce/**` vendor 파일 중심

## 우선순위 3: 성능 및 속도 개선

목표: 요청 처리 비용과 클라이언트 번들 크기를 줄인다.

- [완료] `src/lib/redis.ts`
  - `invalidateCachePattern()`가 `KEYS` 기반이면 트래픽 증가 시 Redis 블로킹 위험이 있다
  - `SCAN` 기반 순회 삭제로 교체 필요
- [완료] 과도한 런타임 로그 정리
  - 대상:
    - `src/actions/homework.ts`
    - `src/actions/comment.ts`
    - `src/actions/post.ts`
    - `src/lib/crawler.ts`
    - `src/app/api/cron/crawl-ranking/route.ts`
  - 개발용 로그는 `NODE_ENV !== "production"` 또는 공용 logger로 제한
- [완료] 대형 클라이언트 컴포넌트 분리
  - 우선 대상:
    - `src/app/HomeClient.tsx`
    - `src/app/guide/[id]/TipDetailClient.tsx`
    - `src/app/guide/GuideClient.tsx`
    - `src/app/community/[id]/PostDetailClient.tsx`
    - `src/app/community/CommunityClient.tsx`
    - `src/app/homework/HomeworkClient.tsx`
  - 목적:
    - 초기 번들 축소
    - 렌더 단위 분리
    - 유지보수성 개선
- [완료] TinyMCE 전달 전략 점검
  - `public/tinymce/**` 정적 자산 규모가 큼
  - 실제 편집 페이지에서만 로드되는지 재확인
  - CDN 사용 또는 에디터 대체 가능성은 별도 검토 항목
- [완료] 크롤러 의존성 분리 검토
  - `puppeteer`, `puppeteer-core`, `@sparticuz/chromium` 동시 사용은 설치/빌드 부담이 큼
  - 랭킹 크롤링을 앱 런타임과 분리 가능한지 확인

## 우선순위 4: 데이터 접근 및 검색 최적화

목표: 현재 존재하는 인덱스를 실제 쿼리가 활용하게 만든다.

- `src/models/Guide.ts` + `src/actions/guide.ts`
  - 모델은 text index가 있는데 실제 검색은 regex 기반
  - Mongo text search 또는 검색 전략 일치화 필요
- `src/models/Post.ts` + `src/actions/post.ts`
  - 게시글 검색도 regex 기반
  - 검색 빈도가 높다면 text index 또는 별도 검색 전략 필요
- 홈 화면 데이터 fan-out 검토
  - `src/app/page.tsx`가 여러 서버 액션을 동시에 호출
  - 캐시 TTL, 실패 격리, 우선순위 렌더링 재설계 여지 존재

## 실행 순서 제안

1. `eslint.config.mjs` 정리로 벤더 노이즈 제거
2. dead code 후보 제거와 unused 선언 정리
3. `SearchClient` 중심으로 lint/type hot spot 정리
4. Redis 캐시 무효화와 런타임 로그 정리
5. 검색 인덱스/쿼리 전략 정렬
6. 대형 컴포넌트 분리와 에디터/크롤러 무게 최적화

## 빠른 효과가 큰 항목

- `public/tinymce/**` lint 제외
- `GuideClient` 미사용 상수 제거
- `EventList`, `YouTuberSection`, `actions/nexon` 실제 미사용 확인 후 삭제
- Redis `KEYS` 제거
- 프로덕션 `console.log` 축소

## 검증 기준

- `npm run lint`
- `./node_modules/.bin/tsc --noEmit`
- `npm run build`
- 주요 페이지 수동 확인
  - 홈
  - 공략 목록/상세
  - 커뮤니티 목록/상세
  - 룬
  - 랭킹
  - 로그인/프로필
