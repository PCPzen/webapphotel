"use client";

import React, { Suspense } from "react";
import { ThemeProvider } from "./ThemeProvider";
import { ToastProvider } from "./ToastProvider";

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <Suspense fallback={null}>
        <ToastProvider>{children}</ToastProvider>
      </Suspense>
    </ThemeProvider>
  );
}
