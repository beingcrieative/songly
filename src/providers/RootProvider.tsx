"use client";

import { SessionReadyProvider } from "@/components/auth/SessionBridge";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function RootProvider({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <SessionReadyProvider>{children}</SessionReadyProvider>
    </ErrorBoundary>
  );
}
