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
          <div className="flex min-h-screen">
            <SidebarWrapper />
            <main className="flex-1 overflow-auto bg-background p-6">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
