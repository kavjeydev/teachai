"use client";
import React from "react";
import Spline from "@splinetool/react-spline";

const SplineScene = () => {
  return (
    <div className="pointer-events-none">
    <Spline
      // scene="/hero_bg.spline"
      scene="https://prod.spline.design/uA9dInuTEbZFEpMo/scene.splinecode"
      className="relative h-full w-full pointer-events-none bg-red-400"
    />
    </div>
  );
};

export default React.memo(SplineScene);
