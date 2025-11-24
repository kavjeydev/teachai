"use client";

import {
  ArrowRight,
  Code,
  Database,
  FileText,
  Network,
  Sparkles,
} from "lucide-react";
import { StripedPattern } from "@/components/magicui/striped-pattern";

const useCaseCards = [
  {
    icon: Code,
    title: "AI Support Agent Trained on All Your Product Knowledge",
    link: "Learn How",
    days: 5,
  },
  {
    icon: Database,
    title: "Automate Insights from Logs, Dashboards, and Operational Data",
    link: "Learn How",
    days: 3,
  },
  {
    icon: FileText,
    title: "AI Tutor Trained on Your Video Playlists",
    link: "Learn How",
    days: 1,
  },
  {
    icon: Network,
    title: "AI Day Planner That Learns From Your Habits and Past Behavior",
    link: "Learn How",
    days: 7,
  },
];

export default function UseCasesSection() {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .glow-overlay {
            opacity: 0;
            transition: opacity 300ms ease-in-out !important;
          }
          .use-case-card:hover .glow-overlay {
            opacity: 1 !important;
          }
          .use-case-card:hover h3 {
            color: rgb(251, 191, 36) !important;
          }
          .use-case-card:hover .icon-bg {
            background-color: rgba(255, 255, 255, 0.15) !important;
          }
          .use-case-card:hover .link-text {
            color: rgba(255, 255, 255, 0.8) !important;
          }
        `,
        }}
      />
      <section className="py-32 bg-black text-white relative">
        {/* Top glow effect */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-amber-400/20 via-amber-400/5 to-transparent pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          {/* Header */}
          <div className="mb-16 max-w-3xl">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-sans font-semibold mb-6 leading-tighter tracking-tighter">
              Use Cases That Deliver
              <br />
              Real Results
            </h2>

            <p className="text-md md:text-lg text-white/60 mb-6 leading-relaxed max-w-sm">
              Made for teams that want a simple & effective path to market.
            </p>

            <span className="inline-flex items-center gap-2 text-white/40 cursor-not-allowed text-lg font-medium">
              Coming soon
              <ArrowRight className="w-5 h-5 opacity-50" />
            </span>
          </div>

          {/* 2x2 Grid of Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {useCaseCards.map((card, index) => {
              const IconComponent = card.icon;
              return (
                <UseCaseCard
                  key={index}
                  card={card}
                  IconComponent={IconComponent}
                />
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}

function UseCaseCard({
  card,
  IconComponent,
}: {
  card: (typeof useCaseCards)[0];
  IconComponent: any;
}) {
  return (
    <div className="use-case-card relative flex flex-col items-start overflow-hidden rounded-xl border border-white/10 hover:border-white/20 transition-all cursor-pointer bg-zinc-900/50 p-8">
      {/* Striped pattern background - top right */}
      <div className="absolute top-0 right-0 w-[60%] h-[60%] overflow-hidden">
        <StripedPattern className="[mask-image:radial-gradient(ellipse_at_top_right,white_40%,transparent_70%)]" />
      </div>

      {/* Glow effect on hover - separate element as direct child of group */}
      <div
        className="glow-overlay absolute top-0 right-0 w-[60%] h-[60%] pointer-events-none [mask-image:radial-gradient(ellipse_at_top_right,white_40%,transparent_70%)]"
        style={{
          background:
            "radial-gradient(ellipse at top right, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 40%, transparent 70%)",
          opacity: 0,
        }}
      />

      {/* Large icon outline - top right */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 opacity-5 group-hover:opacity-10 transition-opacity">
        <IconComponent
          className="absolute top-4 right-4 w-32 h-32 md:w-40 md:h-40 text-white stroke-1 z-10"
          strokeWidth={1}
          style={{
            filter: "drop-shadow(0 0 1px rgba(255,255,255,0.3))",
          }}
        />
      </div>

      {/* Days Badge */}
      <div className="absolute top-6 right-6 z-20">
        <div className="bg-zinc-700 text-white px-3 py-1.5 rounded-lg shadow-lg border border-white/10 transform rotate-3 hover:rotate-0 transition-transform duration-300">
          <div className="text-xs font-semibold whitespace-nowrap">
            {card.days} {card.days === 1 ? "day" : "days"} to prod
          </div>
        </div>
      </div>

      <div className="relative z-10 flex flex-col h-full">
        {/* Icon */}
        <div className="mb-6">
          <div className="icon-bg w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center transition-colors">
            <IconComponent className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Spacer to push title to bottom */}
        <div className="flex-1"></div>

        {/* Title */}
        <h3 className="text-xl md:text-2xl font-normal max-w-sm text-white leading-tight transition-colors">
          {card.title}
        </h3>

        {/* Link */}
        <div className="mt-4 border-white/10">
          <span className="link-text text-sm text-white/60 transition-colors">
            {card.link}
          </span>
        </div>
      </div>
    </div>
  );
}
