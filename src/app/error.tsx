'use client';

import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

export default function Error({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    // Log error to console
    console.error('Application error:', error);
  }, [error]);

  function reloadPage() {
    window.location.reload();
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 min-h-[200px]">
      <div className="bg-card p-6 rounded-lg border shadow max-w-md w-full">
        <h2 className="text-lg font-semibold mb-4">Error</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Something went wrong in this part of the application, but you can continue using other features.
        </p>
        <p className="text-xs bg-muted p-2 rounded mb-4 overflow-auto max-h-[100px]">
          {error.message || 'Unknown error'}
        </p>
        <div className="flex justify-end">
          <Button onClick={reloadPage} variant="outline" size="sm">
            Retry
          </Button>
        </div>
      </div>
    </div>
  );
}
