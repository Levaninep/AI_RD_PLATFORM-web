import "./globals.css";
import Link from "next/link";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900">
        <header className="border-b">
          <nav className="mx-auto flex max-w-6xl items-center gap-6 p-4">
            <Link href="/" className="font-semibold">
              AI R&amp;D
            </Link>

            <div className="flex gap-4 text-sm text-gray-600">
              <Link href="/dashboard" className="hover:text-black">
                Dashboard
              </Link>
              <Link href="/ingredients" className="hover:text-black">
                Ingredients
              </Link>
              <Link href="/formulations" className="hover:text-black">
                Formulations
              </Link>
              <Link href="/cogs" className="hover:text-black">
                COGS
              </Link>
            </div>
          </nav>
        </header>

        <div className="mx-auto max-w-6xl p-4">{children}</div>
      </body>
    </html>
  );
}
