import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, MessageSquare } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      {/* Sidebar Loading */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        <div className="p-4 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Loading */}
      <div className="flex-1 flex flex-col">
        {/* Header Loading */}
        <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <div className="flex space-x-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
        </div>

        {/* Chat Messages Loading */}
        <div className="flex-1 overflow-hidden bg-white dark:bg-gray-900">
          <div className="h-full p-6 space-y-6">
            {/* Loading Messages */}
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-4">
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="flex items-end space-x-2 max-w-[70%]">
                    <Skeleton className="h-16 w-full rounded-2xl bg-blue-100" />
                    <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
                  </div>
                </div>

                {/* AI Response */}
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center space-x-3 text-gray-500 dark:text-gray-400">
                <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                <span className="text-sm font-medium">Loading your chat...</span>
              </div>
            </div>
          </div>
        </div>

        {/* Input Area Loading */}
        <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <Skeleton className="h-24 w-full rounded-xl" />
              <div className="absolute bottom-3 right-3 flex space-x-2">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-8 w-16 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
