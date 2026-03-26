import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import getUserModel from "@/models/User";
import getGuideModel from "@/models/Guide";
import getPostModel from "@/models/Post";
import { Homework } from "@/models/Homework";
import type { IDailyTasks, IWeeklyTasks } from "@/types/homework";

const SITE_URL = "https://www.mabilife.com";

export const metadata: Metadata = {
  title: "마이페이지",
  description: "마비노기 모바일 내 공략, 커뮤니티 활동, 저장한 공략, 숙제 캐릭터를 한 곳에서 관리하세요.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: `${SITE_URL}/profile`,
  },
};

interface ProfileUserRecord {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  level?: number;
  role?: string;
  createdAt?: string | Date;
}

interface GuideListItem {
  _id: string;
  title: string;
  category: string;
  views: number;
  likes: number;
  bookmarks: number;
  slug?: string;
  updatedAt: string | Date;
  author?: {
    name?: string;
  };
}

interface PostListItem {
  _id: string;
  content: string;
  type: "잡담" | "질문" | "정보";
  isSolved?: boolean;
  likes: number;
  commentCount: number;
  viewCount: number;
  updatedAt: string | Date;
}

interface HomeworkListItem {
  _id: string;
  characterName: string;
  daily: IDailyTasks;
  weekly: IWeeklyTasks;
  memo?: string;
  updatedAt: string | Date;
}

function formatDate(value?: string | Date | null) {
  if (!value) return "미등록";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function formatDateTime(value?: string | Date | null) {
  if (!value) return "미등록";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function trimText(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function countCompletedTasks(tasks: IDailyTasks | IWeeklyTasks | undefined) {
  const values = Object.values(tasks ?? {});
  if (values.length === 0) return 0;
  return values.filter(Boolean).length;
}

function getCompletionRate(tasks: IDailyTasks | IWeeklyTasks | undefined) {
  const values = Object.values(tasks ?? {});
  if (values.length === 0) return 0;
  return Math.round((values.filter(Boolean).length / values.length) * 100);
}

function SectionHeader({
  eyebrow,
  title,
  actionHref,
  actionLabel,
}: {
  eyebrow: string;
  title: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9B9A97]">{eyebrow}</div>
        <h2 className="mt-1 text-[20px] font-bold tracking-[-0.03em] text-[#37352F]">{title}</h2>
      </div>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="inline-flex items-center gap-2 rounded-full border border-[#E3E2DE] bg-white px-3 py-1.5 text-[12px] font-medium text-[#37352F] transition hover:border-[#D3D1CB] hover:bg-[#F7F6F3]"
        >
          <span>{actionLabel}</span>
          <i className="fa-solid fa-arrow-right text-[11px]" aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}

function EmptyState({
  title,
  description,
  href,
  cta,
}: {
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[#D9D7D1] bg-[#FBFBFA] px-5 py-6">
      <div className="text-[15px] font-semibold text-[#37352F]">{title}</div>
      <p className="mt-2 text-[13px] leading-6 text-[#787774]">{description}</p>
      <Link
        href={href}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#37352F] px-4 py-2 text-[12px] font-medium text-white transition hover:bg-[#2A2926]"
      >
        <span>{cta}</span>
        <i className="fa-solid fa-arrow-right text-[11px]" aria-hidden="true" />
      </Link>
    </div>
  );
}

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/profile");
  }

  const userId = (session.user as { id?: string }).id;

  if (!userId) {
    redirect("/login?callbackUrl=/profile");
  }

  await connectToDatabase();

  const [User, Guide, Post] = await Promise.all([
    getUserModel(),
    getGuideModel(),
    getPostModel(),
  ]);

  const [
    userRecordRaw,
    guideCount,
    postCount,
    bookmarkCount,
    homeworkCount,
    recentGuidesRaw,
    recentPostsRaw,
    bookmarkedGuidesRaw,
    homeworkRaw,
  ] = await Promise.all([
    User.findById(userId).select("name email image level role createdAt").lean(),
    Guide.countDocuments({ "author.id": userId }),
    Post.countDocuments({ "author.id": userId }),
    Guide.countDocuments({ bookmarkedBy: userId }),
    Homework.countDocuments({ userId }),
    Guide.find({ "author.id": userId })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select("title category views likes bookmarks slug updatedAt")
      .lean(),
    Post.find({ "author.id": userId })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select("content type isSolved likes commentCount viewCount updatedAt")
      .lean(),
    Guide.find({ bookmarkedBy: userId })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select("title category views likes bookmarks slug updatedAt author")
      .lean(),
    Homework.find({ userId })
      .sort({ updatedAt: -1 })
      .select("characterName daily weekly memo updatedAt")
      .lean(),
  ]);

  const userRecord = userRecordRaw ? (JSON.parse(JSON.stringify(userRecordRaw)) as ProfileUserRecord) : null;
  const recentGuides = JSON.parse(JSON.stringify(recentGuidesRaw)) as GuideListItem[];
  const recentPosts = JSON.parse(JSON.stringify(recentPostsRaw)) as PostListItem[];
  const bookmarkedGuides = JSON.parse(JSON.stringify(bookmarkedGuidesRaw)) as GuideListItem[];
  const homeworkList = JSON.parse(JSON.stringify(homeworkRaw)) as HomeworkListItem[];

  const displayName = userRecord?.name || session.user.name || "모험가";
  const displayEmail = userRecord?.email || session.user.email || "이메일 정보 없음";
  const displayImage = userRecord?.image || session.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;
  const memberSince = formatDate(userRecord?.createdAt);

  return (
    <div className="min-h-screen bg-[#FBFBFA] px-5 pb-20 pt-20 sm:px-6 md:pb-16 md:pt-24 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-6">
        <section className="overflow-hidden rounded-[28px] border border-[#E9E7E1] bg-white shadow-[0_24px_80px_rgba(55,53,47,0.06)]">
          <div className="bg-[radial-gradient(circle_at_top_left,_rgba(47,128,237,0.18),_transparent_38%),linear-gradient(135deg,_#FFFFFF_0%,_#F7F9FC_55%,_#FBFBFA_100%)] px-6 py-7 sm:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="relative h-20 w-20 overflow-hidden rounded-[24px] border border-white/80 bg-[#F3F6FB] shadow-[0_12px_24px_rgba(47,128,237,0.16)]">
                  <Image src={displayImage} alt={displayName} fill className="object-cover" sizes="80px" />
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9B9A97]">My Space</div>
                  <h1 className="mt-1 text-[30px] font-bold tracking-[-0.04em] text-[#37352F]">{displayName}</h1>
                  <p className="mt-2 text-[14px] text-[#787774]">{displayEmail}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#F7F6F3] px-3 py-1.5 text-[12px] font-medium text-[#37352F]">
                      <i className="fa-regular fa-calendar" aria-hidden="true" />
                      <span>가입일 {memberSince}</span>
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#EDF4FE] px-3 py-1.5 text-[12px] font-medium text-[#2F80ED]">
                      <i className="fa-solid fa-sparkles" aria-hidden="true" />
                      <span>Lv. {userRecord?.level ?? (session.user as { level?: number }).level ?? 1}</span>
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#F7F6F3] px-3 py-1.5 text-[12px] font-medium text-[#787774]">
                      <i className="fa-regular fa-id-badge" aria-hidden="true" />
                      <span>{userRecord?.role === "admin" ? "관리자" : "일반 사용자"}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Link
                  href="/guide/write"
                  className="rounded-2xl border border-[#E3E2DE] bg-white/90 px-4 py-3 text-left transition hover:border-[#D3D1CB] hover:bg-white"
                >
                  <div className="text-[12px] font-semibold text-[#2F80ED]">빠른 이동</div>
                  <div className="mt-1 text-[15px] font-semibold text-[#37352F]">공략 작성</div>
                  <p className="mt-1 text-[12px] leading-5 text-[#787774]">새 팁이나 노하우를 바로 공유합니다.</p>
                </Link>
                <Link
                  href="/community"
                  className="rounded-2xl border border-[#E3E2DE] bg-white/90 px-4 py-3 text-left transition hover:border-[#D3D1CB] hover:bg-white"
                >
                  <div className="text-[12px] font-semibold text-[#2F80ED]">빠른 이동</div>
                  <div className="mt-1 text-[15px] font-semibold text-[#37352F]">커뮤니티 열기</div>
                  <p className="mt-1 text-[12px] leading-5 text-[#787774]">내 글 확인과 새 질문 작성으로 이어집니다.</p>
                </Link>
                <Link
                  href="/homework"
                  className="rounded-2xl border border-[#E3E2DE] bg-white/90 px-4 py-3 text-left transition hover:border-[#D3D1CB] hover:bg-white"
                >
                  <div className="text-[12px] font-semibold text-[#2F80ED]">빠른 이동</div>
                  <div className="mt-1 text-[15px] font-semibold text-[#37352F]">숙제 관리</div>
                  <p className="mt-1 text-[12px] leading-5 text-[#787774]">캐릭터별 체크리스트 진행도를 이어서 봅니다.</p>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "내 공략", value: guideCount, icon: "fa-book-open", tone: "bg-[#EDF4FE] text-[#2F80ED]" },
            { label: "내 게시글", value: postCount, icon: "fa-comments", tone: "bg-[#FDF3E8] text-[#F2994A]" },
            { label: "저장한 공략", value: bookmarkCount, icon: "fa-bookmark", tone: "bg-[#EFF8F1] text-[#219653]" },
            { label: "숙제 캐릭터", value: homeworkCount, icon: "fa-list-check", tone: "bg-[#F6F1FE] text-[#8E63D2]" },
          ].map((item) => (
            <article key={item.label} className="rounded-[24px] border border-[#E9E7E1] bg-white px-5 py-5 shadow-[0_10px_32px_rgba(55,53,47,0.04)]">
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl text-[16px] ${item.tone}`}>
                <i className={`fa-solid ${item.icon}`} aria-hidden="true" />
              </div>
              <div className="mt-4 text-[11px] font-bold uppercase tracking-[0.08em] text-[#9B9A97]">{item.label}</div>
              <div className="mt-1 text-[32px] font-bold tracking-[-0.04em] text-[#37352F]">{item.value}</div>
            </article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
          <div className="space-y-6">
            <section className="rounded-[28px] border border-[#E9E7E1] bg-white px-6 py-6 shadow-[0_10px_32px_rgba(55,53,47,0.04)]">
              <SectionHeader eyebrow="My Guides" title="최근 작성한 공략" actionHref="/guide" actionLabel="공략 전체 보기" />
              <div className="mt-5 space-y-3">
                {recentGuides.length > 0 ? (
                  recentGuides.map((guide) => (
                    <Link
                      key={String(guide._id)}
                      href={`/guide/${guide.slug || String(guide._id)}`}
                      className="block rounded-2xl border border-[#F0EFEB] px-4 py-4 transition hover:border-[#D9D7D1] hover:bg-[#FBFBFA]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="inline-flex rounded-full bg-[#F7F6F3] px-2.5 py-1 text-[11px] font-semibold text-[#787774]">
                            {guide.category}
                          </div>
                          <div className="mt-2 truncate text-[16px] font-semibold text-[#37352F]">{guide.title}</div>
                        </div>
                        <div className="text-[12px] text-[#9B9A97]">{formatDateTime(guide.updatedAt)}</div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-3 text-[12px] text-[#787774]">
                        <span className="inline-flex items-center gap-1"><i className="fa-regular fa-eye" aria-hidden="true" /> {guide.views ?? 0}</span>
                        <span className="inline-flex items-center gap-1"><i className="fa-regular fa-heart" aria-hidden="true" /> {guide.likes ?? 0}</span>
                        <span className="inline-flex items-center gap-1"><i className="fa-regular fa-bookmark" aria-hidden="true" /> {guide.bookmarks ?? 0}</span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <EmptyState
                    title="아직 작성한 공략이 없습니다."
                    description="처음 공략을 올리면 프로필에서 최근 작성 목록과 누적 활동이 함께 보입니다."
                    href="/guide/write"
                    cta="첫 공략 작성하기"
                  />
                )}
              </div>
            </section>

            <section className="rounded-[28px] border border-[#E9E7E1] bg-white px-6 py-6 shadow-[0_10px_32px_rgba(55,53,47,0.04)]">
              <SectionHeader eyebrow="My Posts" title="최근 커뮤니티 글" actionHref="/community" actionLabel="커뮤니티 보기" />
              <div className="mt-5 space-y-3">
                {recentPosts.length > 0 ? (
                  recentPosts.map((post) => (
                    <Link
                      key={String(post._id)}
                      href={`/community/${String(post._id)}`}
                      className="block rounded-2xl border border-[#F0EFEB] px-4 py-4 transition hover:border-[#D9D7D1] hover:bg-[#FBFBFA]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap gap-2">
                            <span className="inline-flex rounded-full bg-[#F7F6F3] px-2.5 py-1 text-[11px] font-semibold text-[#787774]">{post.type}</span>
                            {post.type === "질문" ? (
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${post.isSolved ? "bg-[#EFF8F1] text-[#219653]" : "bg-[#FEF0F0] text-[#EB5757]"}`}>
                                {post.isSolved ? "해결됨" : "답변 대기"}
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-2 text-[15px] font-semibold leading-6 text-[#37352F]">
                            {trimText(post.content, 96)}
                          </div>
                        </div>
                        <div className="text-[12px] text-[#9B9A97]">{formatDateTime(post.updatedAt)}</div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-3 text-[12px] text-[#787774]">
                        <span className="inline-flex items-center gap-1"><i className="fa-regular fa-heart" aria-hidden="true" /> {post.likes ?? 0}</span>
                        <span className="inline-flex items-center gap-1"><i className="fa-regular fa-comment" aria-hidden="true" /> {post.commentCount ?? 0}</span>
                        <span className="inline-flex items-center gap-1"><i className="fa-regular fa-eye" aria-hidden="true" /> {post.viewCount ?? 0}</span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <EmptyState
                    title="아직 작성한 커뮤니티 글이 없습니다."
                    description="질문, 정보 공유, 잡담을 남기면 최근 활동이 이 영역에 정리됩니다."
                    href="/community"
                    cta="커뮤니티 둘러보기"
                  />
                )}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-[28px] border border-[#E9E7E1] bg-white px-6 py-6 shadow-[0_10px_32px_rgba(55,53,47,0.04)]">
              <SectionHeader eyebrow="Saved" title="저장한 공략" actionHref="/guide" actionLabel="공략 보러가기" />
              <div className="mt-5 space-y-3">
                {bookmarkedGuides.length > 0 ? (
                  bookmarkedGuides.map((guide) => (
                    <Link
                      key={String(guide._id)}
                      href={`/guide/${guide.slug || String(guide._id)}`}
                      className="block rounded-2xl border border-[#F0EFEB] px-4 py-4 transition hover:border-[#D9D7D1] hover:bg-[#FBFBFA]"
                    >
                      <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9B9A97]">{guide.category}</div>
                      <div className="mt-2 text-[15px] font-semibold leading-6 text-[#37352F]">{guide.title}</div>
                      <div className="mt-3 flex flex-wrap gap-3 text-[12px] text-[#787774]">
                        <span className="inline-flex items-center gap-1"><i className="fa-regular fa-eye" aria-hidden="true" /> {guide.views ?? 0}</span>
                        <span className="inline-flex items-center gap-1"><i className="fa-regular fa-heart" aria-hidden="true" /> {guide.likes ?? 0}</span>
                        <span className="inline-flex items-center gap-1"><i className="fa-regular fa-bookmark" aria-hidden="true" /> {guide.bookmarks ?? 0}</span>
                      </div>
                      <div className="mt-3 text-[12px] text-[#9B9A97]">업데이트 {formatDateTime(guide.updatedAt)}</div>
                    </Link>
                  ))
                ) : (
                  <EmptyState
                    title="저장한 공략이 없습니다."
                    description="북마크한 공략은 다시 보기용 리스트로 이곳에 모아둘 수 있습니다."
                    href="/guide"
                    cta="공략 탐색하기"
                  />
                )}
              </div>
            </section>

            <section className="rounded-[28px] border border-[#E9E7E1] bg-white px-6 py-6 shadow-[0_10px_32px_rgba(55,53,47,0.04)]">
              <SectionHeader eyebrow="Homework" title="내 숙제 캐릭터" actionHref="/homework" actionLabel="숙제 페이지로" />
              <div className="mt-5 space-y-3">
                {homeworkList.length > 0 ? (
                  homeworkList.map((character) => {
                    const dailyPercent = getCompletionRate(character.daily);
                    const weeklyPercent = getCompletionRate(character.weekly);

                    return (
                      <article key={String(character._id)} className="rounded-2xl border border-[#F0EFEB] px-4 py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-[16px] font-semibold text-[#37352F]">{character.characterName}</div>
                            <div className="mt-1 text-[12px] text-[#9B9A97]">마지막 변경 {formatDateTime(character.updatedAt)}</div>
                          </div>
                          <div className="rounded-full bg-[#F7F6F3] px-2.5 py-1 text-[11px] font-semibold text-[#787774]">
                            메모 {character.memo?.trim() ? "있음" : "없음"}
                          </div>
                        </div>

                        <div className="mt-4 space-y-3">
                          <div>
                            <div className="flex items-center justify-between text-[12px] text-[#787774]">
                              <span>일일 진행도</span>
                              <span>{countCompletedTasks(character.daily)}/{Object.values(character.daily ?? {}).length} · {dailyPercent}%</span>
                            </div>
                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#F1F1EF]">
                              <div className="h-full rounded-full bg-[#2F80ED]" style={{ width: `${dailyPercent}%` }} />
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center justify-between text-[12px] text-[#787774]">
                              <span>주간 진행도</span>
                              <span>{countCompletedTasks(character.weekly)}/{Object.values(character.weekly ?? {}).length} · {weeklyPercent}%</span>
                            </div>
                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#F1F1EF]">
                              <div className="h-full rounded-full bg-[#219653]" style={{ width: `${weeklyPercent}%` }} />
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <EmptyState
                    title="아직 등록한 숙제 캐릭터가 없습니다."
                    description="숙제 페이지에서 캐릭터를 만들면 이곳에서 진행도 요약을 바로 볼 수 있습니다."
                    href="/homework"
                    cta="숙제 캐릭터 만들기"
                  />
                )}
              </div>
            </section>
          </div>
        </section>
      </div>
    </div>
  );
}
