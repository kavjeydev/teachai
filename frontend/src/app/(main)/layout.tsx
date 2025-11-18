"use client";

import { AuthWrapper } from "@/components/auth-wrapper";
import { OrganizationProvider } from "@/components/organization-provider";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthWrapper showError={false}>
      <OrganizationProvider>
        <div className="flex dark:bg-[#121212] ">
          <main className="flex-1 h-full overscroll-contain">
            {/* <Navbar /> */}
            {children}
          </main>
        </div>
      </OrganizationProvider>
    </AuthWrapper>
  );
};

export default MainLayout;
