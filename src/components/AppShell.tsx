"use client";

import { usePathname } from "next/navigation";
import { AppToolbar } from "@/components/AppToolbar";
import { ProjectProvider } from "@/contexts/ProjectContext";

const PUBLIC_ROUTES = ["/login"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  if (isPublicRoute) {
    return <>{children}</>;
  }
  return (
    <ProjectProvider>
      <div className="flex h-screen overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <AppToolbar />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </ProjectProvider>
  );
}
