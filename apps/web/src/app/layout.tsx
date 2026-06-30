import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import AuthBootstrap from "@/components/AuthBootstrap";
import AchievementToastContainer from "@/components/AchievementToast";
import MotionProvider from "@/components/MotionProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Sudoku 2026",
  description: "Modern Sudoku – guided hints, daily challenges, and streaks.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Sudoku 2026",
  },
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <html lang="no" suppressHydrationWarning className={inter.variable}>
      <body>
        <ServiceWorkerRegistrar />
        <AuthBootstrap />
        <AchievementToastContainer />
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
