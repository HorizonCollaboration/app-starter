// Fixed by Horizon: don't change this file. The app's own screens start in page.tsx.
import type { Metadata, Viewport } from "next";
import Banner from "@/components/Banner";
import horizon from "@/horizon.json";
import "./globals.css";

export const metadata: Metadata = {
  title: horizon.name,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB" className="h-full">
      <body className="flex min-h-full flex-col">
        <Banner />
        {children}
      </body>
    </html>
  );
}
