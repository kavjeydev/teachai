import { nextui } from "@nextui-org/theme";
import { dark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import type { Config } from "tailwindcss";

const plugin = require("tailwindcss/plugin");
export default {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@nextui-org/theme/dist/components/(button|input|modal|popover|progress|spinner|ripple|form).js",
  ],
  theme: {
    extend: {
      colors: {
        trainlymainlight: "#5522FF",
        trainlymaindark: "#5522FF",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        lightmaincolor: "#181818",
        darkmaincolor: "#0A0A0A",
        textmaincolor: "#DAE2DF",
        textnormal: "#FFFFFF",
        buttoncolor: "#5522FF",
        darkbg: "#2C2A2E",
        maincolor: "#277AFF",
        secondcolor: "#FFFFFF",
        thirdcolor: "#454ADE",
        darkdarkbg: "#211F22",
        textactive: "#FFD866",
        lightindark: "#403E41",
        lightinlight: "#FFFFFF",
        bordercolor: "#1D212E",
        lightbg: "#EDE7E5",
        lightlightbg: "#FAF4F2",
        lighttextactive: "#E14774",
        lightborder: "#D3CDCC",
        second: "#FCDDB4",
        third: "#277AFF",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      fontFamily: {
        recursive: ["Recursive", "sans-serif"],
        literata: ["Literata", "serif"],
        geist: ["Geist", "sans-serif"],
        darkerGrotesque: ["Darker Grotesque", "sans-serif"],
      },
      keyframes: {
        blink: {
          "0%, 100%": {
            opacity: "1",
          },
          "50%": {
            opacity: "0",
          },
        },
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "collapsible-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-collapsible-content-height)",
          },
        },
        "collapsible-up": {
          from: {
            height: "var(--radix-collapsible-content-height)",
          },
          to: {
            height: "0",
          },
        },
        gradient: {
          to: {
            backgroundPosition: "var(--bg-size, 300%) 0",
          },
        },
      },
      animation: {
        blink: "blink 1s step-start infinite",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "collapsible-down": "collapsible-down 0.2s ease-out",
        "collapsible-up": "collapsible-up 0.2s ease-out",
        gradient: "gradient 8s linear infinite",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },

  plugins: [
    nextui(),
    require("tailwindcss-animate"),
    plugin(function ({ addUtilities }: any) {
      addUtilities({
        ".scrollbar-none": {
          "&::-webkit-scrollbar": {
            display: "none",
          },
        },
      });
    }),
  ],
} satisfies Config;
