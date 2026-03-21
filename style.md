# Tailwind 전환 작업 계획

## 목표
- 프로젝트 소유 CSS를 Tailwind 기반으로 전환한다.
- 전환 과정에서 기존 UI를 먼저 안정적으로 유지하고, 이후 필요한 화면만 디자인 개선을 진행한다.
- 중복 스타일 정의를 줄이고, 전역 토큰과 반복 패턴을 Tailwind 유틸리티/컴포넌트 조합으로 통합한다.

## 현재 상태
- Tailwind는 아직 설치되어 있지 않다.
- 현재 스타일 구조는 `src/app/globals.css` + CSS Module 14개로 구성되어 있다.
- 프로젝트 소유 CSS Module 총량은 약 `6,345`줄이다.
- 전역 토큰은 현재 [globals.css](/Users/kukjinlee/Desktop/mabinogimobile/src/app/globals.css)에 모여 있다.
- 루트 레이아웃은 [layout.tsx](/Users/kukjinlee/Desktop/mabinogimobile/src/app/layout.tsx)에서 `globals.css`를 불러오는 구조다.

## 전환 범위
- 포함
  - `src/app/globals.css`
  - `src/app/**/*.module.css`
  - `src/components/**/*.module.css`
- 제외
  - `public/tinymce/**`
  - 외부 CDN 스타일

## 기본 원칙
- Tailwind를 기본 스타일 시스템으로 사용한다.
- 전역 색상, radius, shadow, spacing 의미값은 Tailwind theme 또는 CSS variable 기반 토큰으로 이관한다.
- 한 번 쓰고 끝나는 스타일은 유틸리티 클래스로 직접 작성한다.
- 반복되는 카드, 섹션 헤더, 버튼, 배지, 입력창 패턴은 공용 JSX 패턴으로 정리한다.
- Tailwind로 바꾼 뒤 더 이상 쓰지 않는 CSS Module은 즉시 삭제한다.
- 화면 마이그레이션은 페이지 단위가 아니라 "공용 레이아웃 -> 공유 컴포넌트 -> 기능 화면" 순서로 진행한다.

## 기술 방향
- 도입 기준은 Next.js 공식 가이드 기준 Tailwind 설정을 따른다.
- 기본 방향
  - `tailwindcss`
  - `@tailwindcss/postcss`
  - `postcss`
- `globals.css`는 최종적으로 아래 역할만 남긴다.
  - `@import "tailwindcss";`
  - 전역 theme token 선언
  - base layer
  - 외부 라이브러리와 충돌 방지용 최소 보정

## 선행 작업
1. Tailwind 설치 및 PostCSS 설정 추가
2. `globals.css`를 Tailwind 진입점으로 축소
3. 현재 CSS 변수들을 Tailwind 토큰으로 매핑
4. 공용 패턴 정의
   - 카드
   - 섹션 헤더
   - pill/tag
   - 입력창
   - floating button
   - avatar/meta row

## 권장 작업 순서

### Phase 0. 기반 구성
- Tailwind 설치
- `postcss.config.*` 추가
- `globals.css`를 Tailwind 기준으로 재구성
- 공용 색상/반경/그림자 토큰 정리
- 완료 기준
  - 앱이 Tailwind 클래스만으로 정상 렌더링 가능
  - 전역 typography/background/token이 깨지지 않음

### Phase 1. 레이아웃/공용 셸 전환
- 대상
  - [layout.tsx](/Users/kukjinlee/Desktop/mabinogimobile/src/app/layout.tsx)
  - `Navbar.tsx`
  - `Footer.tsx`
  - [globals.css](/Users/kukjinlee/Desktop/mabinogimobile/src/app/globals.css)
  - `src/components/Footer.module.css`
- 목적
  - 상단 네비, 하단 푸터, body/background, 기본 spacing 체계를 먼저 Tailwind로 고정

### Phase 2. 저위험 화면 전환
- 대상
  - `src/app/login/login.module.css` 61줄
  - `src/app/ranking/ranking.module.css` 296줄
  - `src/app/statistics/statistics.module.css` 283줄
- 목적
  - 상대적으로 단순한 화면에서 Tailwind 패턴을 먼저 안정화

### Phase 3. 공유 카드형 컴포넌트 전환
- 대상
  - `src/components/event-list.module.css` 227줄
  - `src/components/YouTuberSection.module.css` 244줄
  - `src/app/home.module.css` 723줄
  - `src/app/search/search.module.css` 378줄
- 목적
  - 카드, 리스트, 검색 결과, hero, section header 같은 반복 패턴을 공용화

### Phase 4. 가이드/정보형 화면 전환
- 대상
  - `src/app/guide/guide.module.css` 562줄
  - `src/app/guide/write/write.module.css` 229줄
  - `src/app/runes/runes.module.css` 372줄
  - `src/app/homework/homework.module.css` 587줄
- 목적
  - 상세한 카드/폼/탭/목록 패턴을 Tailwind 기준으로 통일

### Phase 5. 고난도 화면 전환
- 대상
  - `src/app/guide/[id]/tipDetail.module.css` 745줄
  - `src/app/community/community.module.css` 1,568줄
- 목적
  - 가장 크고 상호작용이 많은 화면을 마지막에 옮긴다.
  - 앞 단계에서 정리한 공용 패턴을 최대한 재사용한다.

### Phase 6. 정리
- 모든 CSS Module import 제거 여부 확인
- 미사용 CSS 파일 삭제
- 스타일 관련 dead code 정리
- Tailwind class 중복 패턴이 심한 구간은 작은 컴포넌트로 다시 정리

## 파일 우선순위
1. 전역 셸
   - [layout.tsx](/Users/kukjinlee/Desktop/mabinogimobile/src/app/layout.tsx)
   - [globals.css](/Users/kukjinlee/Desktop/mabinogimobile/src/app/globals.css)
   - `Navbar.tsx`
   - `Footer.tsx`
2. 작은 화면
   - 로그인
   - 랭킹
   - 통계
3. 공용 패턴 많은 화면
   - 홈
   - 검색
   - 이벤트/유튜버 섹션
4. 중간 난도
   - 공략 목록
   - 공략 작성
   - 룬
   - 숙제
5. 고난도
   - 공략 상세
   - 커뮤니티

## 구현 규칙
- 새 JSX에는 CSS Module을 추가하지 않는다.
- 전환 중인 파일은 "Tailwind만 사용"을 원칙으로 한다.
- 임시 혼합 상태는 허용하되, 한 화면 안에서 Tailwind/CSS Module을 장기간 섞어두지 않는다.
- `style` 인라인 객체는 정말 필요한 동적 값에만 사용한다.
- 조건부 클래스는 헬퍼 함수 또는 단순 삼항식으로 정리한다.
- 색상/여백/반경은 임의값 남발보다 토큰 우선으로 맞춘다.

## 반복 패턴 후보
- `card`
- `cardHeader`
- `cardFooter`
- `sectionHeader`
- `pill/tag`
- `search input`
- `primary button`
- `ghost button`
- `avatar + author meta`
- `stats row`
- `floating action button`

## 위험 요소
- 현재 `globals.css`에 전역 네비/모바일 도크/드롭다운 스타일이 많이 들어 있어 초기 분리가 필요하다.
- 커뮤니티/공략 상세는 상태, 댓글, 액션 버튼이 많아 클래스 문자열이 과도하게 길어질 수 있다.
- TinyMCE 영역은 프로젝트 CSS만 바꾸고, vendor skin은 유지해야 한다.
- `img`/`Image` 혼용 구간은 스타일 전환 중 레이아웃 흔들림이 생길 수 있다.

## 검증 체크리스트
- 주요 페이지 desktop/mobile 레이아웃 유지
- hover, focus, active, disabled 상태 유지
- sticky/fixed 요소 정상 동작
- 드롭다운/모달/플로팅 버튼 z-index 이상 없음
- 검색/탭/정렬/더보기 등 인터랙션 시 레이아웃 점프 없음
- hydration warning 없음
- 각 화면 전환 후 대응 CSS Module 삭제 완료

## 완료 정의
- 프로젝트 소유 CSS Module import가 0개다.
- `globals.css`는 Tailwind 진입점과 최소 전역 보정만 남는다.
- 새 스타일 수정이 CSS 파일이 아니라 JSX/Tailwind 토큰 기준으로 가능하다.
- 가장 큰 화면인 커뮤니티/공략 상세까지 Tailwind로 이관 완료한다.

## 메모
- 실제 착수 시 첫 PR은 "Tailwind 도입 + globals 정리 + Navbar/Footer 전환"으로 자르는 것이 가장 안전하다.
- 가장 큰 리스크는 한 번에 전부 바꾸는 것이다. 페이지 단위로 잘라서 삭제까지 같이 가야 한다.
