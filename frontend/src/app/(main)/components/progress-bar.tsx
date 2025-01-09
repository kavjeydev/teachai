import { Progress } from "@nextui-org/progress";
export default function ProgressBar() {
  return (
    <Progress
      classNames={{
        base: "max-w-md",
        track: "drop-shadow-md border border-default",
        indicator: "bg-gradient-to-r from-pink-500 to-yellow-500",
        label: "tracking-wider font-medium text-default-600",
        value: "text-foreground/60",
      }}
      aria-label="Loading..."
      className="max-w-md text-sm"
      label="Uploading files..."
      size="sm"
      value={60}
    />
  );
}
