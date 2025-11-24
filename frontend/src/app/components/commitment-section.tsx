"use client";

import { CheckCircle } from "lucide-react";

export default function CommitmentSection() {
  return (
    <section className="py-20 bg-black text-white relative">
      {/* Top glow effect */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-amber-400/20 via-amber-400/5 to-transparent pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="max-w-3xl">
          {/* Heading - Large prominent style */}
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-sans font-normal mb-6 leading-tight">
            A commitment to
            <br />
            <span className="font-normal">AI accuracy</span>
          </h2>

          {/* Descriptive Paragraph */}
          <p className="text-lg md:text-xl text-white/80 mb-12 leading-relaxed font-sans">
            Trainly is a proprietary AI platform capable of completing complex
            knowledge graph analysis with near-perfect accuracy.
          </p>

          {/* Key Points */}
          <div className="space-y-0">
            {/* Point 1 */}
            <div className="flex items-start gap-4 py-4 border-b border-white/10">
              <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-base text-white/90 font-sans">
                99% accuracy standard on core knowledge graph queries
              </p>
            </div>

            {/* Point 2 */}
            <div className="flex items-start gap-4 py-4 border-b border-white/10">
              <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-base text-white/90 font-sans">
                Capabilities tested and optimized across millions of documents
                and queries
              </p>
            </div>

            {/* Point 3 */}
            <div className="flex items-start gap-4 py-4">
              <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-base text-white/90 font-sans">
                Learn more about our model's technical capabilities{" "}
                <a
                  href="#"
                  className="underline hover:text-amber-400 transition-colors"
                >
                  here
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
