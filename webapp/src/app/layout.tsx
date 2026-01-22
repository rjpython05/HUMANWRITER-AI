import type { Metadata } from "next";
import { SessionProvider } from "@/components/providers/session-provider";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: "HumanWriter AI - Advanced AI Text Humanization",
  description: "Transform AI-generated text into authentic, human-like writing across all academic disciplines",
  keywords: ["AI humanizer", "academic writing", "text generation", "AI detection"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <SessionProvider>
          {children}
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
