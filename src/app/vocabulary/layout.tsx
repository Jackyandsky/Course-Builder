import { AuthGuard } from '@/components/auth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function VocabularyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      {/* <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {children}
      </div> */}
      <DashboardLayout>{children}</DashboardLayout>
    </AuthGuard>
  );
}
