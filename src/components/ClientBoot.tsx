"use client";

import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";
import InstallPrompt from "@/components/pwa/InstallPrompt";
import SessionBridge from "@/components/auth/SessionBridge";

export default function ClientBoot() {
  return (
    <>
      <ServiceWorkerRegister />
      <InstallPrompt />
      <SessionBridge />
    </>
  );
}

