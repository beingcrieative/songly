'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Root page - redirects to the modern studio interface
 * Legacy conversational UI has been moved to page.tsx.legacy
 */
export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/studio');
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-gray-500">Redirecting to studio...</p>
    </div>
  );
}
