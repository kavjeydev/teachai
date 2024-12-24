"use client";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignOutButton,
  SignUpButton,
} from "@clerk/nextjs";
import { Button } from "@nextui-org/button";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  return (
    <div
      className="fixed top-0 flex justify-between items-center h-16 bg-transparent text-black
        font-recursive px-4 w-screen"
    >
      <img
        src="/teachai_n.png"
        height={120}
        width={120}
        className="bg-blend-difference -z-20 cursor-pointer"
        onClick={() => router.push("/")}
      />
      <div className="flex gap-3">
        <SignedOut>
          <SignUpButton mode="modal">
            <Button
              variant="solid"
              className="hover:bg-purple-200 bg-buttoncolor"
            >
              Sign Up
            </Button>
          </SignUpButton>
          <SignInButton mode="modal">
            <Button
              variant="solid"
              className="hover:bg-slate-800 bg-slate-900 text-white"
            >
              Sign In
            </Button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <Button
            variant="solid"
            className="hover:bg-purple-200 bg-buttoncolor"
            onClick={() => router.push("/dashboard")}
          >
            Dashboard
          </Button>
          <SignOutButton>
            <Button
              variant="solid"
              className="hover:bg-black/100 bg-black/60 text-white"
            >
              Sign Out
            </Button>
          </SignOutButton>
        </SignedIn>
      </div>
    </div>
  );
}
