# Mabi Life v1.0.2 개선 보고서

- 작성일: 2026-04-10
- 기준: 초기 프로젝트 분석에서 식별한 P0 리스크 및 구조 개선 항목 중 실제 반영 완료된 내용
- 목표: 보안, 업로드 제어, 조회수 무결성, 커뮤니티 인기글 확장성 개선

## 1. 요약

v1.0.2에서는 단순 UI 수정이 아니라 서비스의 핵심 운영 리스크를 줄이는 작업을 우선 반영했다. 이번 버전으로 저장형 XSS 위험을 서버에서 차단했고, 비인증 업로드를 막았으며, 공략 조회수 오염 문제를 해결했다. 또한 커뮤니티 조회수/인기글 구조를 `문서 내 배열 누적` 방식에서 `일별 집계 컬렉션` 기반으로 전환해 장기 확장성을 확보했다.

핵심 개선 효과는 다음과 같다.

- 서버 저장 시점 HTML sanitization으로 공략 본문 XSS 위험 감소
- 로그인 기반 업로드 정책 도입으로 스토리지 오남용 및 악성 업로드 위험 감소
- 메타데이터/봇/프리패치에 의해 공략 조회수가 왜곡되던 문제 해소
- 커뮤니티 인기글 계산 비용과 문서 비대화 문제 완화

## 2. 완료 항목

- [x] 공략 HTML 서버 sanitization 적용
- [x] Presigned URL 인증/용량/타입 제한 적용
- [x] 공략 조회수 로직 분리 및 메타데이터 조회 부작용 제거
- [x] 커뮤니티 조회수/인기글 데이터 모델 재설계

## 3. 항목별 개선 내용

### 3.1 공략 HTML 서버 sanitization

기존에는 클라이언트 에디터 설정만 믿고 HTML을 저장했기 때문에, 악의적 사용자가 서버 액션을 직접 호출하면 저장형 XSS가 가능했다.

이번 버전에서는 서버 저장 직전에 공략 제목/본문을 sanitize하도록 변경했다.

- 서버 전용 sanitizer 유틸 추가
- 허용 태그/속성 화이트리스트 적용
- 공략 생성/수정 시 sanitize 결과만 저장
- 레거시 공략 상세 조회 시 안전하지 않은 HTML이 있으면 정제 후 동기화
- 가이드 모델에 sanitization version/시간 필드 추가

개선 효과:

- 저장형 XSS 위험 감소
- 상세 페이지, SEO 페이지, 관리자 세션 노출 위험 완화
- 기존 데이터도 점진적/배치 방식으로 안전한 상태로 수렴

추가 반영 결과:

- 기존 가이드 데이터 `36건` 재정제 완료

주요 반영 파일:

- `src/lib/guide-html.ts`
- `src/actions/guide.ts`
- `src/models/Guide.ts`

### 3.2 Presigned URL 인증 및 업로드 제한

기존에는 비로그인 사용자도 업로드 URL을 발급받을 수 있었고, 파일 크기/형식/요청 빈도 제어가 없었다.

이번 버전에서는 업로드 정책을 서버에서 강제하도록 변경했다.

- 로그인 사용자만 Presigned URL 발급 가능
- 허용 이미지 MIME 타입만 통과
- 파일당 최대 `8MB` 제한
- 사용자별 업로드 rate limit 적용: `10분 / 25회`
- 업로드 경로를 `scope/userId/yyyy/mm/dd/random` 구조로 정규화

개선 효과:

- 무인증 업로드 차단
- S3 비용 폭증 및 악성 파일 업로드 위험 완화
- 업로드 경로 관리와 추적성 개선

주요 반영 파일:

- `src/actions/upload.ts`
- `src/lib/upload-policy.ts`
- `src/lib/upload-client.ts`
- `src/lib/s3.ts`
- `src/app/community/CommunityClient.tsx`
- `src/components/Editor/RichTextEditorSimple.tsx`
- `src/app/guide/write/GuideWriteClient.tsx`

메모:

- 현재는 `presigned PUT` 기반이라 액션 단계에서 파일 크기를 검증한다.
- 더 강한 업로드 강제를 원하면 추후 `presigned POST` 또는 서버 프록시 업로드로 전환 가능하다.

### 3.3 공략 조회수 로직 분리

기존에는 공략 상세 조회 함수가 읽기와 조회수 증가를 동시에 수행했다. 그 결과 `generateMetadata`, OG 크롤러, 프리패치, 실제 페이지 진입이 모두 조회수에 반영될 수 있었고, 캐시와 DB의 `views` 값도 쉽게 어긋났다.

이번 버전에서는 공략 조회를 `read-only`와 `increment`로 분리했다.

- `getGuideById`를 읽기 전용 함수로 전환
- `incrementGuideView`를 별도 액션으로 분리
- 메타데이터 생성은 read-only 조회만 사용
- 상세 페이지는 서버에서 초기 데이터를 읽어 클라이언트에 전달
- hydration 후 조회수만 별도로 1회 반영
- 로그인 사용자는 `userId`, 비로그인은 `viewer cookie` 기준으로 24시간 dedupe 적용

개선 효과:

- 메타데이터 생성/봇 접근으로 인한 조회수 오염 감소
- 캐시된 상세 데이터와 DB 조회수 불일치 완화
- 상세 페이지 초기 렌더 품질 개선

주요 반영 파일:

- `src/actions/guide.ts`
- `src/app/guide/[id]/page.tsx`
- `src/app/guide/[id]/TipDetailClient.tsx`

### 3.4 커뮤니티 조회수/인기글 구조 재설계

기존에는 `Post.viewHistory[]`에 조회 이력을 계속 누적하고, 인기글 계산 시 이 배열을 `$filter + $reduce`로 매번 다시 계산했다. 이 구조는 조회가 쌓일수록 문서 크기와 집계 비용이 같이 증가한다.

이번 버전에서는 조회 이력을 별도 집계 컬렉션으로 분리했다.

- 새 컬렉션 `post_daily_stats` 도입
- `Post`에는 화면 표시용 `viewCount`만 유지
- 커뮤니티 조회수 증가는 `Post.viewCount + post_daily_stats upsert` 구조로 변경
- `viewHistory`는 더 이상 새로 기록하지 않고 legacy/backfill 호환 용도로만 유지
- 인기글 집계는 `post_daily_stats`의 기간 합계를 기준으로 계산
- bot user-agent 필터와 24시간 dedupe 추가
- 커뮤니티 상세 페이지도 서버 초기 데이터 + hydration 후 조회수 반영 구조로 정리

개선 효과:

- `Post` 문서 비대화 방지
- 인기글 집계 비용 감소
- 조회수/인기글 왜곡 감소
- 장기적으로 `weekly/monthly trending` 확장에 유리한 구조 확보

주요 반영 파일:

- `src/models/Post.ts`
- `src/models/PostDailyStat.ts`
- `src/actions/post.ts`
- `src/app/community/[id]/page.tsx`
- `src/app/community/[id]/PostDetailClient.tsx`
- `scripts/backfill-post-daily-stats.ts`

추가 반영 결과:

- 레거시 `viewHistory` 백필 결과:
  - 대상 게시글 `6개`
  - 일별 버킷 `25개`
  - 조회 `42회`
  - `25건 upsert`

## 4. 무엇이 개선됐는가

### 보안

- 공략 본문이 서버에서 정제되므로 저장형 XSS 위험이 크게 줄었다.
- 업로드 URL 발급이 인증 기반으로 바뀌어 비로그인 남용이 차단됐다.

### 데이터 무결성

- 공략 조회수는 이제 메타데이터 생성과 분리되어 실제 사용자 조회에 더 가깝게 집계된다.
- 커뮤니티 조회수도 dedupe와 bot 필터가 적용되어 새로고침/크롤러 왜곡이 완화됐다.

### 성능과 확장성

- 커뮤니티 인기글은 더 이상 모든 게시글의 `viewHistory` 배열을 다시 훑지 않는다.
- 조회 이력이 `post_daily_stats`로 압축되어, 데이터가 커질수록 차이가 더 커지는 구조적 개선이 들어갔다.

### 운영 안정성

- 업로드 정책, 조회 dedupe, 레거시 백필 스크립트까지 포함돼 운영 중 데이터 일관성을 유지하기 쉬워졌다.
- 보안/집계 로직이 클라이언트 편의 설정이 아니라 서버 정책으로 이동했다.

## 5. 검증 결과

- `npm run build`: 성공
- `npm run lint`: 성공

현재 남아 있는 lint 경고는 기존 `src/app/community/CommunityClient.tsx`의 경고 5건뿐이며, 이번 버전 작업으로 새 에러는 추가되지 않았다.

## 6. 잔여 과제

이번 버전으로 P0 수준의 주요 구조 리스크는 대부분 정리됐다. 다만 아래 항목은 후속 개선 가치가 남아 있다.

- `CommunityClient.tsx`의 hook dependency / unused expression 경고 정리
- 업로드를 `presigned POST` 또는 서버 프록시 방식으로 강화
- `Post.viewHistory` legacy 필드 최종 제거
- 커뮤니티/가이드 목록 DTO 경량화
- 핵심 페이지의 Server-first 전환 확대

## 7. 결론

v1.0.2는 사용자에게 바로 보이는 기능 추가보다는, 서비스가 커졌을 때 먼저 터질 보안/집계/운영 구조를 정리하는 데 집중한 버전이다. 이번 반영으로 Mabi Life는 콘텐츠 안전성, 업로드 통제, 조회수 신뢰성, 커뮤니티 인기글 확장성 측면에서 이전보다 훨씬 안정적인 기반을 갖추게 됐다.
