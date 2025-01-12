import { Progress } from "@nextui-org/progress";

interface ProgressBarProps {
  value: number;
  label: string;
}

export default function ProgressBar({ value, label }: ProgressBarProps) {
  return (
    <div>
      <Progress
        classNames={{
          base: "max-w-md",
          track: "drop-shadow-md border border-default",
          indicator: "bg-gradient-to-r from-blue-200 to-buttoncolor",
          label: "tracking-wider font-medium text-default-600",
          value: "text-foreground/60",
        }}
        aria-label={`${label} ${value}%`}
        className="max-w-md text-sm"
        label={`${label} ${value}%`}
        size="sm"
        value={value}
      />
    </div>
  );
}
