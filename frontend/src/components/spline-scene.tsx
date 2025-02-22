"use client";
import React from "react";
import Spline from "@splinetool/react-spline";

const SplineScene = () => {
  return (
    <Spline
      // scene="/hero_bg.spline"
      scene="https://prod.spline.design/uA9dInuTEbZFEpMo/scene.splinecode"
      className="absolute h-full w-full pointer-events-none"
    />
  );
};

export default React.memo(SplineScene);
