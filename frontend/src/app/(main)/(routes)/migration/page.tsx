"use client";

import { AppMigrationHelper } from "@/components/app-migration-helper";

export default function MigrationPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
          App Migration
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Link your existing app to a parent chat to enable settings inheritance
          and credit consumption.
        </p>
      </div>

      <AppMigrationHelper />
    </div>
  );
}
