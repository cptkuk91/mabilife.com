export default function Footer() {
  return (
    <footer className="mt-auto border-t border-black/6 bg-black/[0.02] px-5 py-10 text-sm text-app-body md:py-12">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="flex items-center gap-2 text-lg font-extrabold text-app-title">
            <i className="fa-solid fa-leaf text-sm text-app-accent"></i>
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
              className="transition hover:text-app-accent hover:underline"
            >
              Terms of Service
            </a>
            <a
              href="https://www.kakao.gg/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-app-accent hover:underline"
            >
              Privacy Policy
            </a>
            <a
              href="https://www.instagram.com/next.uri/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-app-accent hover:underline"
            >
              Instagram
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
