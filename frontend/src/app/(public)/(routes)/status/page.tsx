"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle2, XCircle, AlertCircle, Clock, Server, Database, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import Footer from "@/app/components/footer";

// Dynamic import for Navbar (uses NextUI)
const Navbar = dynamic(() => import("@/app/components/navbar"), {
  ssr: false,
  loading: () => <div className="h-16" />,
});

interface HealthStatus {
  status: "healthy" | "unhealthy";
  timestamp: number;
  version: string;
  services: {
    neo4j: "connected" | "disconnected";
    openai: "configured" | "not_configured";
  };
  error?: string;
}

export default function StatusPage() {
  const [healthData, setHealthData] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchHealthStatus = async () => {
    try {
      setIsLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000";
      const url = `${baseUrl}/v1/health`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // Add cache control to prevent stale data
        cache: "no-store",
      });

      if (!response.ok) {
        // If we get a 503, the response body might have error details
        const errorData = await response.json().catch(() => ({}));
        setHealthData({
          status: "unhealthy",
          timestamp: Date.now() / 1000,
          version: "unknown",
          services: {
            neo4j: "disconnected",
            openai: "not_configured",
          },
          error: errorData.error || `HTTP ${response.status}`,
        });
        return;
      }

      const data = await response.json();
      setHealthData(data);
      setLastUpdated(new Date());
    } catch (error: any) {
      console.error("Failed to fetch health status:", error);
      setHealthData({
        status: "unhealthy",
        timestamp: Date.now() / 1000,
        version: "unknown",
        services: {
          neo4j: "disconnected",
          openai: "not_configured",
        },
        error: error.message || "Failed to connect to API",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthStatus();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchHealthStatus();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    if (status === "healthy" || status === "connected" || status === "configured") {
      return (
        <Badge className="bg-green-500 hover:bg-green-600 text-white">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          {status === "healthy" ? "Operational" : status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    }
    return (
      <Badge className="bg-red-500 hover:bg-red-600 text-white">
        <XCircle className="w-3 h-3 mr-1" />
        {status === "unhealthy" ? "Degraded" : status === "disconnected" ? "Disconnected" : "Not Configured"}
      </Badge>
    );
  };

  const getServiceIcon = (serviceName: string) => {
    switch (serviceName) {
      case "neo4j":
        return <Database className="w-5 h-5" />;
      case "openai":
        return <Brain className="w-5 h-5" />;
      default:
        return <Server className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950">
      <Navbar />
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            API Status
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Real-time status of Trainly AI API services
          </p>
        </div>

        {/* Main Status Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  Overall Status
                </CardTitle>
                <CardDescription className="mt-1">
                  {healthData ? (
                    <>
                      Last updated: {lastUpdated?.toLocaleTimeString() || formatTimestamp(healthData.timestamp)}
                    </>
                  ) : (
                    "Checking status..."
                  )}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {healthData && getStatusBadge(healthData.status)}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchHealthStatus}
                  disabled={isLoading}
                  className="gap-2"
                >
                  <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading && !healthData ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-zinc-400" />
                <span className="ml-2 text-zinc-600 dark:text-zinc-400">Loading status...</span>
              </div>
            ) : healthData ? (
              <div className="space-y-4">
                {/* Error Message */}
                {healthData.error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                      <div>
                        <p className="font-semibold text-red-900 dark:text-red-100">Error</p>
                        <p className="text-sm text-red-700 dark:text-red-300 mt-1">{healthData.error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Version Info */}
                <div className="flex items-center justify-between py-2 border-b border-zinc-200 dark:border-zinc-800">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">API Version</span>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">{healthData.version}</span>
                </div>

                {/* Timestamp */}
                <div className="flex items-center justify-between py-2 border-b border-zinc-200 dark:border-zinc-800">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Server Time
                  </span>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    {formatTimestamp(healthData.timestamp)}
                  </span>
                </div>

                {/* Services Status */}
                <div className="pt-2">
                  <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
                    Service Status
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(healthData.services).map(([serviceName, serviceStatus]) => (
                      <div
                        key={serviceName}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-lg border",
                          serviceStatus === "connected" || serviceStatus === "configured"
                            ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                            : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "p-2 rounded-lg",
                              serviceStatus === "connected" || serviceStatus === "configured"
                                ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"
                                : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
                            )}
                          >
                            {getServiceIcon(serviceName)}
                          </div>
                          <div>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100 capitalize">
                              {serviceName === "neo4j" ? "Neo4j Database" : "OpenAI"}
                            </p>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                              {serviceName === "neo4j" ? "Knowledge graph storage" : "AI model provider"}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(serviceStatus)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-600 dark:text-zinc-400">
                Unable to fetch status
              </div>
            )}
          </CardContent>
        </Card>

        {/* Auto-refresh Toggle */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">Auto-refresh</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Automatically refresh status every 30 seconds
                </p>
              </div>
              <Button
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                {autoRefresh ? "Enabled" : "Disabled"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
          <p>
            Status endpoint: <code className="bg-zinc-200 dark:bg-zinc-800 px-2 py-1 rounded">
              {process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000"}/v1/health
            </code>
          </p>
        </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

