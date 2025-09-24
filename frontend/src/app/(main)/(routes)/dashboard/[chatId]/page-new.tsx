import MinimalDashboard from "./minimal-dashboard";
import { Id } from "../../../../../../convex/_generated/dataModel";

interface ChatIdPageProps {
  params: Promise<{
    chatId: Id<"chats">;
  }>;
}

export default function DashboardPage({ params }: ChatIdPageProps) {
  return <MinimalDashboard params={params} />;
}
