"use client";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex dark:bg-[#121212] ">
      <main className="flex-1 h-full overscroll-contain">
        {/* <Navbar /> */}
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
