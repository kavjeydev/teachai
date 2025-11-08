export default function DataHandling() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-zinc-50 to-zinc-100 dark:from-zinc-950 dark:via-black dark:to-zinc-950 text-zinc-900 dark:text-white py-20">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-5xl md:text-6xl font-sans font-normal text-zinc-900 dark:text-white mb-8">
          Data Handling
        </h1>

        <div className="prose prose-zinc dark:prose-invert max-w-none">
          <p>
            Trainly parses uploaded files in memory and stores only derived text
            chunks and embeddings.
          </p>
          <p>Data is partitioned per app/user.</p>
          <p>You can delete your data anytime.</p>
          <p>Please don&apos;t upload confidential or regulated data.</p>
        </div>
      </div>
    </div>
  );
}
