"use client";
import React, { useState, useEffect } from "react";

function useTypewriterEffect(text: string, speed = 100) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(i));
      i++;
      if (i >= text.length) {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return displayedText;
}

export default function Home() {
  const responses = [
    "teach me about black holes.",
    "what does this codebase do?",
    "what is this research paper about?",
    "what is the best way to implement a neural network?",
    "how can I improve this code quality?",
    "what security concerns exist in this codebase?",
  ];

  const selectedResponse =
    responses[Math.floor(Math.random() * responses.length)];
  const typedResponse = useTypewriterEffect(selectedResponse, 70); // Adjust speed as desired

  return (
    <div className="flex justify-center">
      <div className="flex flex-col gap-2 justify-center items-center h-screen w-3/5">
        <h1 className="font-recursive leading-[1] tracking-tight font-normal text-5xl w-4/5 text-textmaincolor">
          Hi Trainly, {typedResponse}
        </h1>
        <h1 className="font-recursive leading-[1] tracking-tight font-normal text-2xl w-4/5 text-textmaincolor">
          The AI expert for your personal use case
        </h1>
      </div>
      <div className="w-2/5"></div>
    </div>
  );
}
