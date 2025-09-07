import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { GlobalModalProvider } from '@/contexts/GlobalModalContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { GlobalModalContainer } from '@/components/modals/GlobalModalContainer';

// Import auth debug utilities in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  import('@/lib/auth/auth-debug');
}

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
        <ToastProvider>
          <AuthProvider>
            <CartProvider>
              <GlobalModalProvider>
                <div id="root" className="min-h-full">
                  {children}
                </div>
                <GlobalModalContainer />
              </GlobalModalProvider>
            </CartProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
