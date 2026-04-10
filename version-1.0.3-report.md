# Mabi Life v1.0.3 계획 보고서

- 작성일: 2026-04-10
- 기준: `v1.0.2`까지 반영된 개선 이후 남아 있는 기술, 제품, 수익화 과제
- 목표: 성능, SEO, 데이터 전송량, 랭킹 캐시, 테스트 기반, 제품 리텐션 구조를 강화하는 다음 단계 실행 계획 정리

## 1. 요약

v1.0.2에서 보안, 업로드 제어, 조회수 무결성, 커뮤니티 통계 구조 개편까지 끝냈다면, v1.0.3의 핵심은 `사용자 체감 성능`과 `제품화 완성도`를 끌어올리는 것이다. 특히 아직 남아 있는 가장 큰 과제는 핵심 페이지의 Client-first 구조, 과도한 리스트 payload, 약한 랭킹 캐시, 테스트 부재다.

이번 버전은 새 보안 이슈를 막는 단계가 아니라, 이미 만들어 둔 기능을 더 빠르고 안정적으로 제공하고, 이후 개인화/알림/유료화 실험으로 이어질 수 있게 기반을 정리하는 단계로 정의한다.

## 2. v1.0.3 핵심 체크리스트

- [ ] `/community`, `/guide`, `/ranking`, `/search`를 Server-first 구조로 전환
- [ ] 리스트 DTO 경량화 및 Mongo projection 최소화
- [ ] 랭킹 조회/통계 캐시 계층 추가
- [ ] `CommunityClient.tsx` lint 경고 제거 및 구조 정리
- [ ] 테스트 체계 도입
- [ ] Font Awesome 전역 CDN 의존 축소
- [ ] TinyMCE 자산 경량화 또는 대체 검토
- [ ] React cache / Next cache 활용 범위 확대

## 3. 우선순위별 작업 범위

### P1. 다음 스프린트에서 바로 진행할 항목

#### 3.1 핵심 페이지 Server-first 전환

현재 `/community`, `/guide`, `/ranking`, `/search`는 대부분 클라이언트 셸을 먼저 렌더하고 hydration 후 데이터를 불러오는 구조다. 이 방식은 첫 화면 체감 성능과 SEO 효율을 동시에 깎는다.

작업 목표:

- 목록/상세 기본 데이터를 Server Component에서 먼저 로드
- 메타데이터와 본문이 같은 read path를 공유하도록 정리
- 좋아요, 댓글 작성, 필터 변경, 정렬 변경만 Client island로 유지

대상 파일:

- `src/app/community/page.tsx`
- `src/app/guide/page.tsx`
- `src/app/ranking/page.tsx`
- `src/app/search/page.tsx`
- 각 Client 컴포넌트

기대 효과:

- LCP 개선
- 검색엔진 본문 노출 품질 개선
- 클라이언트 재요청 감소

#### 3.2 리스트 DTO 경량화

현재는 목록, 홈, 검색에서도 전체 `content`, `likedBy`, `bookmarkedBy` 같은 무거운 필드를 내려보내는 경로가 있다. preview만 필요한 화면에서 payload가 불필요하게 크다.

작업 목표:

- `GuideListItem`, `GuideDetail`, `PostListItem`, `PostDetail` DTO 분리
- 목록 API에서 `content` 전체 HTML, 대형 배열, 불필요 메타 제거
- preview text를 서버에서 미리 계산
- Mongo `select` / `projection` 최소화

대상 파일:

- `src/actions/guide.ts`
- `src/actions/post.ts`
- `src/app/page.tsx`
- `src/app/search/SearchClient.tsx`
- `src/app/guide/GuideClient.tsx`
- `src/app/community/CommunityClient.tsx`

기대 효과:

- 네트워크 payload 축소
- hydration 비용 감소
- 홈/목록/검색 응답 속도 개선

#### 3.3 랭킹 캐시 및 집계 구조 보강

랭킹 조회는 아직 최신 배치를 읽은 뒤 애플리케이션 레벨에서 정렬/가공하는 부분이 많다. 데이터량이 커지면 비용이 빠르게 증가한다.

작업 목표:

- `type/server/job` 조합별 캐시 계층 추가
- `unstable_cache` 또는 Redis 기반 캐시 도입
- Mongo aggregation으로 top N, 분포 집계를 DB로 이동
- 장기적으로 일자별 materialized summary 컬렉션 설계

대상 파일:

- `src/actions/ranking.ts`
- `src/actions/getRankings.ts`
- `src/app/ranking/RankingClient.tsx`

기대 효과:

- 랭킹 페이지 응답 안정화
- 필터 변경 시 서버 부하 감소
- 추후 히스토리/비교 기능 준비

#### 3.4 `CommunityClient.tsx` 경고 정리

현재 lint는 성공하지만, `CommunityClient.tsx`에 hook dependency 경고와 불필요 표현식 경고가 남아 있다. 이 상태는 stale state, 중복 호출, 유지보수 비용 증가로 이어질 수 있다.

작업 목표:

- effect dependency 정리
- `useEffectEvent` / 명시적 콜 경로로 중복 호출 제거
- no-unused-expressions 경고 제거

대상 파일:

- `src/app/community/CommunityClient.tsx`

기대 효과:

- 상태 동기화 오류 가능성 감소
- 이후 Server-first 전환 시 마이그레이션 난이도 감소

#### 3.5 테스트 체계 도입

현재는 `lint`와 `build` 외 별도 품질 게이트가 없다. Server Action과 캐시 무효화 로직이 늘어난 현재 구조에서는 회귀 리스크가 커졌다.

작업 목표:

- 최소한의 테스트 러너 도입
- `actions` 단위 통합 테스트
- 상세 페이지 smoke test
- 업로드 인증/권한 경로 E2E 또는 최소 시나리오 테스트

우선 테스트 후보:

- `src/actions/guide.ts`
- `src/actions/post.ts`
- `src/actions/upload.ts`
- `src/app/guide/[id]/page.tsx`
- `src/app/community/[id]/page.tsx`

기대 효과:

- 회귀 방지
- 이후 기능 확장 시 배포 안정성 개선

### P2. 중기 개선 항목

#### 3.6 Font Awesome 전역 CDN 제거 또는 축소

전역 CDN CSS는 모든 페이지에 렌더 차단 비용을 만든다.

작업 목표:

- 자주 쓰는 아이콘을 SVG 컴포넌트로 치환
- 최소한 self-host 또는 subset 방식으로 축소

대상 파일:

- `src/app/layout.tsx`
- 공용 아이콘 사용 컴포넌트

#### 3.7 TinyMCE 자산 경량화

현재 write 페이지에서만 동적 로드되는 점은 괜찮지만, 정적 자산 규모가 여전히 크다.

작업 목표:

- TinyMCE 실제 사용 플러그인만 남기는 축소
- 또는 더 가벼운 에디터 대체 가능성 검토

대상 파일:

- `public/tinymce`
- 에디터 래퍼 컴포넌트

#### 3.8 읽기 경로 캐시 확대

현재 홈만 일부 `unstable_cache`를 쓰고 있고, 다른 주요 읽기 경로는 React cache / Next cache 활용이 제한적이다.

작업 목표:

- 읽기 전용 액션에 React cache 적용
- 서버 렌더 경로 캐시 전략 명시화
- list/detail 캐시 키 설계 정리

## 4. 기능 보완 후보

### 공략

- [ ] 패치 버전, 최신 업데이트 일자, 추천/북마크/완독률 기반 정렬 추가
- [ ] 작성자 프로필, 관련 공략, 태그 추천, 비슷한 공략 묶기
- [ ] 공략 수정 이력과 최종 패치 반영 여부 노출

### 커뮤니티

- [ ] 질문글 템플릿, solved ratio, 베스트 답변 하이라이트
- [ ] 신고/숨김/차단, 스팸 방지, rate limit
- [ ] 인기글 계산을 최근 반응 중심으로 추가 고도화

### 랭킹/통계

- [ ] 날짜 비교, 직업별 상승/하락, 서버별 메타 변화
- [ ] 특정 캐릭터 추적, 즐겨찾기, 알림
- [ ] 랭킹 히스토리와 패치 시점 마커

### 숙제

- [ ] 멀티 캐릭터 대시보드
- [ ] 리셋 알림, 길드 공유 숙제, 파티/레이드 체크리스트
- [ ] 모바일 설치형 PWA와 푸시 알림

## 5. 제품 확장 우선순위 Top 5

### 5.1 알림 허브

- 설명: 공식 공지, 랭킹 변동, 주간 초기화, 인기 공략을 한곳에서 구독
- 이유: 기존 기능을 묶어 재방문 루프를 만들기 가장 쉽다

### 5.2 빌드 시뮬레이터 + 룬 프리셋 저장

- 설명: 직업별 추천 룬 조합을 저장, 비교, 공유하는 기능
- 이유: 읽기 전용 룬 기능을 반복 사용 도구로 바꿀 수 있고, 향후 유료화 포인트도 명확하다

### 5.3 길드 허브

- 설명: 길드 모집, 일정, 공지, 공유 숙제 보드, 디스코드 연결
- 이유: 개인 유틸리티를 팀 단위 도구로 확장할 수 있다

### 5.4 공략 신뢰도 시스템

- 설명: 패치 버전, 작성자 신뢰도, 최신성, 북마크 수, 댓글 해결률 표시
- 이유: UGC가 쌓일수록 품질 신호가 중요해진다

### 5.5 개인화 홈 + 저장 기능

- 설명: 최근 본 공략, 저장한 글, 관심 서버/직업, 내 숙제 상태를 홈에 요약
- 이유: 로그인 전환과 재방문 둘 다 강화할 수 있다

## 6. 수익화 실험 후보

### 6.1 `Mabi Life Plus` 구독

- [ ] 광고 제거
- [ ] 다중 캐릭터 고급 관리
- [ ] 알림 허브
- [ ] 저장 프리셋/비교/랭킹 추적
- [ ] 길드 관리 기능 일부

검증 목표:

- 잠금 배지 + 대기열 폼으로 관심 등록률 측정

### 6.2 광고 + 네이티브 스폰서십

- [ ] 홈/공략 하단 제한 슬롯 실험
- [ ] CTR, 이탈률, 체류시간 영향 측정

### 6.3 길드/크리에이터용 Pro 도구

- [ ] 길드 모집 페이지
- [ ] 출석/숙제/레이드 관리
- [ ] 대표 공략/영상 노출

### 6.4 제휴/커머스 수익

- [ ] 룬/성장 공략 하단 제휴 추천 슬롯 테스트
- [ ] CTR, 전환률, 불만 비율 측정

우선 테스트 추천:

- [ ] `Mabi Life Plus`
- [ ] 제한적 네이티브 스폰서십

## 7. 추적 KPI

### 기술

- [ ] LCP, INP, CLS
- [ ] Server Action p95 응답 시간
- [ ] Redis / Next cache hit ratio
- [ ] 랭킹 통계 쿼리 시간
- [ ] HTML payload / JS payload 크기

### 제품

- [ ] 주간 활성 사용자
- [ ] 로그인 전환율
- [ ] 숙제 트래커 D7 재방문율
- [ ] 질문글 해결률
- [ ] 검색 후 클릭률
- [ ] 저장/북마크 사용률

### 매출

- [ ] 광고 RPM
- [ ] 구독 전환율
- [ ] 유료 기능 대기열 등록률
- [ ] 유료 사용자 30일 유지율

## 8. 권장 실행 순서

### 0주 ~ 2주

1. `/guide`, `/community`, `/ranking`, `/search` Server-first 전환
2. list DTO / projection 경량화
3. `CommunityClient.tsx` lint 경고 정리
4. 테스트 러너와 최소 smoke/integration test 도입

### 2주 ~ 6주

1. 랭킹 조회/통계 캐시 계층 추가
2. 읽기 경로 캐시 확대
3. Font Awesome / TinyMCE 자산 최적화
4. 검색 고도화 방향 결정

### 6주 ~ 12주

1. 알림 허브
2. 저장/프리셋/개인화 홈
3. 길드 허브
4. `Mabi Life Plus`와 스폰서십 실험

## 9. 결론

v1.0.3의 목적은 새 기능을 많이 붙이는 것이 아니라, 현재 이미 존재하는 기능들을 더 빠르고, 더 가볍고, 더 신뢰성 있게 제공하는 기반을 만드는 것이다. 이 단계가 정리돼야 이후 알림, 개인화, 길드 기능과 수익화 실험이 성능 저하나 운영 리스크 없이 이어질 수 있다.
