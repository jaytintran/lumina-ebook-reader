import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon,
  value,
  label,
  colorClass,
}: {
  icon: LucideIcon;
  value: number;
  label: string;
  colorClass: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-md",
          colorClass,
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}
