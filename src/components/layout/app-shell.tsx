"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "./navbar";
import { MobileNav } from "./mobile-nav";
import { Footer } from "./footer";
import { CreateHangoutModal } from "@/components/hangouts/create-hangout-modal";

export interface AppShellProps {
  children: React.ReactNode;
  showFooter?: boolean;
}

export function AppShell({ children, showFooter = true }: AppShellProps) {
  const pathname = usePathname();
  const isMessagesPage = pathname?.startsWith("/messages");
  const [isHangoutModalOpen, setIsHangoutModalOpen] = React.useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-campus-bg text-campus-charcoal">
      <Navbar onOpenCreateHangout={() => setIsHangoutModalOpen(true)} />
      
      {/* Main page content area with mobile bottom padding for dock */}
      <main className={`flex-1 ${isMessagesPage ? "pb-0 md:pb-6" : "pb-20 md:pb-10"}`}>
        {children}
      </main>

      {showFooter && !isMessagesPage && <Footer />}

      <MobileNav onOpenCreateHangout={() => setIsHangoutModalOpen(true)} />

      {/* Spontaneous Hangout Creation Modal */}
      <CreateHangoutModal
        isOpen={isHangoutModalOpen}
        onClose={() => setIsHangoutModalOpen(false)}
      />
    </div>
  );
}
