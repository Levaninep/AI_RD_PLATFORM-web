import { asset } from "./landing-data";

export function Pricing() {
  return (
    <section className="self-stretch bg-[#fafcff] flex flex-col items-start py-[52px] px-0 relative isolate gap-[52px] z-[1] lg:pt-[34px] lg:pb-[34px] lg:box-border mq825:gap-[26px] mq825:pt-[22px] mq825:pb-[22px] mq825:box-border">
      <div className="self-stretch flex flex-col items-center py-0 px-5 gap-5 z-[0] shrink-0">
        <h1 className="m-0 w-[1152px] relative text-[length:inherit] tracking-[-0.02em] leading-[68px] font-bold font-[inherit] inline-block mq825:text-[51px] mq825:leading-[54px] mq450:text-[38px] mq450:leading-[41px]">
          Flexible Pricing
        </h1>
        <h3 className="m-0 w-[1152px] relative text-2xl leading-8 font-normal font-['Public_Sans'] inline-block mq450:text-[19px] mq450:leading-[26px]">
          Choose the plan that fits your needs.
        </h3>
      </div>

      <div className="self-stretch flex items-start justify-center flex-wrap content-start gap-8 z-[1] shrink-0 mq825:gap-4">
        <section className="flex-1 rounded-[20px] bg-[rgba(37,74,126,0.09)] overflow-hidden flex flex-col items-start p-[30px] box-border gap-8 min-w-[300px] max-w-[400px] text-left text-[17px] text-[#1b2028] font-['Public_Sans'] mq825:pt-5 mq825:pb-5 mq825:box-border mq450:gap-4 mq450:max-w-full">
          <div className="self-stretch flex flex-col items-start gap-4">
            <b className="self-stretch relative leading-6 font-[Manrope]">
              Explorer
            </b>
            <div className="self-stretch flex items-baseline gap-1 text-xl mq450:flex-wrap">
              <h2 className="m-0 relative text-5xl tracking-[-0.02em] leading-[52px] font-bold font-['Roboto_Serif'] mq825:text-[38px] mq825:leading-[42px] mq450:text-[29px] mq450:leading-[31px]">
                $99
              </h2>
              <div className="w-[202px] relative leading-6 hidden mq450:text-base mq450:leading-[19px]">
                / month
              </div>
              <h3 className="m-0 flex-1 relative text-[length:inherit] leading-6 font-normal font-[inherit] text-[#000] inline-block min-w-[45px] mq450:text-base mq450:leading-[19px]">
                month
              </h3>
            </div>
            <div className="self-stretch relative text-[13px] leading-4 text-[rgba(20,31,46,0.62)] overflow-hidden text-ellipsis whitespace-nowrap">
              Try us out first
            </div>
          </div>
          <button
            type="button"
            className="cursor-pointer border-[rgba(73,89,110,0.2)] border-solid border-[1.5px] py-2 px-5 bg-[transparent] self-stretch rounded-2xl flex items-center justify-center hover:bg-[rgba(112,128,148,0.09)] hover:border-[rgba(112,128,148,0.2)] hover:border-solid hover:border-[1.5px] hover:box-border"
          >
            <div className="relative text-[15px] leading-5 font-medium font-['Public_Sans'] text-[#1b2028] text-left">
              Start for free
            </div>
          </button>
          <img
            className="self-stretch h-[1.5px] relative rounded-[1px] max-w-full overflow-hidden max-h-full"
            alt=""
            src={asset("divider.svg")}
          />

          <div className="self-stretch flex flex-col items-start text-[13px] text-[rgba(20,31,46,0.62)] font-[Manrope]">
            <div className="self-stretch flex items-center gap-2 mq450:flex-wrap">
              <div className="h-16 w-6 relative overflow-hidden shrink-0" />
              <div className="flex-1 relative leading-4 [display:-webkit-inline-box] overflow-hidden text-ellipsis [-webkit-line-clamp:17] [-webkit-box-orient:vertical] min-w-[133px]">
                AI Formulation Builder
                <br />
                <br />
                Ingredient Database Access
                <br />
                <br />
                Brix, pH &amp; TA Calculations
                <br />
                <br />
                Basic Costing (COGS)
                <br />
                <br />
                5 Saved Formulations
                <br />
                <br />
                1 User Seat
                <br />
                <br />
                Export to PDF
                <br />
                <br />
                Community Support
              </div>
            </div>
          </div>
        </section>

        <section className="flex-1 rounded-[20px] bg-[rgba(0,72,173,0.16)] border-[#0047ab] border-solid border-[1.5px] box-border overflow-hidden flex flex-col items-start p-[30px] gap-8 min-w-[300px] max-w-[400px] text-left text-[17px] text-[#0047ab] font-['Public_Sans'] mq825:pt-5 mq825:pb-5 mq825:box-border mq450:gap-4 mq450:max-w-full">
          <div className="self-stretch flex flex-col items-start gap-4">
            <b className="self-stretch relative leading-6">R&amp;D Team </b>
            <div className="self-stretch flex items-baseline gap-1 text-5xl font-['Roboto_Serif'] mq450:flex-wrap">
              <h2 className="m-0 relative text-[length:inherit] tracking-[-0.02em] leading-[52px] font-bold font-[inherit] mq825:text-[38px] mq825:leading-[42px] mq450:text-[29px] mq450:leading-[31px]">
                $299
              </h2>
              <h3 className="m-0 flex-1 relative text-xl leading-6 font-normal font-['Public_Sans'] inline-block min-w-[45px] mq450:text-base mq450:leading-[19px]">
                month
              </h3>
            </div>
            <div className="self-stretch relative text-[13px] leading-4 text-[#1b2028] overflow-hidden text-ellipsis whitespace-nowrap">
              Growing Teams
            </div>
          </div>
          <button
            type="button"
            className="cursor-pointer [border:none] py-2.5 px-5 bg-[#0047ab] self-stretch rounded-2xl flex items-center justify-center hover:bg-[#266ed1]"
          >
            <div className="relative text-[15px] leading-5 font-medium font-['Public_Sans'] text-[#fafcff] text-left">
              Start with Plus
            </div>
          </button>
          <img
            className="self-stretch h-[1.5px] relative rounded-[1px] max-w-full overflow-hidden max-h-full"
            alt=""
            src={asset("divider.svg")}
          />

          <div className="self-stretch flex flex-col items-start text-[13px] text-[#1b2028] font-[Manrope]">
            <div className="self-stretch flex items-center gap-2 mq450:flex-wrap">
              <div className="h-16 w-6 relative overflow-hidden shrink-0" />
              <div className="flex-1 relative leading-4 [display:-webkit-inline-box] overflow-hidden text-ellipsis [-webkit-line-clamp:21] [-webkit-box-orient:vertical] min-w-[156px]">
                Everything in Explorer
                <br />
                <br />
                Unlimited Formulations
                <br />
                <br />
                Advanced Shelf-Life Simulation
                <br />
                <br />
                Process Optimization Tools
                <br />
                <br />
                CO₂ &amp; Pressure Prediction
                <br />
                <br />
                Tunnel Pasteurization Calculator
                <br />
                <br />
                Team Collaboration Workspace
                <br />
                <br />
                Up to 20 Users
                <br />
                <br />
                Priority Support
                <br />
                <br />
                API / ERP Export Ready
              </div>
            </div>
          </div>
        </section>

        <section className="flex-1 rounded-[20px] bg-[rgba(37,74,126,0.09)] overflow-hidden flex flex-col items-start p-[30px] box-border gap-8 min-w-[300px] max-w-[400px] text-left text-[17px] text-[#1b2028] font-[Manrope] mq825:pt-5 mq825:pb-5 mq825:box-border mq450:gap-4 mq450:max-w-full">
          <div className="self-stretch flex flex-col items-start gap-4">
            <b className="self-stretch relative leading-6">Enterprise</b>
            <div className="self-stretch flex items-baseline gap-1 text-5xl font-['Roboto_Serif']">
              <h2 className="m-0 relative text-[length:inherit] tracking-[-0.02em] leading-[52px] font-bold font-[inherit] mq825:text-[38px] mq825:leading-[42px] mq450:text-[29px] mq450:leading-[31px]">
                Custom
              </h2>
              <div className="w-[202px] relative text-xl leading-6 font-['Public_Sans'] hidden mq450:text-base mq450:leading-[19px]">
                / month
              </div>
            </div>
            <div className="self-stretch relative text-[13px] leading-4 font-['Public_Sans'] text-[rgba(20,31,46,0.62)] overflow-hidden text-ellipsis whitespace-nowrap">
              Large Organizations
            </div>
          </div>
          <button
            type="button"
            className="cursor-pointer border-[rgba(73,89,110,0.2)] border-solid border-[1.5px] py-2 px-5 bg-[transparent] self-stretch rounded-2xl flex items-center justify-center hover:bg-[rgba(112,128,148,0.09)] hover:border-[rgba(112,128,148,0.2)] hover:border-solid hover:border-[1.5px] hover:box-border"
          >
            <div className="relative text-[15px] leading-5 font-medium font-['Public_Sans'] text-[#1b2028] text-left">
              Contact Sales
            </div>
          </button>
          <img
            className="self-stretch h-[1.5px] relative rounded-[1px] max-w-full overflow-hidden max-h-full"
            alt=""
            src={asset("divider.svg")}
          />

          <div className="self-stretch flex flex-col items-start text-[13px] text-[rgba(20,31,46,0.62)] font-['Public_Sans']">
            <div className="self-stretch flex items-center gap-2 mq450:flex-wrap">
              <div className="h-16 w-6 relative overflow-hidden shrink-0" />
              <div className="flex-1 relative leading-4 [display:-webkit-inline-box] overflow-hidden text-ellipsis [-webkit-line-clamp:20] [-webkit-box-orient:vertical] min-w-[140px]">
                Everything in R&amp;D Team
                <br />
                <br />
                Unlimited Users
                <br />
                <br />
                Multi-Site Team Management
                <br />
                <br />
                Custom Simulation Models
                <br />
                <br />
                Private Ingredient Databases
                <br />
                <br />
                Role-Based Access Control
                <br />
                <br />
                SAP / ERP Integrations
                <br />
                <br />
                Custom AI Model Training
                <br />
                <br />
                Dedicated Customer Success
                <br />
                <br />
                SLA + Enterprise Security
              </div>
            </div>
          </div>
        </section>
      </div>

      <img
        className="w-[calc(100%_+_192px)] absolute !m-0 right-[-96px] bottom-[0px] left-[-96px] max-w-full overflow-hidden max-h-full z-[2] shrink-0"
        loading="lazy"
        alt=""
        src={asset("divider.svg")}
      />
    </section>
  );
}
