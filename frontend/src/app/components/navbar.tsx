"use client";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignOutButton,
  SignUpButton,
  useUser,
} from "@clerk/nextjs";
import { Button } from "@nextui-org/button";
import { Popover, PopoverTrigger, PopoverContent } from "@nextui-org/popover"; // <-- Make sure you import these
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const { user } = useUser();

  return (
    <div
      className="fixed top-0 flex justify-between items-center h-16 bg-transparent text-black
        font-recursive px-4 w-screen"
    >
      {/* Logo */}
      <h1
        className="font-literata text-2xl cursor-pointer text-white"
        onClick={() => router.push("/")}
      >
        trainley
      </h1>

      <div className="flex gap-3">
        {/* If the user is signed out, show Sign In / Sign Up */}
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

        {/* If the user is signed in, show the Popover on user profile image */}
        <SignedIn>
          <Popover placement="bottom-end">
            <PopoverTrigger>
              {/* Profile image as the trigger */}
              <img
                src={user?.imageUrl}
                height={40}
                width={40}
                className="rounded-full cursor-pointer"
              />
            </PopoverTrigger>

            <PopoverContent>
              <div className="flex flex-col p-4 gap-2">
                <Button
                  variant="solid"
                  className="bg-buttoncolor hover:bg-purple-200 w-full"
                  onPress={() => router.push("/dashboard")}
                >
                  Dashboard
                </Button>

                <SignOutButton>
                  <Button
                    variant="solid"
                    className="bg-black/60 text-white hover:bg-black w-full"
                  >
                    Sign Out
                  </Button>
                </SignOutButton>
              </div>
            </PopoverContent>
          </Popover>
        </SignedIn>
      </div>
    </div>
  );
}
