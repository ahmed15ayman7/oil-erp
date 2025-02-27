import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: "نظام إدارة مصنع الزيت المتكامل",
  description: "نظام إدارة مصنع الزيت المتكامل",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className="bg-background min-h-screen">
        <Providers>
          {children}
          <ToastContainer
            position="bottom-left"
            autoClose={5000}
            rtl={true}
          />
        </Providers>
      </body>
    </html>
  );
}
