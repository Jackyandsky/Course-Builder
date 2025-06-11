'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function SchedulesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <DashboardLayout>{children}</DashboardLayout>
    </AuthGuard>
  );
}