"use client";

import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";
import SessionBridge from "@/components/auth/SessionBridge";

export default function ClientBoot() {
  return (
    <>
      <ServiceWorkerRegister />
      <SessionBridge />
    </>
  );
}

