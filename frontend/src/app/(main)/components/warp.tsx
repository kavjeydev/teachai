import { WarpBackground } from "@/components/magicui/warp-background";
import React from "react";

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
        className={`inline-block transform transition-all duration-700 text-amber-400 ${
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

export function Warp() {
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
  return (
    <WarpBackground className=" w-full h-80 z-0 pb-20">
      <h1 className="font-geist leading-[1] tracking-tight font-normal text-xl w-[48rem] text-[#292716]/60 dark:text-textmaincolor/60">
        Take control of your AI with fine-grained context control 🚀
      </h1>
      <h1 className="font-literata leading-[1] tracking-tight font-normal text-6xl w-[48rem] dark:text-textmaincolor text-[#292716]">
        The AI training platform for &nbsp;
        <CyclingText responses={responses} displayDuration={2700} />
      </h1>
    </WarpBackground>
  );
}
