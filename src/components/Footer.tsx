export default function Footer() {
  return (
    <footer className="mt-auto flex justify-center border-t border-[#E3E2DE] bg-[#FBFBFA] px-5 py-10 text-sm md:py-12">
      <div className="mx-auto w-full max-w-[1100px]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-2 text-[16px] font-bold text-[#37352F]">
            <i className="fa-solid fa-leaf text-[14px] text-[#2F80ED]" aria-hidden="true"></i>
            <span>Mabi Life</span>
          </div>
          <p className="max-w-[600px] text-[13px] leading-6 text-[#9B9A97]">
            &copy; {new Date().getFullYear()}. Mabi Life All rights reserved.
            <br />
            This site is not associated with Nexon & Mabinogi Mobile.
          </p>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-[13px] text-[#9B9A97]">
            <a
              href="https://www.kakao.gg/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-[#37352F] hover:underline"
            >
              Terms of Service
            </a>
            <a
              href="https://www.kakao.gg/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-[#37352F] hover:underline"
            >
              Privacy Policy
            </a>
            <a
              href="https://www.instagram.com/next.uri/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-[#37352F] hover:underline"
            >
              Instagram
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
