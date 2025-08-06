"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AnalysisDemoPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the working simple version
    router.replace('/simple');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
        <p>Loading Advanced Network Intelligence Platform...</p>
      </div>
    </div>
  );
}