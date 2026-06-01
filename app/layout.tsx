import type { Metadata } from 'next';
import Script from 'next/script';
import { Sora } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const sora = Sora({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
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
      <body className={`${sora.className} bg-[#F6FBFC]`}>
        <Script src="https://cdn.tailwindcss.com" strategy="beforeInteractive" />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
