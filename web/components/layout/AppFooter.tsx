import Link from "next/link";

const footerLinks = [
  { label: "Workspace home", href: "/" },
  { label: "BevOrigin", href: "https://bevorigin.com" },
  { label: "Contact", href: "https://bevorigin.com/contact/" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/levannepharidze" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

export function AppFooter() {
  return (
    <footer className="relative mt-16 border-t border-slate-200/70 bg-white/60 backdrop-blur-sm">
      <div className="mx-auto flex max-w-375 flex-col gap-6 px-4 py-9 md:flex-row md:items-center md:justify-between md:px-6">
        <div>
          <h3 className="text-sm font-bold tracking-[0.08em] text-slate-900">BEVORIGIN R&amp;D WORKSPACE</h3>
          <p className="mt-1 text-xs text-slate-400">Private client access · From Idea to Shelf</p>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500" aria-label="Workspace footer">
          {footerLinks.map((item) => (
            <Link key={item.label} href={item.href} className="transition hover:text-[#147F82]">
              {item.label}
            </Link>
          ))}
        </nav>
        <p className="text-xs text-slate-400">© {new Date().getFullYear()} BevOrigin</p>
      </div>
    </footer>
  );
}
