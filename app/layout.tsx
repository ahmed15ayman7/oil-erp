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
      <head>
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="نظام إدارة مصنع الزيت المتكامل - حل شامل لإدارة عمليات مصنع الزيت من المبيعات والمشتريات والمخزون والعملاء والموردين" />
        <meta name="keywords" content="مصنع زيت, إدارة مصنع, نظام erp, برنامج محاسبة, إدارة المخزون, إدارة المبيعات, إدارة المشتريات" />
        <meta name="author" content="نظام إدارة مصنع الزيت" />
        <meta property="og:title" content="نظام إدارة مصنع الزيت المتكامل" />
        <meta property="og:description" content="نظام إدارة شامل لمصانع الزيت يشمل المبيعات والمشتريات والمخزون والعملاء" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="ar_SA" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://oil-erp.com" />
      </head>
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
