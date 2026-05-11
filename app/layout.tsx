import type { Metadata } from 'next';
import Script from 'next/script';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Gringoou - Comunidade Brasileira',
  description:
    'Uma plataforma completa para a comunidade brasileira no exterior, oferecendo servicos de moradia, empregos, negocios locais, noticias e rede social.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-[#F6FBFC]`}>
        <Script src="https://cdn.tailwindcss.com" strategy="beforeInteractive" />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
