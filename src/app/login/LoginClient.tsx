"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

export default function LoginClient() {
  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="w-full max-w-[520px] rounded-[28px] bg-white p-8 text-center shadow-elev-card md:p-10">
        <div className="flex flex-col gap-6">
          <div>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 text-2xl font-bold tracking-[-0.03em] text-app-title transition hover:text-app-accent"
            >
              <i className="fa-solid fa-leaf text-[0.95em] text-app-accent"></i>
              <span>MabiLife</span>
              <span className="mx-1 text-base opacity-40">X</span>
              <Image
                src="/assets/logo/kakao-logo.webp"
                alt="GG FACTORY"
                width={24}
                height={24}
                className="h-6 w-auto"
              />
              <span className="text-[#F7A51A]">GG FACTORY</span>
            </Link>
            <p className="mt-3 text-[15px] text-app-body">에린의 모험가들과 함께하세요.</p>
          </div>

          <button
            type="button"
            className="flex w-full items-center justify-center gap-3 rounded-[14px] border border-black/10 bg-white px-4 py-3 text-[15px] font-semibold text-[#333] transition hover:border-black/15 hover:bg-black/[0.02]"
            onClick={() => signIn("google", { callbackUrl: "/" })}
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google Logo"
              className="h-5 w-5"
            />
            <span>Google 계정으로 계속하기</span>
          </button>

          <div className="text-[13px] leading-6 text-app-body">
            계속 진행하면{" "}
            <Link href="https://www.kakao.gg/terms" className="underline underline-offset-2">
              이용약관
            </Link>{" "}
            및{" "}
            <Link href="https://www.kakao.gg/privacy" className="underline underline-offset-2">
              개인정보처리방침
            </Link>
            에 동의하게 됩니다.
          </div>
        </div>
      </div>
    </div>
  );
}
