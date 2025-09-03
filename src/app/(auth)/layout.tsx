'use client';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Remove redundant auth check - AuthGuard handles this

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full">
        {children}
      </div>
    </div>
  );
}