import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { SidebarProvider } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/context/ToastContext";
import { ToastContainer } from "@/components/ui/toast/Toast";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Leads Management System",
  description: "Manage leads, track conversions, and analyze performance",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-icon.svg", sizes: "180x180", type: "image/svg+xml" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} font-outfit dark:bg-gray-900`}>
        <ThemeProvider>
          <SidebarProvider>
            <ToastProvider>
              <Providers>{children}</Providers>
              <ToastContainer />
            </ToastProvider>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
