import { asset, navigation } from "./landing-data";

export function Navbar() {
  return (
    <header className="self-stretch bg-[#fafcff] flex flex-col items-center pt-8 px-0 pb-0 top-[0] z-[99] sticky text-left text-[15px] text-[#334155] font-['Public_Sans']">
      <div className="shadow-[0px_4px_24px_rgba(0,_0,_0,_0.16)] [backdrop-filter:blur(96px)] rounded-[20px] bg-[rgba(0,72,173,0.16)] flex items-center py-5 pl-10 pr-5 relative isolate gap-24 mq825:gap-12 mq450:gap-6">
        <div className="h-full w-full absolute !m-0 top-[0px] right-[4.5px] bottom-[0px] left-[-0.5px] bg-[rgba(234,243,255,0.16)] z-[0] shrink-0" />
        <nav className="flex items-start gap-8 z-[1] shrink-0 mq825:hidden mq450:gap-4">
          {navigation.map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="flex items-center gap-1.5"
            >
              <div className="relative leading-5 font-medium">{item}</div>
              <img
                className="h-4 w-4 relative"
                alt=""
                src={asset("chevron-down.svg")}
              />
            </a>
          ))}
          <div className="h-4 w-4 flex items-center" />
        </nav>
        <div className="flex items-center gap-3.5 z-[2] shrink-0">
          <button
            type="button"
            className="cursor-pointer border-[rgba(203,213,225,0.2)] border-solid border-[1.5px] py-2 px-[18px] bg-[transparent] rounded-2xl flex items-center justify-center hover:bg-[rgba(179,189,199,0.09)] hover:border-[rgba(179,189,199,0.2)] hover:border-solid hover:border-[1.5px] hover:box-border"
          >
            <div className="relative text-[15px] leading-5 font-medium font-['Public_Sans'] text-[#334155] text-left">
              Log in
            </div>
          </button>
          <button
            type="button"
            className="cursor-pointer [border:none] py-2.5 px-5 bg-[#1d4ed8] rounded-2xl flex items-center justify-center hover:bg-[#4275ff]"
          >
            <div className="relative text-[15px] leading-5 font-medium font-['Public_Sans'] text-[#fafcff] text-left">
              Try it free
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
