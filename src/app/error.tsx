"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  React.useEffect(() => {
    console.error("Application error boundary:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full p-8 bg-white border border-campus-border rounded-xl shadow-xs">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-50 text-red-700 flex items-center justify-center border border-red-200">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-2xl text-campus-charcoal font-medium">
          Something went off track
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-campus-muted leading-relaxed">
          {error.message ||
            "We encountered an unexpected error while loading this campus view."}
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button variant="outline" onClick={() => router.push("/")}>
            Back to Home
          </Button>
          <Button variant="primary" onClick={() => reset()}>
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}
