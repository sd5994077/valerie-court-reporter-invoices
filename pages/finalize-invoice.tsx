import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function FinalizeInvoicePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to review-invoice since finalization is now handled there
    router.replace('/review-invoice');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to invoice review...</p>
      </div>
    </div>
  );
} 