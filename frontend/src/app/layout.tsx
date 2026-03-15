import type { Metadata } from "next";
import { Epilogue, Manrope } from "next/font/google";
import "@/styles/globals.css";

const epilogue = Epilogue({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-epilogue",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "Arada Burger | Modern-Vintage Diner",
  description: "Gourmet burgers and hotdogs with a retro vibe.",
  icons: {
    icon: "/images/burger_favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${epilogue.variable} ${manrope.variable}`}>
      <body className="font-body antialiased">
        {children}
      </body>
    </html>
  );
}
