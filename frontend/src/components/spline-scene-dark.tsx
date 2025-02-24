"use client";
import React from "react";
import Spline from "@splinetool/react-spline";

const SplineSceneDark = () => {
  return (
    <div className="pointer-events-none">
    <Spline
      // scene="/hero_bg.spline"
      scene="https://prod.spline.design/9iKSsTTA-SdAEA3t/scene.splinecode"
      className="absolute h-full w-full pointer-events-none"
    />
    </div>
  );
};

export default React.memo(SplineSceneDark);
