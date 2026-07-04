import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { DebugPanel } from "@/components/debug/DebugPanel";
import ToastProviderWrapper from "@/components/feedback/ToastProviderWrapper";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "CountCard - Marine Corps Drill Instructor Accountability",
  description: "Web-based Marine Corps Drill Instructor accountability application for tracking and managing recruits",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <AuthProvider>
            <ToastProviderWrapper>
              {children}
            </ToastProviderWrapper>
            {/* Debug Panel - enabled via NEXT_PUBLIC_DEBUG_PANEL=true or window.__DEBUG_PANEL__=true */}
            <DebugPanel enabled={process.env.NEXT_PUBLIC_DEBUG_PANEL === 'true'} />
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
