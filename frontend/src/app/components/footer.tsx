"use client";

import { useRouter } from "next/navigation";
import { SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useNavigationLoading } from "@/hooks/useNavigationLoading";
import Image from "next/image";

export default function Footer() {
  const router = useRouter();
  const { navigateTo } = useNavigationLoading();

  return (
    <footer className="relative bg-black text-white border-t border-white/10">
      {/* Main CTA Section */}
      <div className="max-w-7xl mx-auto px-6 py-24 md:py-32">
        <div className="text-center">
          {/* Large Gradient Heading */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-semibold mb-6 leading-tight tracking-tighter">
            <span className="text-white">Build smart AI apps</span>
            <br />
            <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 bg-clip-text text-transparent tracking-tighter">
              in minutes, not months.
            </span>
          </h2>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed font-light tracking-tight">
            Share your knowledge, get an instant API. Ship AI features faster
            than ever.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <SignUpButton mode="modal">
              <Button className="bg-white text-black hover:bg-white/90 font-medium px-8 py-6 text-base rounded-full transition-colors">
                Get Started
              </Button>
            </SignUpButton>
            <Button
              onClick={() => navigateTo("/pricing")}
              variant="outline"
              className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-white/30 font-medium px-8 py-6 text-base rounded-full transition-colors"
            >
              Pricing
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Links Section */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
            {/* Logo */}
            <div>
              <div
                className="flex flex-col items-start cursor-pointer group"
                onClick={() => navigateTo("/")}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Image
                    src="/trainly_icon_black.png"
                    alt="Trainly Logo"
                    width={32}
                    height={32}
                    className="w-8 h-8"
                  />
                  <span className="text-xl font-semibold text-white">
                    trainly
                  </span>
                </div>
              </div>
            </div>
            {/* Product */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
                Product
              </h3>
              <ul className="space-y-3">
                <li>
                  <button
                    onClick={() => navigateTo("/pricing")}
                    className="text-sm text-white/70 hover:text-amber-400 transition-colors duration-200 font-light"
                  >
                    Pricing
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigateTo("/about")}
                    className="text-sm text-white/70 hover:text-amber-400 transition-colors duration-200 font-light"
                  >
                    About
                  </button>
                </li>
              </ul>
            </div>

            {/* Developers */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
                Developers
              </h3>
              <ul className="space-y-3">
                <li>
                  <button
                    onClick={() =>
                      window.open("https://docs.trainlyai.com", "_blank")
                    }
                    className="text-sm text-white/70 hover:text-amber-400 transition-colors duration-200 font-light"
                  >
                    Docs
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      window.open(
                        "https://docs.trainlyai.com/api-reference/introduction",
                        "_blank",
                      )
                    }
                    className="text-sm text-white/70 hover:text-amber-400 transition-colors duration-200 font-light"
                  >
                    API Reference
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      window.open(
                        "https://docs.trainlyai.com/api-reference/scope-management",
                        "_blank",
                      )
                    }
                    className="text-sm text-white/70 hover:text-amber-400 transition-colors duration-200 font-light"
                  >
                    Data Scoping
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigateTo("/status")}
                    className="text-sm text-white/70 hover:text-amber-400 transition-colors duration-200 font-light"
                  >
                    API Status
                  </button>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
                Support
              </h3>
              <ul className="space-y-3">
                <li>
                  <button
                    onClick={() =>
                      (window.location.href = "mailto:support@trainlyai.com")
                    }
                    className="text-sm text-white/70 hover:text-amber-400 transition-colors duration-200 font-light"
                  >
                    Contact Support
                  </button>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
                Legal
              </h3>
              <ul className="space-y-3">
                <li>
                  <button
                    onClick={() => navigateTo("/privacy-policy")}
                    className="text-sm text-white/70 hover:text-amber-400 transition-colors duration-200 font-light"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigateTo("/terms-of-service")}
                    className="text-sm text-white/70 hover:text-amber-400 transition-colors duration-200 font-light"
                  >
                    Terms of Service
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigateTo("/data-handling")}
                    className="text-sm text-white/70 hover:text-amber-400 transition-colors duration-200 font-light"
                  >
                    Data Handling
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-white/10 pt-8">
            <div className="text-center text-sm text-white/50 font-light">
              © {new Date().getFullYear()} Trainly AI. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
