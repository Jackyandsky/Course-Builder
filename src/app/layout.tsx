import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Course Builder - Modular Course Design Platform',
  description: 'A flexible, customizable online course construction tool for educators, trainers, and content creators.',
  keywords: 'course builder, education, training, course management, curriculum design',
  authors: [{ name: 'Course Builder Team' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full antialiased`}>
        <AuthProvider>
          <div id="root" className="min-h-full">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
