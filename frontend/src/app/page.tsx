"use client";

import { SignedIn, SignedOut, SignInButton, useUser } from "@clerk/nextjs";
import { Button } from "@nextui-org/button";
import { useRouter } from "next/navigation";
import React, { Suspense, useEffect } from "react";
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
import Lenis from "@studio-freight/lenis";
import { AnimatedGradientText } from "@/components/magicui/animated-gradient-text";

const ParticlesBackground = dynamic(() => import("./components/particles"), {
  ssr: false,
});

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

  useEffect(() => {
    // Initialize Lenis
    const lenis = new Lenis({
      duration: 1.5,
      easing: (t: number) => t,
      smoothWheel: true,
      lerp: 0.1,
    });

    // Your animation loop
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Cleanup on unmount
    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <div className="flex flex-col justify-center text-center">
      <Navbar />
      {/* {theme === "dark" ? <SplineSceneDark /> : <SplineScene />} */}
      {/* <DockDemo /> */}
      {/* <ParticlesBackground /> */}
      <GridPatternLinearGradient />
      <div className="flex flex-col gap-8 justify-center items-center h-[93vh] z-20">
        <div className="flex flex-col gap-2 p-10">
          <div className="absolute h-[16rem] w-[54rem] bg-white dark:bg-darkmaincolor blur-lg z-30"></div>
          <h1 className="font-darkerGrotesque leading-[1] tracking-tight font-normal text-2xl w-[53rem] text-[#292716]/60 dark:text-textmaincolor/60 z-50">
            Take control of your AI with granular context control
          </h1>
          <h1
            className="font-darkerGrotesque font-[400]
           leading-[0.8] text-7xl w-[53rem] text-muted-foreground z-50"
          >
            <AnimatedGradientText colorFrom="#5522FF" colorTo="#CA46FF">
              AI Training
            </AnimatedGradientText>{" "}
            made simple for{" "}
            <span className="text-black dark:text-white">
              developers, students, founders, enthusiasts, and educators
              <span className="text-trainlymainlight">*</span>
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
        <div
          className="absolute flex bottom-20 w-80 text-left right-4 gap-2
        font-darkerGrotesque text-2xl text-muted-foreground"
        >
          <h1 className="relative bottom-2 text-5xl text-trainlymainlight">
            *
          </h1>
          <h1>And for anyone who's ever wanted a custom AI solution!</h1>
        </div>
      </div>
      <div className="relative h-96 w-ful">
        <div className="absolute h-96 w-full bg-white z-10 blur-xl dark:bg-darkmaincolor"></div>
        <GridPatternLinearGradientBottom />
        <div className="px-20 flex justify-between items-center z-20">
          <div
            className="relative w-[20rem] flex flex-col border border-muted-foreground/30 rounded-lg
           py-6 px-5 gap-10 justify-center bg-white dark:bg-darkmaincolor z-50"
          >
            <h1 className="  leading-none text-8xl text-left text-black dark:text-white font-darkerGrotesque">
              100%
            </h1>
            <h1 className="text-xl text-left text-muted-foreground font-darkerGrotesque font-normal">
              GRANULAR DATA CONTROL
            </h1>
          </div>
          <div
            className="relative w-[20rem] flex flex-col border border-muted-foreground/30 rounded-lg
           py-6 px-5 gap-10 justify-center bg-white dark:bg-darkmaincolor z-50"
          >
            <h1 className="  leading-none text-8xl text-left text-black dark:text-white font-darkerGrotesque">
              3.5x
            </h1>
            <h1 className="text-xl text-left text-muted-foreground font-darkerGrotesque font-normal">
              DEVELOPMENT SPEEDUP
            </h1>
          </div>
          <div
            className="relative w-[20rem] flex flex-col border border-muted-foreground/30 rounded-lg
           py-6 px-5 gap-10 justify-center bg-white dark:bg-darkmaincolor z-50"
          >
            <h1 className="  leading-none text-8xl text-left text-black dark:text-white font-darkerGrotesque">
              12+
            </h1>
            <h1 className="text-xl text-left text-muted-foreground font-darkerGrotesque font-normal">
              AI MODELS AT YOUR DISPOSAL
            </h1>
          </div>
          <div
            className="relative w-[20rem] flex flex-col border border-muted-foreground/30 rounded-lg
           py-6 px-5 gap-10 justify-center bg-white dark:bg-darkmaincolor z-50"
          >
            <h1 className="  leading-none text-8xl text-left text-black dark:text-white font-darkerGrotesque">
              128K+
            </h1>
            <h1 className="text-xl text-left text-muted-foreground font-darkerGrotesque font-normal">
              CONTEXT WINDOW
            </h1>
          </div>
        </div>
      </div>

      <div className="h-96 w-full flex justify-between px-20 gap-96 dark:bg-darkmaincolor ">
        <div className="font-darkerGrotesque text-xl w-[30rem]">
          FULL CONTROL
        </div>
        <div className="font-darkerGrotesque text-6xl text-left">
          Our solution let's you get started with RAG in seconds with full,
          granular control over your data, training process, and model
          deployment.
        </div>
      </div>
    </div>
  );
}
