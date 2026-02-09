import type { Metadata } from "next";
import { SidebarWrapper } from "@/components/sidebar-wrapper";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "016TTR",
  description: "Микро-ERP для личного использования",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="min-h-screen">
        <Providers>
          <div className="min-h-screen md:flex">
            <SidebarWrapper />
            <main className="flex-1 overflow-auto bg-background px-3 py-4 sm:px-4 sm:py-5 md:p-6">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
