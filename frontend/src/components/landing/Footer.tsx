import { footerColumns, socialIcons, asset } from "./landing-data";

export function Footer() {
  return (
    <footer className="self-stretch bg-[#fafcff] flex flex-col items-start pt-24 px-0 pb-[52px] gap-8 z-[0] text-left text-[15px] text-[rgba(20,31,46,0.62)] font-['Public_Sans'] mq825:gap-4 mq450:pt-[62px] mq450:pb-[34px] mq450:box-border">
      <img
        className="self-stretch h-[1.5px] relative max-w-full overflow-hidden max-h-full"
        loading="lazy"
        alt=""
        src={asset("divider.svg")}
      />

      <div className="self-stretch flex items-start flex-wrap content-start gap-[52px] mq825:gap-[26px]">
        <div className="self-stretch flex-1 flex flex-col items-start justify-between min-w-[218px]">
          <div className="flex items-start gap-3.5">
            {socialIcons.map((icon) => (
              <img
                key={icon}
                className="h-6 w-6 relative"
                alt=""
                src={asset(icon)}
              />
            ))}
          </div>
        </div>

        {footerColumns.map((column) => (
          <div key={column.title} className={cnFooterColumn(column.title)}>
            <div
              className={
                column.title === "Title"
                  ? "self-stretch relative leading-5 font-medium"
                  : "self-stretch relative leading-5 font-medium text-[#1b2028] shrink-0"
              }
            >
              {column.title}
            </div>
            {column.title === "Title" ? (
              <div className="self-stretch relative leading-5 font-medium text-[rgba(20,31,46,0.62)]">
                {column.items[0]}
                <br />
                <br />
                {column.items[1]}
                <br />
                <br />
                {column.items[2]}
                <br />
                <br />
                {column.items[3]}
                <br />
                <br />
                {column.items[4]}
              </div>
            ) : (
              column.items.map((item) => (
                <div
                  key={item}
                  className="self-stretch relative leading-5 font-medium shrink-0"
                >
                  {item}
                </div>
              ))
            )}
            {column.title !== "Title" && column.items.length < 5 ? (
              <>
                <div className="w-[200px] relative leading-5 font-medium hidden shrink-0">
                  Page link
                </div>
                <div className="w-[200px] relative leading-5 font-medium hidden shrink-0">
                  Page link
                </div>
              </>
            ) : null}
          </div>
        ))}
      </div>
    </footer>
  );
}

function cnFooterColumn(title: string) {
  if (title === "Title") {
    return "w-[200px] flex flex-col items-start justify-center gap-2.5 text-[#1b2028]";
  }

  return "w-[200px] flex flex-col items-start justify-center gap-2.5";
}
