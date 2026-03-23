export default function Footer() {
  return (
    <footer className="mt-auto flex justify-center border-t border-[#D7DCE2] bg-[#F4F1EA] px-5 py-10 text-sm text-app-body md:py-12">
      <div className="mx-auto w-full max-w-[1240px]">
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="flex items-center gap-2 text-lg font-extrabold text-[#132238]">
            <i className="fa-solid fa-leaf text-sm text-[#23486D]" aria-hidden="true"></i>
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
              className="transition hover:text-[#23486D] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E72C6]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F4F1EA]"
            >
              Terms of Service
            </a>
            <a
              href="https://www.kakao.gg/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-[#23486D] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E72C6]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F4F1EA]"
            >
              Privacy Policy
            </a>
            <a
              href="https://www.instagram.com/next.uri/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-[#23486D] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E72C6]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F4F1EA]"
            >
              Instagram
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
