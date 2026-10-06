"use client";

import { AppProvider } from "@/lib/store";
import { Toaster } from "./ui";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      {children}
      <Toaster />
    </AppProvider>
  );
}
