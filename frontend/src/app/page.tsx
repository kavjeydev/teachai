"use client";

import { SignedIn, SignedOut, SignInButton, useUser } from "@clerk/nextjs";
import { Button } from "@nextui-org/button";
import { useRouter } from "next/navigation";
import React, { Suspense } from "react";
import Carousel from "./(main)/components/carousel";
import VideoModal from "./(main)/components/video-modal";
import Navbar from "./components/navbar";
import { Spinner } from "@nextui-org/spinner";
import { DockDemo } from "./(main)/components/dock";
// import Spline from '@splinetool/react-spline/next';
import dynamic from "next/dynamic";

const SplineScene = dynamic(() => import("./(main)/components/spline-scene"), {
  ssr: false,
  loading: () => (
    <img className="fixed top-0 h-full w-full cursor-" src="/placeholder.jpg" />
  ),
});

interface CyclingTextProps {
  responses: string[];
  displayDuration: number;
}

function CyclingText({ responses, displayDuration = 3000 }: CyclingTextProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [animate, setAnimate] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      // Start slide-out animation
      setAnimate(false);
      // After animation, update text and slide it in
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % responses.length);
        setAnimate(true);
      }, 500); // duration of slide-out transition in ms
    }, displayDuration);
    return () => clearTimeout(timer);
  }, [currentIndex, responses, displayDuration]);

  return (
    <span className=" overflow-hidden inline-block h-22 pt-8 pb-3 -mt-6">
      <span
        className={`inline-block transform transition-all duration-700 text-trainlymainlight ${
          animate
            ? "translate-y-0 opacity-100"
            : "translate-y-[120%] opacity-100"
        }`}
      >
        {responses[currentIndex]}
      </span>
    </span>
  );
}

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
  const { user } = useUser();
  const responses = [
    "students",
    "engineers",
    "founders",
    "data scientists",
    "educators",
    "researchers",
    "developers",
    "designers",
    "marketers",
    "product managers",
    "AI enthusiasts",
  ];

  // Choose the response once during the initial mount
  const [selectedResponse] = React.useState(() => {
    return responses[Math.floor(Math.random() * responses.length)];
  });

  return (
    <div className="flex flex-col justify-center text-center">
      <Navbar />
      <DockDemo />
      <div className="flex flex-col gap-8 justify-center items-center h-screen">
        <div className="flex flex-col gap-2">
          <h1 className="font-geist leading-[1] tracking-tight font-normal text-xl w-[48rem] text-[#292716]/60 dark:text-textmaincolor/60">
            Take control of your AI with fine-grained context control 🚀
          </h1>
          <h1 className="font-literata leading-[1] tracking-tight font-normal text-6xl w-[48rem] dark:text-textmaincolor text-[#292716]">
            The AI training platform for &nbsp;
            <CyclingText responses={responses} displayDuration={2700} />
          </h1>
        </div>

        <div className="flex gap-4">
          {user === undefined && (
            <div className="">
              <Spinner />
            </div>
          )}
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
          <VideoModal />
          {/* <Button variant="faded" className="">
            Watch Demo <span className="mt-0.5">▶</span>
          </Button> */}
        </div>
      </div>
    </div>
  );
}
