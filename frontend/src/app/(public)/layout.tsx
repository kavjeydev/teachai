"use client";

import { ReactNode } from "react";

interface PublicLayoutProps {
  children: ReactNode;
}

const PublicLayout = ({ children }: PublicLayoutProps) => {
  return (
    <div className="min-h-screen dark:bg-[#121212]">
      <main className="flex-1 h-full overscroll-contain">
        {children}
      </main>
    </div>
  );
};

export default PublicLayout;
