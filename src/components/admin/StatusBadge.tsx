import { Badge } from "@/components/ui/badge";
import { titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";

const toneMap: Record<string, string> = {
  active: "border-positive/30 bg-positive/10 text-positive",
  available: "border-positive/30 bg-positive/10 text-positive",
  published: "border-positive/30 bg-positive/10 text-positive",
  paid: "border-positive/30 bg-positive/10 text-positive",
  converted: "border-positive/30 bg-positive/10 text-positive",
  accepted: "border-positive/30 bg-positive/10 text-positive",
  new: "border-primary/40 bg-gold-soft text-primary",
  sent: "border-primary/40 bg-gold-soft text-primary",
  high: "border-primary/40 bg-gold-soft text-primary",
  urgent: "border-destructive/40 bg-destructive/10 text-destructive",
  overdue: "border-destructive/40 bg-destructive/10 text-destructive",
  inactive: "border-border bg-muted text-muted-foreground",
  draft: "border-border bg-muted text-muted-foreground",
  expired: "border-border bg-muted text-muted-foreground",
  revoked: "border-border bg-muted text-muted-foreground",
  pending: "border-border bg-muted text-muted-foreground",
  reserved: "border-chart-4/40 bg-chart-4/10 text-chart-4",
  due: "border-chart-4/40 bg-chart-4/10 text-chart-4",
};

export function StatusBadge({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const key = value.toLowerCase();
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-sm font-normal capitalize",
        toneMap[key] ?? "border-border bg-muted/50 text-muted-foreground",
        className,
      )}
    >
      {titleCase(value)}
    </Badge>
  );
}
