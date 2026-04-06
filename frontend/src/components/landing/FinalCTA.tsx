import { asset } from "./landing-data";

export function FinalCTA() {
  return (
    <section className="self-stretch h-[720px] bg-[#fafcff] flex flex-col items-start py-[214px] px-0 box-border relative isolate gap-12 max-w-full mq825:gap-6 mq825:pt-[139px] mq825:pb-[139px] mq825:box-border">
      <div className="w-[calc(100%_+_192px)] h-full absolute !m-0 top-[0px] right-[-96px] bottom-[0px] left-[-96px] [background:radial-gradient(63.68%_40.76%_at_50%_103.08%,_rgba(0,_72,_173,_0.16),_rgba(250,_252,_255,_0))] shrink-0" />
      <section className="w-[1344px] flex flex-col items-center gap-[52px] max-w-full z-[1] shrink-0 text-center text-[64px] text-[#1b2028] font-[Manrope] mq825:gap-[26px]">
        <div className="w-full flex flex-col items-start gap-5 max-w-[1260px] mq1410:max-w-full">
          <h1 className="m-0 self-stretch relative text-[length:inherit] tracking-[-0.02em] leading-[68px] font-bold font-[inherit] mq825:text-[51px] mq825:leading-[54px] mq450:text-[38px] mq450:leading-[41px]">
            Bring Your Next Beverage from Idea to Shelf Faster
          </h1>
          <h3 className="m-0 self-stretch relative text-2xl leading-8 font-normal font-[inherit] mq450:text-[19px] mq450:leading-[26px]">
            Formulate smarter, reduce development time, and launch market-ready
            products with confidence.
          </h3>
        </div>
        <button
          type="button"
          className="cursor-pointer [border:none] py-3.5 px-8 bg-[#0047ab] rounded-2xl flex items-center justify-center hover:bg-[#266ed1]"
        >
          <div className="relative text-xl leading-6 font-medium font-['Public_Sans'] text-[#fafcff] text-left">
            Book a Live Demo
          </div>
        </button>
      </section>
      <img
        className="w-[calc(100%_+_193px)] absolute !m-0 right-[-97px] bottom-[0px] left-[-96px] max-w-full overflow-hidden max-h-full shrink-0"
        loading="lazy"
        alt=""
        src={asset("divider.svg")}
      />
    </section>
  );
}
