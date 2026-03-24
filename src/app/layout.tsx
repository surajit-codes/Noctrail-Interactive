import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "BriefAI — CEO Morning Briefing Platform",
  description:
    "AI-powered business intelligence that gives Indian CEOs everything they need every morning to make smart decisions.",
  keywords: ["BriefAI", "CEO briefing", "business intelligence", "Indian markets", "NIFTY", "AI analysis"],
  openGraph: {
    title: "BriefAI — CEO Morning Briefing Platform",
    description: "AI-powered business intelligence for Indian CEOs",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full antialiased" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
        <div className="dashboard-shell">
          <Sidebar />
          {children}
        </div>
      </body>
    </html>
  );
}
