import { Marquee } from "@/components/ui/marquee";
import {
  Upload,
  Code,
  Settings,
  Zap,
  Network,
  Shield,
  type LucideIcon,
} from "lucide-react";

const reviews = [
  {
    name: "Auto-ingest your knowledge",
    username: "Upload & ingest",
    body: "Drop in PDFs, docs, or code. Trainly handles chunking, storage, and updates automatically.",
    icon: Upload,
    // isNew: true,
  },
  {
    name: "Enterprise-ready SDKs",
    username: "Python & React",
    body: "Production-ready SDKs with OAuth, streaming, and full TypeScript support. Ship in minutes.",
    icon: Code,
  },
  {
    name: "Custom knowledge scopes",
    username: "Precision control",
    body: "Define exactly what context your AI can access. Per-conversation, per-user, or custom rules.",
    icon: Settings,
    isNew: true,
  },
  {
    name: "Real-time streaming",
    username: "Built-in",
    body: "Native streaming responses with React hooks. No setup, just import and use.",
    icon: Zap,
  },
  {
    name: "Knowledge graph powered",
    username: "Neo4j integration",
    body: "Advanced semantic search and relationship mapping. Your data becomes intelligent.",
    icon: Network,
    isNew: true,
  },
  {
    name: "Secure by default",
    username: "API key management",
    body: "Built-in authentication, rate limiting, and usage analytics. Enterprise security included.",
    icon: Shield,
  },
];

const ReviewCard = ({
  icon: Icon,
  name,
  username,
  body,
  isNew,
}: {
  icon: LucideIcon;
  name: string;
  username: string;
  body: string;
  isNew?: boolean;
}) => {
  return (
    <div className="flex flex-col gap-2 px-6">
      <div className="flex flex-row items-center gap-2">
        <Icon className="h-6 w-6 text-primary" />
        <h3 className="text-base font-semibold text-white">{name}</h3>
        {isNew && (
          <span className="rounded-full bg-green-500 px-2 py-0.5 text-xs font-medium text-white">
            New
          </span>
        )}
      </div>
      <p className="text-sm">{body}</p>
    </div>
  );
};

export function MarqueeDemo() {
  return (
    <div className="relative flex w-full flex-col items-center justify-center overflow-hidden py-12">
      <Marquee pauseOnHover className="[--duration:30s]">
        {reviews.map((review) => (
          <ReviewCard key={review.username} {...review} />
        ))}
      </Marquee>
      <div className="from-black pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r"></div>
      <div className="from-black pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l"></div>
    </div>
  );
}
export default MarqueeDemo;
