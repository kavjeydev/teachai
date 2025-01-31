"use client";

import { useRouter } from "next/navigation";
import ThemeSwitcher from "../(main)/components/theme-switcher";

export const PublicNav = () => {
  const router = useRouter();
  return (
    <div className="fixed z-[999999] top-0 left-0 h-12 w-screen flex justify-between px-8 items-center">
      <h1
        className="font-literata text-2xl cursor-pointer dark:text-white text-black"
        onClick={() => router.push("/")}
      >
        trainly
      </h1>
      <ThemeSwitcher />
    </div>
  );
};
