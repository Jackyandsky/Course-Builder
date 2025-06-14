'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DecoderForm } from '@/components/decoders/DecoderForm';
import { Decoder, decoderService } from '@/lib/supabase/decoders';
import { Spinner } from '@/components/ui';

export default function EditDecoderPage() {
  const params = useParams();
  const decoderId = params.id as string;
  const [decoder, setDecoder] = useState<Decoder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (decoderId) {
      loadDecoder();
    }
  }, [decoderId]);

  const loadDecoder = async () => {
    try {
      const data = await decoderService.getDecoder(decoderId);
      setDecoder(data);
    } catch (error) {
      console.error('Failed to load decoder:', error);
      setError('Failed to load decoder');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AuthGuard requireAuth={true}>
        <DashboardLayout>
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard requireAuth={true}>
        <DashboardLayout>
          <div className="flex justify-center py-12">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Error Loading Decoder
              </h2>
              <p className="text-gray-600 dark:text-gray-400">{error}</p>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  if (!decoder) {
    return (
      <AuthGuard requireAuth={true}>
        <DashboardLayout>
          <div className="flex justify-center py-12">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Decoder Not Found
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                The decoder you're looking for doesn't exist.
              </p>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requireAuth={true}>
      <DashboardLayout>
        <DecoderForm initialData={decoder} />
      </DashboardLayout>
    </AuthGuard>
  );
}