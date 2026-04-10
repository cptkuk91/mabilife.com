# Mabi Life

[mabilife.com](https://www.mabilife.com)

마비노기 모바일의 공략, 랭킹, 통계, 커뮤니티를 한곳에서 제공하는 웹 서비스입니다.

Mabi Life는 공략 탐색, 커뮤니티 소통, 전투력 랭킹 확인, 통계 조회, 룬 추천, 숙제 관리까지 한 흐름으로 연결하는 것을 목표로 합니다.

Next.js 16 App Router 기반으로 구축되었으며, MongoDB, Redis, AWS S3, Puppeteer 기반 랭킹 자동 수집 구조를 포함합니다.

## 주요 기능

### 공략
카테고리별(초보 가이드, 전투/던전, 메인스트림, 생활/알바, 돈벌기) 공략을 작성하고 검색할 수 있습니다. TinyMCE 기반 리치 텍스트 작성, 이미지 업로드, 슬러그 기반 URL을 지원합니다.

### 커뮤니티
질문, 정보, 잡담 게시판을 제공합니다. 댓글/답글, 좋아요, 질문글 답변 채택 기능을 포함합니다.

### 랭킹 / 통계
Puppeteer로 마비노기 모바일 공식 랭킹 페이지를 자동 수집하여 서버별/직업별 전투력 랭킹을 제공합니다. 수집된 데이터를 바탕으로 직업 분포와 서버 통계도 함께 확인할 수 있습니다.

### 룬 추천
직업별 최적의 룬 조합 정보를 제공합니다.

### 숙제 트래커
캐릭터별로 일일/주간 숙제를 체크리스트로 관리할 수 있습니다. 로그인하지 않아도 데모 모드로 체험할 수 있습니다.

## 서비스 특징

- 공략 HTML은 서버에서 정제되어 렌더링 안전성을 강화했습니다.
- 이미지 업로드는 로그인 사용자만 가능하며, 파일 형식/용량/요청 횟수 제한이 적용됩니다.
- 공략과 커뮤니티 조회수는 중복 집계를 줄이도록 정리되어 있습니다.
- 커뮤니티 인기글은 일별 통계 기반으로 계산되어 장기 확장에 유리합니다.

## 기술 스택

- **Framework**: Next.js 16 (App Router, Server Actions, Server Components)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: MongoDB Atlas (Mongoose ODM)
- **Auth**: NextAuth.js v4 (Google OAuth)
- **Storage**: AWS S3 + CloudFront CDN
- **Cache**: Redis (ioredis, 로컬에서는 선택 사항 / 운영에서는 권장)
- **Crawling**: Puppeteer + @sparticuz/chromium (서버리스 환경 지원)
- **Deploy**: Vercel (Cron Job으로 랭킹 자동 크롤링)

## 시작하기

### 요구 사항

- Node.js 22 이상
- MongoDB (Atlas 권장)
- Google OAuth 2.0 Client ID ([발급 가이드](https://developers.google.com/identity/protocols/oauth2))

### 설치

```bash
git clone https://github.com/AutoBotLog/mabinogimobile.git
cd mabinogimobile
npm install
```

### 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 열고 값을 채워주세요.

#### 필수 항목

| 변수 | 설명 | 발급처 |
|------|------|--------|
| `MONGODB_URL` | 메인 DB 연결 문자열 | [MongoDB Atlas](https://cloud.mongodb.com/) |
| `MONGODB_AUTH_URL` | 인증 DB 연결 문자열 | MongoDB Atlas (별도 DB 또는 동일 클러스터) |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | [Google Cloud Console](https://console.cloud.google.com/) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | Google Cloud Console |
| `NEXTAUTH_SECRET` | 세션 암호화 키 | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | 사이트 URL | 로컬: `http://localhost:3000` |

#### 선택 항목

| 변수 | 설명 | 미설정 시 |
|------|------|-----------|
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | S3 이미지 업로드 | 이미지 업로드 불가 |
| `S3_BUCKET_NAME` / `AWS_REGION` | S3 버킷 설정 | 이미지 업로드 불가 |
| `NEXT_PUBLIC_CLOUDFRONT_URL` | CDN URL | S3 직접 URL 사용 |
| `YOUTUBE_API_KEY` | 유튜버 채널 정보 | 홈 크리에이터 섹션 미표시 |
| `NEXT_PUBLIC_GA_ID` | Google Analytics | 트래킹 비활성화 |
| `USE_REDIS` / `REDIS_URL` | Redis 캐싱, 업로드 제어, 조회수 dedupe | 로컬 fallback으로 동작하지만 운영에서는 Redis 권장 |

### 실행

```bash
# 개발 서버
npm run dev

# 프로덕션 빌드
npm run build
npm start
```

`http://localhost:3000`에서 확인할 수 있습니다.

### 배포

Vercel에 배포하는 것을 권장합니다. `vercel.json`에 랭킹 크롤링 Cron Job이 설정되어 있습니다 (매일 자정 실행).

```bash
vercel deploy
```

## 프로젝트 구조

```
src/
├── actions/           # Server Actions (공략, 커뮤니티, 랭킹, 업로드 등)
├── app/               # Next.js App Router
│   ├── api/
│   │   ├── auth/      # NextAuth API Route
│   │   └── cron/      # Vercel Cron (랭킹 크롤링)
│   ├── guide/         # 공략 (목록, 상세, 작성)
│   ├── community/     # 커뮤니티 (목록, 상세)
│   ├── ranking/       # 랭킹
│   ├── statistics/    # 통계
│   ├── runes/         # 룬 추천
│   ├── homework/      # 숙제 트래커
│   └── search/        # 통합 검색
├── components/        # 공통 UI 컴포넌트
├── lib/               # 인증, DB, 업로드, 캐시, 크롤러 유틸리티
├── models/            # Mongoose 스키마
├── scripts/           # 데이터 백필/운영 스크립트
└── types/             # TypeScript 타입 정의
```

## Contributing

1. 이 저장소를 Fork합니다.
2. Feature 브랜치를 생성합니다. (`git checkout -b feature/my-feature`)
3. 변경 사항을 커밋합니다. (`git commit -m 'Add my feature'`)
4. 브랜치에 Push합니다. (`git push origin feature/my-feature`)
5. Pull Request를 생성합니다.

## License

MIT License - [LICENSE](LICENSE) 파일을 참고하세요.
