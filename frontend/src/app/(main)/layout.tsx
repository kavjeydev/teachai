"use client";

import { AuthWrapper } from "@/components/auth-wrapper";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthWrapper showError={false}>
      <div className="flex dark:bg-[#121212] ">
        <main className="flex-1 h-full overscroll-contain">
          {/* <Navbar /> */}
          {children}
        </main>
      </div>
    </AuthWrapper>
  );
};

export default MainLayout;
