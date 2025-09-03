import { Metadata } from 'next';
import PublicHeader from '@/components/layout/PublicHeader';
import PublicFooter from '@/components/layout/PublicFooter';

export const metadata: Metadata = {
  title: 'GRAMMATICOS PLATFORM SOLUTION - Literary Excellence & Critical Thinking',
  description: 'Transform your educational content into structured, engaging courses with our comprehensive course building tools, content management system, and student tracking features.',
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f5f5f7]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      <PublicHeader />
      <main className="min-h-[calc(100vh-44px)] pt-[44px]">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}