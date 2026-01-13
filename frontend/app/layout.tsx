import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GenAI Chat - AI-Powered RAG Chatbot",
  description: "Experience intelligent conversations with our advanced RAG-powered chatbot. Upload documents, get instant answers, and more.",
  keywords: ["AI", "chatbot", "RAG", "GenAI", "machine learning", "NLP"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const stored = localStorage.getItem('genai-theme');
                const theme = (stored === 'light' || stored === 'dark') ? stored : 'dark';
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                }
                localStorage.setItem('genai-theme', theme);
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${outfit.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
