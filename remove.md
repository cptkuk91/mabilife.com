# remove.md

분석일: 2026-03-21

## 0. 작업 진행 현황

완료
- [x] `src/lib/s3-upload.ts` 제거
- [x] `src/components/GoogleAnalytics.tsx` 제거
- [x] `public/next.svg` 제거
- [x] `public/vercel.svg` 제거
- [x] `public/globe.svg` 제거
- [x] `public/window.svg` 제거
- [x] `public/file.svg` 제거
- [x] `src/app/homework/HomeworkClient.tsx` 미사용 선언 정리
- [x] `src/components/Footer.tsx` 미사용 선언 정리
- [x] `src/components/Navbar.tsx` 미사용 선언 정리
- [x] `src/actions/guide.ts` 미사용 선언 정리
- [x] `src/actions/guideComment.ts` 미사용 선언 정리
- [x] `src/actions/homework.ts` 미사용 선언 정리
- [x] `src/app/community/[id]/PostDetailClient.tsx` 미사용 선언 정리
- [x] `src/app/guide/GuideClient.tsx` 미사용 선언 정리
- [x] `src/app/guide/write/GuideWriteClient.tsx` 미사용 선언 정리
- [x] `src/app/search/SearchClient.tsx` 미사용 선언 정리
- [x] `src/lib/auth.ts` 미사용 선언 정리
- [x] `src/lib/crawler.ts` 미사용 선언 정리
- [x] `src/models/Rune.ts` 미사용 import 정리
- [x] `src/models/User.ts` 미사용 import 정리
- [x] `src/app/layout.tsx` 레거시 주석 정리
- [x] 미사용 의존성 `dotenv` 제거 완료
- [x] `README.md` 제거
- [x] `plan.md` 제거
- [x] `public/tinymce/README.md` 제거
- [x] `public/tinymce/CHANGELOG.md` 제거
- [x] `public/tinymce/package.json` 제거
- [x] `public/tinymce/bower.json` 제거
- [x] `public/tinymce/composer.json` 제거
- [x] `public/tinymce/tinymce.d.ts` 제거
- [x] 삭제/정리 후 `npm run build` 검증 완료

대기
- [ ] `public/BingSiteAuth.xml` 운영 여부 확인
- [ ] `public/naver00052002924961f6ee72b77324282076.html` 운영 여부 확인
- [ ] `public/ads.txt` 운영 여부 확인

분석 기준
- `rg`로 프로젝트 전체 import/path 참조 확인
- `npm run build` 통과 확인
- `npm run lint` 및 `./node_modules/.bin/eslint src` 결과 확인
- `src/lib/tinymce-loader.ts`, `src/components/Editor/RichTextEditorSimple.tsx` 기준으로 TinyMCE 실제 런타임 사용 범위 확인

제외한 항목
- `public/manifest.json`, `public/assets/logo/kakao-logo.webp`, `public/assets/og-image.png`, `public/assets/placeholder/mm1.webp`, `public/assets/placeholder/mm2.jpg`, `public/assets/placeholder/mm3.jpg` 는 실제 사용 중이라 제거 후보에서 제외
- `public/tinymce/license.txt`, `public/tinymce/notices.txt` 는 라이선스/고지 성격이라 제거 후보에서 제외

## 1. 바로 제거 가능한 high-confidence 후보

| 상태 | 경로 | 분류 | 근거 |
| --- | --- | --- | --- |
| [x] | `src/lib/s3-upload.ts` | 죽은 파일 | 프로젝트 내부 inbound reference 0개. 현재 업로드 경로는 `src/actions/upload.ts` -> `src/lib/s3.ts` 를 사용 중. 이 파일만 `nanoid`를 참조하는데 `package.json`에는 `nanoid`가 없어서 사실상 방치된 레거시 모듈로 보임. |
| [x] | `src/components/GoogleAnalytics.tsx` | 죽은 파일 | 프로젝트 내부 inbound reference 0개. `src/app/layout.tsx` 는 이미 `@next/third-parties/google` 의 `GoogleAnalytics`를 사용하고 있고, 이 컴포넌트는 주석으로만 남아 있음. |
| [x] | `public/next.svg` | 불필요 파일 | 코드/메타데이터/스타일 어디에서도 참조되지 않음. `create-next-app` 기본 샘플 자산으로 보임. |
| [x] | `public/vercel.svg` | 불필요 파일 | 코드/메타데이터/스타일 어디에서도 참조되지 않음. `create-next-app` 기본 샘플 자산으로 보임. |
| [x] | `public/globe.svg` | 불필요 파일 | 코드/메타데이터/스타일 어디에서도 참조되지 않음. `create-next-app` 기본 샘플 자산으로 보임. |
| [x] | `public/window.svg` | 불필요 파일 | 코드/메타데이터/스타일 어디에서도 참조되지 않음. `create-next-app` 기본 샘플 자산으로 보임. |
| [x] | `public/file.svg` | 불필요 파일 | 코드/메타데이터/스타일 어디에서도 참조되지 않음. `create-next-app` 기본 샘플 자산으로 보임. |

## 2. 죽은 코드 / 미사용 선언

아래는 `eslint src` 기준으로 바로 정리 가능한 미사용 선언들이다.

| 상태 | 경로 | 죽은 코드 | 비고 |
| --- | --- | --- | --- |
| [x] | `src/app/homework/HomeworkClient.tsx` | `session` | `useSession()` 결과를 읽지 않음 |
| [x] | `src/app/homework/HomeworkClient.tsx` | `ArrayTaskCard` | 선언만 있고 렌더 경로가 전혀 없음 |
| [x] | `src/app/homework/HomeworkClient.tsx` | `WeeklyCounter` | 선언만 있고 렌더 경로가 전혀 없음 |
| [x] | `src/app/homework/HomeworkClient.tsx` | `max` 파라미터 | `ArrayTaskCard` 내부에서도 읽지 않음 |
| [x] | `src/components/Footer.tsx` | `Link` import | 전부 `<a>` 태그만 사용 |
| [x] | `src/components/Navbar.tsx` | `isLinkDropdownOpen` 상태값 | 현재 렌더 트리에 링크 드롭다운 UI 자체가 없음. 사실상 `linkDropdownRef`/outside click 분기까지 묶여서 레거시 코드 가능성 높음 |
| [x] | `src/actions/guide.ts` | `updatedGuide` | assign만 하고 읽지 않음 |
| [x] | `src/actions/guideComment.ts` | `IGuideComment` import | 미사용 import |
| [x] | `src/actions/homework.ts` | `catch (e)` 의 `e` | 미사용 catch 변수 |
| [x] | `src/app/community/[id]/PostDetailClient.tsx` | `use` import | 미사용 import |
| [x] | `src/app/guide/GuideClient.tsx` | `session` | `useSession()` 결과를 읽지 않음 |
| [x] | `src/app/guide/write/GuideWriteClient.tsx` | `session` | `useSession()` 결과를 읽지 않음 |
| [x] | `src/app/search/SearchClient.tsx` | `router` | 선언 후 사용처 없음 |
| [x] | `src/lib/auth.ts` | `trigger` | NextAuth `jwt` callback 파라미터 미사용 |
| [x] | `src/lib/crawler.ts` | 두 군데 `catch (e)` 의 `e` | 미사용 catch 변수 |
| [x] | `src/models/Rune.ts` | `mongoose` default import | named import만 실제 사용 |
| [x] | `src/models/User.ts` | `mongoose` default import | named import만 실제 사용 |

보조 정리 후보
- `src/app/homework/HomeworkClient.tsx` 의 주석 처리된 loading return
- `src/app/layout.tsx` 의 제거 완료 주석들

## 3. 패키지 / 의존성 정리 후보

| 상태 | 항목 | 근거 |
| --- | --- | --- |
| [x] | `package.json` 의 `dotenv` | 프로젝트 전체에서 import/require/use 흔적이 없음. 현재 `.env`, `.env.local`은 Next가 자체 로딩하므로 불필요 가능성 높음 |

메모
- `src/lib/s3-upload.ts` 에서만 `nanoid` 를 사용하지만 해당 파일 자체가 orphan 상태다. 즉 `nanoid` 를 추가해야 할 상태가 아니라, 오히려 `src/lib/s3-upload.ts` 를 제거하는 쪽이 자연스럽다.

## 4. 문서/메타 파일 정리 후보

| 상태 | 경로 | 판단 | 근거 |
| --- | --- | --- | --- |
| [x] | `README.md` | 제거 또는 전면 재작성 | 현재 내용이 `create-next-app` 기본 README 그대로라 실제 프로젝트 정보와 맞지 않음 |
| [x] | `plan.md` | 제거 또는 archive | 현재 구현과 어긋난 내용이 많음. 예: 상세 페이지를 `/post/[id]` 로 적어두었지만 실제 라우트는 `/community/[id]` |

## 5. TinyMCE 번들 축소 후보

현재 에디터 설정상 실제 사용 근거는 다음뿐이다.
- 로더 엔트리: `/tinymce/tinymce.min.js`
- 설정된 plugins: `lists link charmap anchor code help image`
- 기본 테마/스킨 추정: `silver`, `oxide`, `default`

현재 `public/tinymce` 크기
- 약 `2.0M`
- 파일 수 `81`

### 5-1. 즉시 제거 가능성이 매우 높은 파일

아래는 브라우저 런타임에서 읽히지 않는 문서/패키지 메타 파일이다.

- [x] `public/tinymce/README.md`
- [x] `public/tinymce/CHANGELOG.md`
- [x] `public/tinymce/package.json`
- [x] `public/tinymce/bower.json`
- [x] `public/tinymce/composer.json`
- [x] `public/tinymce/tinymce.d.ts`

### 5-2. 브라우저 1회 smoke test 후 제거할 후보

현재 설정으로 보아 아래 폴더/파일은 실제 앱에서 쓰이지 않을 가능성이 높다.

사용하지 않는 plugin 폴더
- [x] `public/tinymce/plugins/accordion`
- [x] `public/tinymce/plugins/advlist`
- [x] `public/tinymce/plugins/autolink`
- [x] `public/tinymce/plugins/autoresize`
- [x] `public/tinymce/plugins/autosave`
- [x] `public/tinymce/plugins/codesample`
- [x] `public/tinymce/plugins/directionality`
- [x] `public/tinymce/plugins/emoticons`
- [x] `public/tinymce/plugins/fullscreen`
- [x] `public/tinymce/plugins/importcss`
- [x] `public/tinymce/plugins/insertdatetime`
- [x] `public/tinymce/plugins/media`
- [x] `public/tinymce/plugins/nonbreaking`
- [x] `public/tinymce/plugins/pagebreak`
- [x] `public/tinymce/plugins/preview`
- [x] `public/tinymce/plugins/quickbars`
- [x] `public/tinymce/plugins/save`
- [x] `public/tinymce/plugins/searchreplace`
- [x] `public/tinymce/plugins/table`
- [x] `public/tinymce/plugins/template`
- [x] `public/tinymce/plugins/visualblocks`
- [x] `public/tinymce/plugins/visualchars`
- [x] `public/tinymce/plugins/wordcount`

사용하지 않을 가능성이 높은 대체 skin 폴더
- [x] `public/tinymce/skins/content/dark`
- [x] `public/tinymce/skins/content/document`
- [x] `public/tinymce/skins/content/tinymce-5`
- [x] `public/tinymce/skins/content/tinymce-5-dark`
- [x] `public/tinymce/skins/content/writer`
- [x] `public/tinymce/skins/ui/oxide-dark`
- [x] `public/tinymce/skins/ui/tinymce-5`
- [x] `public/tinymce/skins/ui/tinymce-5-dark`

사용하지 않을 가능성이 높은 비최소화/보조 파일
- [x] `public/tinymce/tinymce.js`
- [x] `public/tinymce/themes/silver/theme.js`
- [x] `public/tinymce/themes/silver/index.js`
- [x] `public/tinymce/icons/default/icons.js`
- [x] `public/tinymce/icons/default/index.js`
- [x] `public/tinymce/models/dom/model.js`
- [x] `public/tinymce/models/dom/index.js`

주의
- 로컬 Puppeteer harness로 `tinymce.min.js` + 현재 에디터 설정(`lists link charmap anchor code help image`)을 실제 초기화해 요청 목록을 확인했다.
- 실제 요청된 파일은 `tinymce.min.js`, `themes/silver/theme.min.js`, `icons/default/icons.min.js`, `models/dom/model.min.js`, 사용 중인 plugin의 `plugin.min.js`, `skins/content/default/content.min.css`, `skins/ui/oxide/content.min.css`, `skins/ui/oxide/skin.min.css`, `plugins/help/js/i18n/keynav/en.js` 뿐이었고 실패 요청은 없었다.
- 위 목록에 포함되지 않은 5-2 항목만 제거했다.

## 6. 코드 참조는 없지만 운영 파일일 수 있는 항목

아래는 코드 내부 reference 는 없지만 URL 직접 접근용 파일일 수 있어서, 서비스 운영 여부를 확인한 뒤 제거해야 한다.

| 상태 | 경로 | 확인 포인트 |
| --- | --- | --- |
| [ ] | `public/BingSiteAuth.xml` | Bing Webmaster 인증을 계속 쓰는지 |
| [ ] | `public/naver00052002924961f6ee72b77324282076.html` | Naver Search Advisor 인증을 계속 쓰는지 |
| [ ] | `public/ads.txt` | 광고 네트워크 연동을 계속 쓰는지 |

## 7. 참고 메모

- `npm run build` 는 현재 통과함
- `npm run lint` 는 repo 전체를 대상으로 돌 때 `public/tinymce/**/*` 까지 lint 하면서 대량 경고/에러를 발생시킴
- TinyMCE 번들을 당장 유지할 계획이라면 삭제와 별개로 `eslint` ignore 대상에 `public/tinymce/**` 를 추가하는 편이 맞음
