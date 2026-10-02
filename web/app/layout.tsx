import "./globals.css";
import type { Metadata } from "next";
import FloatingChatWidget from "@/components/chat/FloatingChatWidget";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: {
    default: "BevOrigin R&D Workspace",
    template: "%s | BevOrigin R&D Workspace",
  },
  description:
    "A secure beverage development workspace for formulations, technical calculators, ingredient data and shelf-life planning.",
  icons: { icon: "/bevorigin-mark.svg" },
};

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
