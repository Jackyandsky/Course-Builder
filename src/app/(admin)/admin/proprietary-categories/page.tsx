'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Redirect to the new categories management page
export default function ProprietaryCategoriesPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/admin/settings/categories');
  }, [router]);
  
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <p className="text-gray-500">Redirecting to categories management...</p>
    </div>
  );
}