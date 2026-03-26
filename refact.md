# Refactoring Checklist - Open Source 전환 준비

> 프로젝트 전체 스캔 결과 (2026-03-26)

---

## 1. Console 문 (17건)

### 1-1. Logger 유틸리티 (유지 가능)

| 파일 | 라인 | 내용 | 비고 |
|------|------|------|------|
| `src/lib/logger.ts` | 6 | `console.log(...args)` | dev 환경 전용 |
| `src/lib/logger.ts` | 11 | `console.warn(...args)` | dev 환경 전용 |
| `src/lib/logger.ts` | 15 | `console.error(...args)` | 항상 실행 |

### 1-2. 한국어 console.error (제거 또는 영문 전환 필요)

| 파일 | 라인 | 내용 |
|------|------|------|
| `src/lib/auth.ts` | 49 | `console.error("로그인 에러:", error)` |
| `src/lib/auth.ts` | 75 | `console.error("JWT 콜백 에러:", error)` |

### 1-3. 영문 console.error (logger 교체 또는 제거 검토)

| 파일 | 라인 | 내용 |
|------|------|------|
| `src/app/guide/write/GuideWriteClient.tsx` | 94 | `console.error("Failed to get presigned URL:", error)` |
| `src/app/guide/write/GuideWriteClient.tsx` | 108 | `console.error("Failed to upload to S3")` |
| `src/app/guide/write/GuideWriteClient.tsx` | 115 | `console.error("Upload error:", error)` |
| `src/components/Editor/RichTextEditorSimple.tsx` | 139 | `console.error('Image upload failed:', error)` |
| `src/components/Editor/RichTextEditorSimple.tsx` | 189 | `console.error('Editor initialization error:', err)` |
| `src/components/Editor/RichTextEditorSimple.tsx` | 206 | `console.warn('Failed to destroy editor:', e)` |
| `src/actions/upload.ts` | 10 | `console.error("Presigned URL error:", error)` |
| `src/lib/tinymce-loader.ts` | 107 | `console.error('Failed to load TinyMCE script')` |
| `src/app/HomeClient.tsx` | 525 | `console.error("Home search failed:", e)` |

### 1-4. 최소 정보 console.error (제거 권장)

| 파일 | 라인 | 내용 | 이유 |
|------|------|------|------|
| `src/app/statistics/StatisticsClient.tsx` | 56 | `console.error(e)` | 에러 컨텍스트 없음 |
| `src/app/ranking/RankingClient.tsx` | 96 | `console.error(e)` | 에러 컨텍스트 없음 |
| `src/app/homework/HomeworkClient.tsx` | 64 | `console.error(e)` | 에러 컨텍스트 없음 |

**조치 방안**: `logger.ts` 유틸리티로 통합하거나 제거. 한국어 메시지는 영문으로 전환.

---

## 2. 주석 처리된 코드 (4건)

| 파일 | 라인 | 내용 | 비고 |
|------|------|------|------|
| `src/app/api/cron/crawl-ranking/route.ts` | 26 | `// await Ranking.deleteMany({})` | 대안 구현 주석 |
| `src/actions/ranking.ts` | 28 | `// await Ranking.deleteMany({})` | 동일 패턴 중복 |
| `src/app/layout.tsx` | 96 | `// google: "구글 서치 콘솔 인증 코드"` | placeholder |
| `src/app/layout.tsx` | 97 | `// naver: "네이버 서치어드바이저 인증 코드"` | placeholder |

**조치 방안**: 주석 처리된 코드 전부 삭제. 필요 시 git history에서 복원 가능.

---

## 3. 'use client' 사용 현황 (21건)

### 3-1. 올바르게 사용 중 (19건)

| 파일 | 사용 근거 |
|------|-----------|
| `src/components/Navbar.tsx` | usePathname, useSession, useState, useRef, useEffect, document API |
| `src/components/Footer.tsx` | usePathname |
| `src/components/AuthProvider.tsx` | SessionProvider (next-auth) |
| `src/components/Editor/RichTextEditorSimple.tsx` | useRef, useEffect, useState, useId, forwardRef, window API |
| `src/components/Editor/RichTextEditorWrapper.tsx` | dynamic() with ssr: false |
| `src/components/ui/ConfirmDialog.tsx` | onClick 이벤트 핸들러 |
| `src/app/HomeClient.tsx` | startTransition, useDeferredValue, useEffect, useRef, useState |
| `src/app/runes/RunesClient.tsx` | useState, useMemo, useDeferredValue |
| `src/app/homework/HomeworkClient.tsx` | useCallback, useEffect, useState, useSession, useRouter |
| `src/app/ranking/RankingClient.tsx` | useState, useEffect |
| `src/app/statistics/StatisticsClient.tsx` | useState, useEffect |
| `src/app/login/LoginClient.tsx` | signIn (next-auth OAuth) |
| `src/app/search/SearchClient.tsx` | Suspense, useEffect, useState, useSearchParams |
| `src/app/guide/GuideClient.tsx` | useRouter, useCallback, useEffect, useState, useSession |
| `src/app/guide/write/GuideWriteClient.tsx` | useState, useEffect, useRouter, useSearchParams, useSession |
| `src/app/guide/[id]/TipDetailClient.tsx` | useRouter, useCallback, useEffect, useState, useSession |
| `src/app/community/CommunityClient.tsx` | useRouter, useEffect, useState, useSession |
| `src/app/community/[id]/PostDetailClient.tsx` | useRouter, useSession, useCallback, useEffect, useState |
| `src/lib/tinymce-loader.ts` | window.tinymce 브라우저 API |

### 3-2. 제거 가능 - Server Component 전환 대상 (2건)

| 파일 | 이유 |
|------|------|
| `src/app/guide/GuideListView.tsx` | hooks/브라우저 API 미사용. 순수 프레젠테이션 컴포넌트 |
| `src/app/HomeSearchResults.tsx` | hooks/브라우저 API 미사용. 순수 프레젠테이션 컴포넌트 |

> **주의**: 두 파일 모두 Client Component 내에서 import되므로, `'use client'` 제거 시 실제 동작에 영향이 없는지 테스트 필요.

---

## 4. 한국어 하드코딩 문자열 (오픈소스 i18n 대비)

### 4-1. alert() 내 한국어 (35건)

| 파일 | 건수 | 주요 메시지 |
|------|------|-------------|
| `src/app/guide/write/GuideWriteClient.tsx` | 7 | 업로드 실패, 제목/내용 입력, 가이드 저장 실패 등 |
| `src/app/guide/[id]/TipDetailClient.tsx` | 7 | 로그인 필요, 삭제 실패, 수정 실패 등 |
| `src/app/community/CommunityClient.tsx` | 9 | 이미지 첨부 제한, 게시글 등록 실패, 좋아요 실패 등 |
| `src/app/community/[id]/PostDetailClient.tsx` | 12 | 댓글 작성 실패, 채택 실패, 수정 실패, 좋아요 실패 등 |

### 4-2. 한국어 주석 (14건)

| 파일 | 라인 | 내용 |
|------|------|------|
| `src/types/homework.ts` | 7-22 | `// 요일 던전`, `// 은동전`, `// 심층 던전`, `// 무료 상품` 등 |
| `src/app/guide/write/GuideWriteClient.tsx` | 75 | `// 수정 모드일 때 기존 데이터 불러오기` |
| `src/app/guide/write/GuideWriteClient.tsx` | 155 | `// 에디터에서 직접 콘텐츠 가져오기` |
| `src/lib/auth.ts` | 56 | `// 로그인 시 또는 토큰에 userId가 없을 때 DB에서 조회` |
| `src/actions/comment.ts` | 다수 | 댓글 관리 로직 관련 주석 |

### 4-3. 에러 상태 한국어 (1건)

| 파일 | 라인 | 내용 |
|------|------|------|
| `src/components/Editor/RichTextEditorSimple.tsx` | 191 | `setError('에디터 초기화에 실패했습니다.')` |

**조치 방안**:
- 상수 파일(`constants/messages.ts`)로 분리하거나 i18n 라이브러리(`next-intl`) 도입
- 주석은 영문으로 전환
- alert() -> toast UI 또는 커스텀 에러 핸들링으로 교체 권장

---

## 5. 보안 점검 (오픈소스 전환 필수)

### 5-1. .env / .env.local 상태

| 항목 | 상태 |
|------|------|
| `.gitignore`에 `.env*` 포함 | ✅ 정상 |
| git 트래킹 여부 | ✅ 미추적 (안전) |
| git history에 노출 여부 | ✅ 이력 없음 |

### 5-2. 오픈소스 전환 전 필수 조치

- [ ] `.env.example` 파일 생성 (placeholder 값으로 구성)
- [ ] 현재 사용 중인 모든 시크릿 키 로테이션 (MongoDB, Google OAuth, AWS, Redis, NextAuth, YouTube API)
- [ ] `git log --all -p` 전체 이력에서 시크릿 노출 여부 최종 확인
- [ ] 소스 코드 내 하드코딩된 민감 정보 없음 확인 ✅ (현재 안전)

### 5-3. .env.example 생성 권장 형식

```env
# Database
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/database
MONGODB_AUTH_URL=mongodb+srv://username:password@cluster.mongodb.net/auth

# Auth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=ap-northeast-2
S3_BUCKET_NAME=your_bucket_name

# Redis
REDIS_URL=redis://default:password@host:port
REDIS_HOST=your_redis_host
REDIS_PORT=your_redis_port
REDIS_PASSWORD=your_redis_password
```

---

## 6. 리팩토링 우선순위

| 순위 | 항목 | 영향도 | 난이도 |
|------|------|--------|--------|
| 1 | `.env.example` 생성 + 시크릿 로테이션 | Critical | 낮음 |
| 2 | 주석 처리된 코드 제거 (4건) | Medium | 낮음 |
| 3 | 최소 정보 console.error 제거/개선 (3건) | Medium | 낮음 |
| 4 | 한국어 console.error 영문 전환 (2건) | Medium | 낮음 |
| 5 | 한국어 주석 영문 전환 (14건) | Medium | 낮음 |
| 6 | 불필요한 `'use client'` 제거 (2건) | Low | 낮음 |
| 7 | console.error -> logger 유틸리티 통합 (9건) | Low | 중간 |
| 8 | alert() -> toast/커스텀 에러 UI 전환 (35건) | Low | 중간 |
| 9 | 한국어 alert 메시지 상수화/i18n (35건) | Low | 높음 |
