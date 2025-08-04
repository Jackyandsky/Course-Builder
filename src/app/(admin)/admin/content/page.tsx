'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ContentRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to admin dashboard - content is now managed through proprietary products
    router.push('/admin');
  }, [router]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500">Redirecting to admin dashboard...</p>
    </div>
  );
}