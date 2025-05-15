import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import { FirebaseProvider } from '@/providers/FirebaseProvider';
import { Toaster } from '@/components/ui/toaster';
import { QueryClientProviderWrapper } from '@/providers/QueryClientProviderWrapper';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'Mendspace',
  description: 'A gentle space for your thoughts.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} font-sans antialiased`}>
        <QueryClientProviderWrapper>
          <FirebaseProvider>
            {children}
            <Toaster />
          </FirebaseProvider>
        </QueryClientProviderWrapper>
      </body>
    </html>
  );
}
