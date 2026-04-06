import { asset } from "./landing-data";

export function Hero() {
  return (
    <section className="self-stretch h-[1398px] bg-[#fafcff] flex items-end pt-0 px-0 pb-[206.3px] box-border max-w-full text-8xl text-[#1e3a5f] mq1410:h-auto mq1410:pb-[134px] mq1410:box-border mq825:gap-12 mq825:pb-[87px] mq825:box-border mq450:gap-6">
      <div className="ml-[-96.5px] w-[1536px] [background:radial-gradient(193.34%_155.87%_at_50%_-1.55%,_rgba(250,_252,_255,_0.7)_31.17%,_rgba(0,_72,_173,_0.11)),_linear-gradient(#fafcff,_#fafcff)] flex flex-col items-center pt-[127px] px-24 pb-0 box-border gap-[93px] shrink-0 max-w-[115%] mq1410:pt-[83px] mq1410:box-border mq825:gap-[46px] mq825:pl-12 mq825:pt-[54px] mq825:pr-12 mq825:box-border mq450:gap-[23px] mq450:pl-5 mq450:pr-5 mq450:box-border">
        <div className="self-stretch h-[411px] flex flex-col items-center gap-[63px] mq825:gap-[31px] mq450:gap-4">
          <div className="self-stretch h-[253px] relative tracking-[-0.02em] leading-[120px] inline-block [filter:drop-shadow(0px_4px_4px_rgba(0,_0,_0,_0.25))] shrink-0 mq825:text-[51px] mq825:leading-[96px] mq450:text-[38px] mq450:leading-[72px]">
            <span className="font-medium">
              FROM IDEA TO SHELF <br />
            </span>
            <b className="text-[64px] text-[#3b82f6]">Powered by AI</b>
          </div>
          <button
            type="button"
            className="cursor-pointer [border:none] py-3.5 px-4 bg-[#1d4ed8] w-[422px] h-[98px] rounded-2xl flex items-center justify-center box-border shrink-0 hover:bg-[#4275ff]"
          >
            <div className="relative text-4xl leading-6 font-medium font-['Public_Sans'] text-[#fafcff] text-left">
              Start your first formula
            </div>
          </button>
        </div>
        <div className="w-[656px] h-[62px] relative text-xl leading-6 font-medium text-[#64748b] text-left inline-block mq450:text-base mq450:leading-[19px]">
          Trusted by beverage innovators, R&amp;D teams, and product developers
        </div>
        <div className="self-stretch h-[500px] flex items-start py-0 pl-[159px] pr-[157px] box-border max-w-full mq1410:h-auto mq1410:pl-[79px] mq1410:pr-[78px] mq1410:box-border mq825:pl-[39px] mq825:pr-[39px] mq825:box-border">
          <div className="mt-[-99px] shadow-[0px_311px_87px_rgba(0,_0,_0,_0),_0px_199px_80px_rgba(0,_0,_0,_0),_0px_112px_67px_rgba(0,_0,_0,_0.02),_0px_50px_50px_rgba(0,_0,_0,_0.03),_0px_12px_27px_rgba(0,_0,_0,_0.03)] rounded-[20px] bg-[#fff] border-[rgba(73,89,110,0.2)] border-solid border-[1.5px] box-border overflow-hidden flex flex-col items-end pt-[33.5px] pb-[36.5px] pl-9 pr-[37px] gap-[23px] max-w-full shrink-0 mq825:pt-[22px] mq825:pb-6 mq825:box-border">
            <button
              type="button"
              className="cursor-pointer [border:none] py-3 px-2 bg-[#1d4ed8] rounded-2xl flex items-center justify-center shrink-0 hover:bg-[#4275ff]"
            >
              <div className="relative text-xl leading-6 font-medium font-['Public_Sans'] text-[#fafcff] text-left">
                Book a Live Demo
              </div>
            </button>
            <div className="flex items-start justify-end py-0 pl-1 pr-px box-border max-w-full shrink-0">
              <div className="flex items-start justify-center gap-[34px] max-w-full mq1410:flex-wrap mq825:gap-[17px]">
                <div className="flex flex-col items-start gap-8 max-w-full mq825:gap-4">
                  <img
                    className="w-[729px] relative max-h-full object-cover"
                    loading="lazy"
                    alt=""
                    src={asset("image-4@2x.png")}
                  />

                  <img
                    className="w-[729px] h-[271px] relative rounded-[20px] object-cover"
                    loading="lazy"
                    alt=""
                    src={asset("Container3@2x.png")}
                  />
                </div>
                <img
                  className="h-[574px] w-[183px] relative rounded-[20px] object-cover"
                  loading="lazy"
                  alt=""
                  src={asset("Container2@2x.png")}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
