"use client";

import { SignedIn, SignedOut, SignInButton, useUser } from "@clerk/nextjs";
import { Button } from "@nextui-org/button";
import { useRouter } from "next/navigation";
import React from "react";
import Carousel from "./(main)/components/carousel";

function useTypewriterEffect(text: string, speed = 100) {
  const [displayedText, setDisplayedText] = React.useState("");
  const { user } = useUser();

  React.useEffect(() => {
    if (!text) return;

    let currentIdx = 0;
    setDisplayedText("");

    const interval = setInterval(() => {
      const char = text.charAt(currentIdx);
      setDisplayedText((prev) => prev + char);
      currentIdx++;
      if (currentIdx >= text.length) {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return displayedText;
}

export default function Home() {
  const router = useRouter();
  const responses = [
    "teach me about black holes.",
    "what does this codebase do?",
    "what is this research paper about?",
    "what is the best way to implement a neural network?",
    "how can I improve this code quality?",
    "what security concerns exist in this code?",
  ];

  // Choose the response once during the initial mount
  const [selectedResponse] = React.useState(() => {
    return responses[Math.floor(Math.random() * responses.length)];
  });

  const typedResponse = useTypewriterEffect(selectedResponse, 70);

  return (
    <div className="flex flex-col justify-center text-center">
      <div className="flex flex-col gap-8 justify-center items-center h-screen">
        <div className="flex flex-col gap-2">
          <h1 className="font-recursive leading-[1] tracking-tight font-normal text-xl w-[48rem] text-[#292716]/60 dark:text-textmaincolor/60">
            The AI expert for your specialized use case 🚀
          </h1>
          <h1 className="font-literata leading-[1] tracking-tight font-normal text-5xl w-[48rem] dark:text-textmaincolor text-[#292716]">
            <span className="dark:text-blue-200 text-blue-800">
              Hi Trainly,{" "}
            </span>
            {typedResponse}
            <span className="animate-blink p-1">|</span>
          </h1>
        </div>

        <div className="flex gap-4">
          <SignedOut>
            <SignInButton mode="modal">
              <Button
                variant="shadow"
                className="hover:bg-buttoncolor/80 bg-buttoncolor shadow-black/10 text-white"
              >
                Get Started
              </Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Button
              variant="faded"
              className="hover:bg-buttoncolor"
              onClick={() => router.push("/dashboard")}
            >
              Dashboard
            </Button>
          </SignedIn>
          <Button variant="faded" className="">
            Watch Demo <span className="mt-0.5">▶</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
