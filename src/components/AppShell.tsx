"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const SplashScreen = dynamic(() => import("@/components/SplashScreen"), { ssr: false });

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  return (
    <>
      {!ready && <SplashScreen onDone={() => setReady(true)} />}
      <div style={{ visibility: ready ? "visible" : "hidden" }}>
        {children}
      </div>
    </>
  );
}
