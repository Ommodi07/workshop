
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MedicalNFT - Your Health Records, Your Control',
  description: 'Secure, decentralized medical record ownership. Own your health data with blockchain-backed NFTs. Control who sees your records.',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%233b82f6" width="100" height="100"/><path fill="white" d="M50 20L35 40h10v30H55V40h10z" stroke="white" strokeWidth="2"/></svg>',
  },
};

    export default function RootLayout({
      children,
    }: {
      children: React.ReactNode;
    }) {
      return (
        <html lang="en" suppressHydrationWarning>
          <body className={inter.className}>
            <Providers>
              {children}
            </Providers>
          </body>
        </html>
      );
    }
  