import { asset } from "./landing-data";

export function Features() {
  return (
    <>
      <section className="self-stretch bg-[#fafcff] flex flex-col items-start justify-center py-[52px] px-0 box-border relative isolate gap-[52px] max-w-full z-[3] text-5xl mq1410:pt-[34px] mq1410:pb-[34px] mq1410:box-border mq825:gap-[26px] mq825:pt-[22px] mq825:pb-[22px] mq825:box-border">
        <h1 className="m-0 self-stretch relative text-[length:inherit] tracking-[-0.02em] leading-[52px] font-bold font-[inherit] z-[0] shrink-0 mq825:text-[38px] mq825:leading-[42px] mq450:text-[29px] mq450:leading-[31px]">
          Everything your R&amp;D team needs in one intelligent workspace
        </h1>
        <div className="self-stretch flex flex-col items-start gap-8 max-w-full z-[1] shrink-0 mq825:gap-4">
          <div className="self-stretch flex items-start justify-center gap-8 max-w-full lg:flex-wrap mq825:gap-4">
            <section className="h-[480px] flex-1 rounded-[20px] bg-[rgba(37,74,126,0.09)] overflow-hidden flex flex-col items-end pt-[38px] px-0 pb-0 box-border max-w-full text-left text-[28px] text-[#1b2028] font-[Manrope]">
              <div className="self-stretch flex flex-col items-start py-0 px-10 gap-2.5">
                <h2 className="m-0 self-stretch relative text-[length:inherit] tracking-[-0.02em] leading-8 font-bold font-[inherit] mq450:text-[22px] mq450:leading-[26px]">
                  Formulation Design
                </h2>
                <h3 className="m-0 self-stretch relative text-xl leading-6 font-normal font-[inherit] mq450:text-base mq450:leading-[19px]">
                  Design formulations with precision and ease.
                </h3>
              </div>
              <div className="self-stretch flex-1 flex flex-col items-start max-w-full text-xl">
                <div className="self-stretch h-[405px] flex flex-col items-start pt-[32.7px] pb-[33px] pl-[68px] pr-[46px] box-border relative isolate gap-[184px] max-w-full shrink-0 mq825:gap-[92px] mq825:pl-[34px] mq825:pr-[23px] mq825:box-border mq450:gap-[46px] mq450:pt-[21px] mq450:pb-[21px] mq450:box-border">
                  <img
                    className="w-[296px] h-[404px] absolute !m-0 top-[33px] left-[calc(50%_-_148px)] shadow-[15px_128px_36px_rgba(0,_0,_0,_0),_10px_82px_33px_rgba(0,_0,_0,_0.01),_5px_46px_28px_rgba(0,_0,_0,_0.04),_2px_20px_21px_rgba(0,_0,_0,_0.06),_1px_5px_11px_rgba(0,_0,_0,_0.08)] rounded-[20px] object-cover shrink-0"
                    alt=""
                    src={asset("Container1@2x.png")}
                  />

                  <div className="w-[139px] h-[247.2px] relative hidden z-[1] shrink-0" />
                  <div className="w-[542px] flex items-start justify-end py-0 px-px box-border max-w-full shrink-0">
                    <div className="h-[72px] w-[190px] shadow-[15px_128px_36px_rgba(0,_0,_0,_0),_10px_82px_33px_rgba(0,_0,_0,_0.01),_5px_46px_28px_rgba(0,_0,_0,_0.04),_2px_20px_21px_rgba(0,_0,_0,_0.06),_1px_5px_11px_rgba(0,_0,_0,_0.08)] rounded-[20px] [background:linear-gradient(144.29deg,_rgba(250,_252,_255,_0),_rgba(0,_84,_173,_0.05)),_linear-gradient(rgba(37,_74,_126,_0.09),_rgba(37,_74,_126,_0.09)),_linear-gradient(#fff,_#fff)] border-[rgba(73,89,110,0.2)] border-solid border-[1.5px] box-border overflow-hidden shrink-0 flex items-start py-2.5 px-9 z-[1]">
                      <b className="w-[114px] relative tracking-[-0.02em] leading-6 [display:-webkit-inline-box] whitespace-pre-wrap items-center overflow-hidden text-ellipsis [-webkit-line-clamp:2] [-webkit-box-orient:vertical] shrink-0 mq450:text-base mq450:leading-[19px]">
                        Nutritional <br />
                        Analysis
                      </b>
                    </div>
                  </div>
                  <div className="w-[190px] shadow-[15px_128px_36px_rgba(0,_0,_0,_0),_10px_82px_33px_rgba(0,_0,_0,_0.01),_5px_46px_28px_rgba(0,_0,_0,_0.04),_2px_20px_21px_rgba(0,_0,_0,_0.06),_1px_5px_11px_rgba(0,_0,_0,_0.08)] rounded-[20px] [background:linear-gradient(144.29deg,_rgba(250,_252,_255,_0),_rgba(0,_84,_173,_0.05)),_linear-gradient(rgba(37,_74,_126,_0.09),_rgba(37,_74,_126,_0.09)),_linear-gradient(#fff,_#fff)] border-[rgba(73,89,110,0.2)] border-solid border-[1.5px] box-border overflow-hidden flex items-start py-2.5 px-[22px] z-[1] shrink-0 text-center">
                    <b className="w-[142px] relative tracking-[-0.02em] leading-6 [display:-webkit-inline-box] items-center justify-center overflow-hidden text-ellipsis [-webkit-line-clamp:2] [-webkit-box-orient:vertical] shrink-0 mq450:text-base mq450:leading-[19px]">
                      Ingredient Management
                    </b>
                  </div>
                </div>
              </div>
            </section>

            <section className="h-[480px] flex-1 rounded-[20px] bg-[rgba(37,74,126,0.09)] overflow-hidden flex flex-col items-end pt-[38px] px-0 pb-0 box-border text-left text-[28px] text-[#1b2028] font-[Manrope]">
              <div className="self-stretch flex flex-col items-start py-0 px-10 gap-2.5">
                <h2 className="m-0 self-stretch relative text-[length:inherit] tracking-[-0.02em] leading-8 font-bold font-[inherit] mq450:text-[22px] mq450:leading-[26px]">
                  Automated Calculations
                </h2>
                <h3 className="m-0 self-stretch relative text-xl leading-6 font-normal font-[inherit] mq450:text-base mq450:leading-[19px]">
                  Automate nutritional and Brix calculations.
                </h3>
              </div>
              <div className="self-stretch flex-1 flex flex-col items-start text-xl">
                <div className="w-[699px] h-[287px] flex items-start pt-[55.7px] px-[37px] pb-14 box-border relative isolate gap-[214px] shrink-0 mq825:gap-[107px] mq450:gap-[53px]">
                  <div className="h-[404px] w-[287px] absolute !m-0 top-[41.7px] left-[calc(50%_-_147px)] shadow-[15px_128px_36px_rgba(0,_0,_0,_0),_10px_82px_33px_rgba(0,_0,_0,_0.01),_5px_46px_28px_rgba(0,_0,_0,_0.04),_2px_20px_21px_rgba(0,_0,_0,_0.06),_1px_5px_11px_rgba(0,_0,_0,_0.08)] rounded-[20px] [background:linear-gradient(144.29deg,_rgba(0,_0,_0,_0),_rgba(0,_0,_0,_0.08)),_linear-gradient(#fff,_#fff)] border-[rgba(73,89,110,0.2)] border-solid border-[1.5px] box-border overflow-hidden shrink-0">
                    <div className="absolute top-[28px] left-[28px] rounded-2xl bg-[rgba(27,32,40,0.2)] w-[142px] h-8 hidden shrink-0" />
                    <img
                      className="absolute top-[-660.2px] left-[-756.5px] w-[1044px] h-[1566px] object-cover hidden shrink-0"
                      alt=""
                      src={asset("image-3@2x.png")}
                    />

                    <img
                      className="absolute top-[-35px] left-[0px] w-[291px] h-[437px] object-cover shrink-0"
                      loading="lazy"
                      alt=""
                      src={asset("image-7@2x.png")}
                    />
                  </div>
                  <div className="h-[72px] flex flex-col items-start pt-[71px] px-0 pb-0 box-border shrink-0">
                    <div className="h-[72px] shadow-[15px_128px_36px_rgba(0,_0,_0,_0),_10px_82px_33px_rgba(0,_0,_0,_0.01),_5px_46px_28px_rgba(0,_0,_0,_0.04),_2px_20px_21px_rgba(0,_0,_0,_0.06),_1px_5px_11px_rgba(0,_0,_0,_0.08)] rounded-[20px] [background:linear-gradient(144.29deg,_rgba(250,_252,_255,_0),_rgba(0,_84,_173,_0.05)),_linear-gradient(rgba(37,_74,_126,_0.09),_rgba(37,_74,_126,_0.09)),_linear-gradient(#fff,_#fff)] border-[rgba(73,89,110,0.2)] border-solid border-[1.5px] box-border overflow-hidden shrink-0 flex items-start py-[22px] pl-4 pr-0 z-[1]">
                      <div className="flex items-start">
                        <h3 className="m-0 w-[171px] relative text-[length:inherit] tracking-[-0.02em] leading-6 font-bold font-[inherit] [display:-webkit-inline-box] items-center overflow-hidden text-ellipsis [-webkit-line-clamp:2] [-webkit-box-orient:vertical] shrink-0 mq450:text-base mq450:leading-[19px]">
                          Brix Calculation
                        </h3>
                        <div className="h-8 w-8 relative overflow-hidden shrink-0 hidden" />
                      </div>
                    </div>
                  </div>
                  <div className="h-[72px] w-[190px] shadow-[15px_128px_36px_rgba(0,_0,_0,_0),_10px_82px_33px_rgba(0,_0,_0,_0.01),_5px_46px_28px_rgba(0,_0,_0,_0.04),_2px_20px_21px_rgba(0,_0,_0,_0.06),_1px_5px_11px_rgba(0,_0,_0,_0.08)] rounded-[20px] [background:linear-gradient(144.29deg,_rgba(250,_252,_255,_0),_rgba(0,_84,_173,_0.05)),_linear-gradient(rgba(37,_74,_126,_0.09),_rgba(37,_74,_126,_0.09)),_linear-gradient(#fff,_#fff)] border-[rgba(73,89,110,0.2)] border-solid border-[1.5px] box-border overflow-hidden shrink-0 flex items-start p-[22px] gap-5 z-[1]">
                    <h3 className="m-0 h-6 w-[142px] relative text-[length:inherit] tracking-[-0.02em] leading-6 font-bold font-[inherit] flex items-center overflow-hidden text-ellipsis whitespace-nowrap shrink-0 mq450:text-base mq450:leading-[19px]">
                      Acidity Levels
                    </h3>
                    <div className="h-[100px] w-[100px] relative overflow-hidden shrink-0 hidden" />
                  </div>
                  <div className="h-[431px] w-[287px] relative hidden z-[3] shrink-0" />
                </div>
              </div>
            </section>
          </div>

          <div className="self-stretch flex items-start justify-center gap-8 max-w-full lg:flex-wrap mq825:gap-4">
            <section className="h-[480px] flex-1 rounded-[20px] bg-[rgba(37,74,126,0.09)] overflow-hidden flex flex-col items-end pt-[38px] px-0 pb-0 box-border max-w-full text-left text-[28px] text-[#1b2028] font-[Manrope]">
              <div className="self-stretch flex flex-col items-start py-0 px-10 gap-2.5">
                <h2 className="m-0 self-stretch relative text-[length:inherit] tracking-[-0.02em] leading-8 font-bold font-[inherit] mq450:text-[22px] mq450:leading-[26px]">
                  Shelf-Life Simulation
                </h2>
                <h3 className="m-0 self-stretch relative text-xl leading-6 font-normal font-[inherit] mq450:text-base mq450:leading-[19px]">
                  Simulate shelf-life for optimal product launch.
                </h3>
              </div>
              <div className="self-stretch flex-1 flex flex-col items-start max-w-full text-center text-xl">
                <div className="self-stretch h-[405px] flex flex-col items-start pt-[32.7px] px-[22px] pb-[51.3px] box-border relative isolate gap-[157px] max-w-full shrink-0 mq825:gap-[78px] mq450:gap-[39px] mq450:pt-[21px] mq450:pb-[33px] mq450:box-border">
                  <div className="w-[296px] h-[404px] absolute !m-0 top-[33px] left-[calc(50%_-_148px)] shadow-[15px_128px_36px_rgba(0,_0,_0,_0),_10px_82px_33px_rgba(0,_0,_0,_0.01),_5px_46px_28px_rgba(0,_0,_0,_0.04),_2px_20px_21px_rgba(0,_0,_0,_0.06),_1px_5px_11px_rgba(0,_0,_0,_0.08)] rounded-[20px] [background:linear-gradient(144.29deg,_rgba(0,_0,_0,_0),_rgba(0,_0,_0,_0.08)),_linear-gradient(#fff,_#fff)] border-[rgba(73,89,110,0.2)] border-solid border-[1.5px] box-border overflow-hidden shrink-0">
                    <img
                      className="absolute top-[-93.2px] left-[-0.5px] w-[296px] h-[444px] object-cover shrink-0"
                      loading="lazy"
                      alt=""
                      src={asset("image-8@2x.png")}
                    />
                  </div>
                  <div className="w-[612px] flex items-start justify-end py-0 px-[11px] box-border max-w-full shrink-0">
                    <div className="h-[92px] w-[190px] shadow-[15px_128px_36px_rgba(0,_0,_0,_0),_10px_82px_33px_rgba(0,_0,_0,_0.01),_5px_46px_28px_rgba(0,_0,_0,_0.04),_2px_20px_21px_rgba(0,_0,_0,_0.06),_1px_5px_11px_rgba(0,_0,_0,_0.08)] rounded-[20px] [background:linear-gradient(144.29deg,_rgba(250,_252,_255,_0),_rgba(0,_84,_173,_0.05)),_linear-gradient(rgba(37,_74,_126,_0.09),_rgba(37,_74,_126,_0.09)),_linear-gradient(#fff,_#fff)] border-[rgba(73,89,110,0.2)] border-solid border-[1.5px] box-border overflow-hidden shrink-0 flex items-start p-[22px] z-[1]">
                      <h3 className="m-0 h-6 w-[142px] relative text-[length:inherit] tracking-[-0.02em] leading-6 font-bold font-[inherit] flex items-center justify-center overflow-hidden text-ellipsis whitespace-nowrap shrink-0 mq450:text-base mq450:leading-[19px]">
                        Launch Readiness
                      </h3>
                    </div>
                  </div>
                  <div className="w-[190px] h-[72px] shadow-[15px_128px_36px_rgba(0,_0,_0,_0),_10px_82px_33px_rgba(0,_0,_0,_0.01),_5px_46px_28px_rgba(0,_0,_0,_0.04),_2px_20px_21px_rgba(0,_0,_0,_0.06),_1px_5px_11px_rgba(0,_0,_0,_0.08)] rounded-[20px] [background:linear-gradient(144.29deg,_rgba(250,_252,_255,_0),_rgba(0,_84,_173,_0.05)),_linear-gradient(rgba(37,_74,_126,_0.09),_rgba(37,_74,_126,_0.09)),_linear-gradient(#fff,_#fff)] border-[rgba(73,89,110,0.2)] border-solid border-[1.5px] box-border overflow-hidden shrink-0 flex items-start py-2 px-[22px] z-[1]">
                    <b className="w-[142px] relative tracking-[-0.02em] leading-6 [display:-webkit-inline-box] items-center justify-center overflow-hidden text-ellipsis [-webkit-line-clamp:2] [-webkit-box-orient:vertical] shrink-0 mq450:text-base mq450:leading-[19px]">
                      Shelf-Life Analytics
                    </b>
                  </div>
                </div>
              </div>
            </section>

            <section className="h-[480px] flex-1 rounded-[20px] bg-[rgba(37,74,126,0.09)] overflow-hidden flex flex-col items-end pt-[38px] px-0 pb-0 box-border max-w-full text-left text-[28px] text-[#1b2028] font-[Manrope]">
              <div className="self-stretch flex flex-col items-start py-0 px-10 gap-2.5">
                <h2 className="m-0 self-stretch relative text-[length:inherit] tracking-[-0.02em] leading-8 font-bold font-[inherit] mq450:text-[22px] mq450:leading-[26px]">
                  Processing Optimization
                </h2>
                <h3 className="m-0 self-stretch relative text-xl leading-6 font-normal font-['Public_Sans'] mq450:text-base mq450:leading-[19px]">
                  Optimize processing for better products.
                </h3>
              </div>
              <div className="self-stretch flex-1 flex flex-col items-start max-w-full text-center text-xl">
                <div className="self-stretch h-[405px] flex flex-col items-start pt-[50.7px] px-[13px] pb-[57.3px] box-border relative isolate gap-[153px] max-w-full shrink-0 mq825:gap-[76px] mq450:gap-[38px] mq450:pt-[33px] mq450:pb-[37px] mq450:box-border">
                  <img
                    className="w-[296px] h-[404px] absolute !m-0 top-[33px] left-[calc(50%_-_148px)] shadow-[15px_128px_36px_rgba(0,_0,_0,_0),_10px_82px_33px_rgba(0,_0,_0,_0.01),_5px_46px_28px_rgba(0,_0,_0,_0.04),_2px_20px_21px_rgba(0,_0,_0,_0.06),_1px_5px_11px_rgba(0,_0,_0,_0.08)] rounded-[20px] object-cover shrink-0"
                    alt=""
                    src={asset("Container@2x.png")}
                  />

                  <div className="w-[630px] flex items-start justify-end py-0 px-2.5 box-border max-w-full shrink-0">
                    <div className="h-[72px] w-[190px] shadow-[15px_128px_36px_rgba(0,_0,_0,_0),_10px_82px_33px_rgba(0,_0,_0,_0.01),_5px_46px_28px_rgba(0,_0,_0,_0.04),_2px_20px_21px_rgba(0,_0,_0,_0.06),_1px_5px_11px_rgba(0,_0,_0,_0.08)] rounded-[20px] [background:linear-gradient(144.29deg,_rgba(250,_252,_255,_0),_rgba(0,_84,_173,_0.05)),_linear-gradient(rgba(37,_74,_126,_0.09),_rgba(37,_74,_126,_0.09)),_linear-gradient(#fff,_#fff)] border-[rgba(73,89,110,0.2)] border-solid border-[1.5px] box-border overflow-hidden shrink-0 flex items-start pt-2.5 px-[22px] pb-[11px] z-[1]">
                      <div className="flex items-start">
                        <b className="h-[47px] w-[142px] relative tracking-[-0.02em] leading-6 flex items-center justify-center overflow-hidden text-ellipsis whitespace-nowrap shrink-0 mq450:text-base mq450:leading-[19px]">
                          Cost Efficiency
                        </b>
                        <div className="h-8 w-8 relative overflow-hidden shrink-0 hidden" />
                      </div>
                    </div>
                  </div>
                  <div className="w-[190px] h-[72px] shadow-[15px_128px_36px_rgba(0,_0,_0,_0),_10px_82px_33px_rgba(0,_0,_0,_0.01),_5px_46px_28px_rgba(0,_0,_0,_0.04),_2px_20px_21px_rgba(0,_0,_0,_0.06),_1px_5px_11px_rgba(0,_0,_0,_0.08)] rounded-[20px] [background:linear-gradient(144.29deg,_rgba(250,_252,_255,_0),_rgba(0,_84,_173,_0.05)),_linear-gradient(rgba(37,_74,_126,_0.09),_rgba(37,_74,_126,_0.09)),_linear-gradient(#fff,_#fff)] border-[rgba(73,89,110,0.2)] border-solid border-[1.5px] box-border overflow-hidden shrink-0 flex items-start pt-2.5 px-[22px] pb-px gap-5 z-[1]">
                    <b className="w-[142px] relative tracking-[-0.02em] leading-6 [display:-webkit-inline-box] items-center justify-center overflow-hidden text-ellipsis [-webkit-line-clamp:2] [-webkit-box-orient:vertical] shrink-0 mq450:text-base mq450:leading-[19px]">
                      Process Simulation
                    </b>
                    <div className="h-8 w-8 relative overflow-hidden shrink-0 hidden" />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
        <img
          className="w-[calc(100%_+_192px)] absolute !m-0 right-[-96px] bottom-[0px] left-[-96px] max-w-full overflow-hidden max-h-full z-[2] shrink-0"
          alt=""
        />
      </section>

      <section className="self-stretch bg-[#fafcff] overflow-hidden flex flex-col items-center justify-center py-24 px-0 z-[2] mq825:gap-[26px] mq450:pt-[62px] mq450:pb-[62px] mq450:box-border">
        <div className="w-full relative tracking-[-0.02em] leading-[68px] inline-block max-w-[1260px] mq1410:max-w-full mq825:text-[51px] mq825:leading-[54px] mq450:text-[38px] mq450:leading-[41px]">
          AI has transformed our R&amp;D process, allowing us to bring
          innovative products to market faster than ever.
        </div>
      </section>
    </>
  );
}
