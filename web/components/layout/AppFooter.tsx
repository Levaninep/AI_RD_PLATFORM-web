import Link from "next/link";

const footerColumns = [
  {
    title: "Product",
    items: [
      { label: "Product Overview", href: "/" },
      { label: "Features", href: "/" },
      { label: "Pricing", href: "/" },
      { label: "Demo", href: "/" },
      { label: "API & Integrations", href: "/" },
    ],
  },
  {
    title: "Resources",
    items: [
      { label: "Blog", href: "/" },
      { label: "Webinars", href: "/" },
      { label: "Case Studies", href: "/" },
    ],
  },
  {
    title: "Support",
    items: [
      { label: "Help Center", href: "/" },
      { label: "Contact Us", href: "/" },
      { label: "Terms of Service", href: "/" },
      { label: "Privacy Policy", href: "/" },
    ],
  },
  {
    title: "Social",
    items: [
      { label: "LinkedIn", href: "/" },
      { label: "Twitter", href: "/" },
      { label: "Facebook", href: "/" },
    ],
  },
];

export function AppFooter() {
  return (
    <footer className="relative mt-16 border-t border-gray-200/60 bg-white/40 backdrop-blur-sm">
      <div className="mx-auto max-w-375 px-4 py-12 md:px-6">
        <div className="flex flex-wrap gap-12 md:gap-16">
          {/* Brand + social */}
          <div className="flex min-w-48 flex-1 flex-col gap-5">
            <div>
              <h3 className="text-base font-bold tracking-tight text-gray-900">
                AI R&D Platform
              </h3>
              <p className="mt-1 text-xs text-gray-400">SaaS Workspace</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Facebook */}
              <Link
                href="/"
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-500 transition hover:bg-blue-100 hover:text-blue-600"
                aria-label="Facebook"
              >
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </Link>
              {/* Instagram */}
              <Link
                href="/"
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-500 transition hover:bg-pink-100 hover:text-pink-600"
                aria-label="Instagram"
              >
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </Link>
              {/* X / Twitter */}
              <Link
                href="/"
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-800"
                aria-label="X"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Link columns */}
          {footerColumns.map((column) => (
            <div key={column.title} className="min-w-32">
              <h4 className="mb-4 text-sm font-semibold text-gray-900">
                {column.title}
              </h4>
              <ul className="space-y-2.5">
                {column.items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-gray-500 transition hover:text-blue-600"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200/60 pt-6 text-xs text-gray-400">
          <p>
            &copy; {new Date().getFullYear()} AI R&D Platform. All rights
            reserved.
          </p>
          <div className="flex gap-4">
            <Link href="/" className="transition hover:text-gray-600">
              Privacy
            </Link>
            <Link href="/" className="transition hover:text-gray-600">
              Terms
            </Link>
            <Link href="/" className="transition hover:text-gray-600">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
