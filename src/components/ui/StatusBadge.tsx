import { Badge } from "./Badge";

type Status =
  | "queued"
  | "scraping"
  | "report_sent"
  | "building"
  | "tools_deployed"
  | "error"
  | string;

const map: Record<
  string,
  { label: string; color: "green" | "amber" | "red" | "blue" | "grey"; pulse?: boolean }
> = {
  queued: { label: "Queued", color: "grey" },
  scraping: { label: "Analysing", color: "amber", pulse: true },
  report_sent: { label: "Report sent", color: "blue" },
  building: { label: "Building", color: "amber", pulse: true },
  tools_deployed: { label: "Live", color: "green" },
  error: { label: "Error", color: "red" },
};

export function StatusBadge({ status }: { status: Status }) {
  const cfg = map[status] ?? { label: status, color: "grey" };
  return (
    <Badge color={cfg.color} dot pulse={cfg.pulse}>
      {cfg.label}
    </Badge>
  );
}
