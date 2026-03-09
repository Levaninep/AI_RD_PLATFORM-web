import "./globals.css";
import FloatingChatWidget from "@/components/chat/FloatingChatWidget";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen text-gray-900">
        <TooltipProvider>
          {children}
          <FloatingChatWidget />
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
