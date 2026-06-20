import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Grove — Git worktrees from your menu bar",
  description:
    "Grove turns git worktrees into one-click workspaces. Spin up an isolated checkout for every feature, fix, or AI agent — then switch between them from your menu bar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen font-sans">
          <Nav />
          {children}
          <Footer />
        </div>
      </body>
    </html>
  );
}
