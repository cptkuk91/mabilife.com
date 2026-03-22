export default function Footer() {
  return (
    <footer className="mt-auto flex justify-center border-t border-[#E7DDD0] bg-[#FBF8F2] px-5 py-10 text-sm text-app-body md:py-12">
      <div className="mx-auto w-full max-w-[1140px]">
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="flex items-center gap-2 text-lg font-extrabold text-app-title">
            <i className="fa-solid fa-leaf text-sm text-[#B88B46]" aria-hidden="true"></i>
            <span>Mabi Life</span>
          </div>
          <p className="max-w-[800px] text-[13px] leading-6 text-app-body/90">
            &copy; {new Date().getFullYear()}. Mabi Life All rights reserved.
            <br />
            This site is not associated with Nexon & Mabinogi Mobile.
          </p>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-3 text-[13px] text-app-body md:text-sm">
            <a
              href="https://www.kakao.gg/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-[#8A6630] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A977]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FBF8F2]"
            >
              Terms of Service
            </a>
            <a
              href="https://www.kakao.gg/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-[#8A6630] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A977]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FBF8F2]"
            >
              Privacy Policy
            </a>
            <a
              href="https://www.instagram.com/next.uri/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-[#8A6630] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A977]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FBF8F2]"
            >
              Instagram
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
