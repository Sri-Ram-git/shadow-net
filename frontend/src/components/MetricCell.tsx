interface MetricCellProps {
  value: string | number;
  label: string;
  valueClass?: string;
}

export function MetricCell({ value, label, valueClass }: MetricCellProps) {
  return (
    <div className="metric-cell">
      <span className={`metric-value ${valueClass || ''}`}>{value}</span>
      <span className="metric-label">{label}</span>
    </div>
  );
}
