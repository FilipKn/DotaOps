import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string;
  trend: string;
  icon: LucideIcon;
  tone?: "red" | "teal" | "amber" | "green";
}

export function MetricCard({
  label,
  value,
  trend,
  icon: Icon,
  tone = "red"
}: MetricCardProps) {
  return (
    <article className={`metric-card metric-${tone}`}>
      <div className="metric-icon" aria-hidden="true">
        <Icon size={20} />
      </div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{trend}</span>
      </div>
    </article>
  );
}
