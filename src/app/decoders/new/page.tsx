'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DecoderForm } from '@/components/decoders/DecoderForm';

export default function NewDecoderPage() {
  return (
    <AuthGuard requireAuth={true}>
      <DashboardLayout>
        <DecoderForm />
      </DashboardLayout>
    </AuthGuard>
  );
}