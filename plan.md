# 프로젝트 정리 및 최적화 계획

## 진단 요약

- 현재 코드베이스는 `src` 기준 약 `67개 파일 / 9.7k LOC` 규모다.
- 가장 큰 노이즈는 ESLint가 `public/tinymce/**` 벤더 파일까지 검사하면서 발생한다.
- 현재 `npm run lint` 결과는 `2641개 이슈`이며, 이 중 다수가 실제 앱 코드가 아닌 정적 벤더 코드에서 나온다.
- 현재 남은 핵심 정리 대상은 벤더 lint 노이즈와 우선순위 밖 잔여 app lint/type 이슈다.

## 우선순위 0: 진단 신호 복구

목표: 실제 앱 코드 이슈가 벤더 노이즈에 묻히지 않도록 먼저 관측 가능성을 회복한다.

- `eslint.config.mjs`
  - `public/tinymce/**` 또는 필요 시 `public/**`를 lint ignore에 추가
  - 이유: 현재 lint 결과 대부분이 TinyMCE 배포 파일이라 실제 불필요 import, dead code 탐지가 가려짐
- lint 기준 재실행
  - 벤더 제외 후 남는 앱 코드 경고/에러만 다시 분류

## 실행 순서 제안

1. `eslint.config.mjs` 정리로 벤더 노이즈 제거
2. 벤더 제외 후 앱 코드 잔여 lint/type 이슈 재분류
3. 범위 밖 잔여 hot spot 정리
4. 주요 페이지 수동 확인

## 빠른 효과가 큰 항목

- `public/tinymce/**` lint 제외
- `src/app/community/[id]/PostDetailClient.tsx` lint/type 정리
- `src/app/sitemap.ts` `any` 제거

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
