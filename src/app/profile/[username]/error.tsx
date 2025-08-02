"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log the error to an external service
    console.error(error);
  }, [error]);

  return (
    <main className="flex h-full flex-col items-center justify-center">
      <h2 className="text-center text-2xl font-bold">Something went wrong!</h2>
      <p className="mt-2 text-center text-sm text-red-600">{error.message}</p>

      <button
        className="mt-6 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-500"
        onClick={() => reset()}
      >
        Try again
      </button>
    </main>
  );
}
