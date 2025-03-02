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
import dynamic from "next/dynamic";
import { Warp } from "./(main)/components/warp";
import { useTheme } from "next-themes";
import { GridPatternLinearGradient } from "./components/grid-hero";
import { TextReveal } from "@/components/magicui/text-reveal";
import { GridPatternLinearGradientBottom } from "./components/grid-hero-bottom";

const SplineScene = dynamic(() => import("../components/spline-scene"), {
  ssr: false,
  loading: () => (
    <img
      className="absolute top-0 h-full w-full -z-20"
      src="/placeholder.jpg"
    />
  ),
});
const SplineSceneDark = dynamic(
  () => import("../components/spline-scene-dark"),
  {
    ssr: false,
    loading: () => (
      <img
        className="absolute top-0 h-full w-full -z-20"
        src="/placeholder.jpg"
      />
    ),
  },
);

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
    <span className=" overflow-hidden inline-block h-24 pt-8 pb-4 -mt-6">
      <span
        className={`inline-block transform transition-all duration-700 bg-gradient-to-t from-trainlymainlight to-[#a490ff]
          bg-clip-text text-transparent ${
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

  const { theme } = useTheme();

  return (
    <div className="flex flex-col justify-center text-center">
      <Navbar />
      {/* {theme === "dark" ? <SplineSceneDark /> : <SplineScene />} */}
      {/* <DockDemo /> */}
      <GridPatternLinearGradient />
      <div className="flex flex-col gap-8 justify-center items-center h-[93vh]">
        <div className="flex flex-col gap-2">
          <h1 className="font-darkerGrotesque leading-[1] tracking-tight font-normal text-2xl w-[53rem] text-[#292716]/60 dark:text-textmaincolor/60 z-50">
            Take control of your AI with granular context control
          </h1>
          <h1
            className="font-darkerGrotesque font-[400]
           leading-[0.8] text-7xl w-[53rem] text-muted-foreground z-50"
          >
            <span className="text-trainlymainlight">AI training</span> made
            simple for{" "}
            <span className="text-black dark:text-white">
              developers, students, founders, enthusiasts, and educators*
            </span>
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
                className="hover:bg-trainlymainlight/80 bg-trainlymainlight shadow-black/10 text-white"
              >
                Get Started
              </Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Button
              variant="faded"
              className="hover:bg-trainlymainlight/10 hover:text-black border-1 dark:text-white text-black
         font-darkerGrotesque font-medium bg-[#f9f9f9] dark:bg-[#222222]"
              onClick={() => router.push("/dashboard")}
            >
              <h1 className="mb-0.5">DASHBOARD</h1>
            </Button>
          </SignedIn>
          <VideoModal />
          {/* <Button variant="faded" className="">
            Watch Demo <span className="mt-0.5">▶</span>
          </Button> */}
        </div>
      </div>
      <div className="relative h-96 w-full">
        <GridPatternLinearGradientBottom />
        <div className="px-20 flex justify-between items-center bg-transparent">
          <div
            className="relative w-[20rem] flex flex-col border border-muted-foreground/30 rounded-lg
           py-6 px-5 gap-10 justify-center bg-white dark:bg-darkmaincolor"
          >
            <h1 className="  leading-none text-8xl text-left text-black dark:text-white font-darkerGrotesque">
              96%
            </h1>
            <h1 className="text-xl text-left text-muted-foreground font-darkerGrotesque font-normal">
              AVERAGE SECTOR COVERAGE
            </h1>
          </div>
          <div
            className="relative w-[20rem] flex flex-col border border-muted-foreground/30 rounded-lg
           py-6 px-5 gap-10 justify-center bg-white dark:bg-darkmaincolor"
          >
            <h1 className="  leading-none text-8xl text-left text-black dark:text-white font-darkerGrotesque">
              11.5x
            </h1>
            <h1 className="text-xl text-left text-muted-foreground font-darkerGrotesque font-normal">
              SOMETHING ELSE
            </h1>
          </div>
          <div
            className="relative w-[20rem] flex flex-col border border-muted-foreground/30 rounded-lg
           py-6 px-5 gap-10 justify-center bg-white dark:bg-darkmaincolor"
          >
            <h1 className="  leading-none text-8xl text-left text-black dark:text-white font-darkerGrotesque">
              1,000+
            </h1>
            <h1 className="text-xl text-left text-muted-foreground font-darkerGrotesque font-normal">
              ANOTHER THING
            </h1>
          </div>
          <div
            className="relative w-[20rem] flex flex-col border border-muted-foreground/30 rounded-lg
           py-6 px-5 gap-10 justify-center bg-white dark:bg-darkmaincolor"
          >
            <h1 className="  leading-none text-8xl text-left text-black dark:text-white font-darkerGrotesque">
              96%
            </h1>
            <h1 className="text-xl text-left text-muted-foreground font-darkerGrotesque font-normal">
              AVERAGE SECTOR COVERAGE
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
}
