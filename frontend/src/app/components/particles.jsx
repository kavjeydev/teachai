import { useTheme } from "next-themes";
import React from "react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";

export default function ParticlesBackground() {
  const particlesInit = async (engine) => {
    await loadSlim(engine);
  };

  const particlesLoaded = (container) => {
  };

  const { theme } = useTheme();
  const mainColor = theme === "dark" ? "#FFFFFF" : "#000000";
  const dotOpacity = theme === "dark" ? 0.4 : 0.3;
  const linkOpacity = theme === "dark" ? 0.3 : 0.2;

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      loaded={particlesLoaded}
      className="z-10 absolute top-0"
      options={{
        fullScreen: {
          enable: true,
          zIndex: -1,
        },
        // background: {
        //   color: {
        //     value: "#000000", // background color
        //   },
        // },
        fpsLimit: 120,
        interactivity: {
          events: {
            onHover: {
              enable: true,
              mode: "repulse", // repulse particles on hover
            },
            resize: true,
          },
          modes: {
            repulse: {
              distance: 75,
              duration: 0.4,
            },
          },
        },
        particles: {
          number: {
            value: 80,
            density: {
              enable: true,
              area: 2400,
            },
          },
          color: {
            value: [mainColor, "#F20089"],
          },
          shape: {
            type: "circle",
          },
          opacity: {
            value: dotOpacity,
          },
          size: {
            value: { min: 1, max: 5 },
          },
          // Enable links to connect particles
          links: {
            enable: true,
            distance: 150, // maximum distance for linking particles
            color: mainColor, // link color
            opacity: linkOpacity,
            width: 1,
          },
          move: {
            enable: true,
            speed: 0.7,
            direction: "none",
            random: false,
            straight: false,
            outModes: {
              default: "bounce",
            },
          },
        },
        detectRetina: true,
      }}
    />
  );
}
