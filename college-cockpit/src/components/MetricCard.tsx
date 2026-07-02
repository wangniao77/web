import DashIcon, { type IconKind } from './DashIcon';
import type { MetricItem } from '../data/mockData';

interface MetricCardProps extends MetricItem {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const iconSizes: Record<NonNullable<MetricCardProps['size']>, number> = {
  sm: 14,
  md: 16,
  lg: 20
};

export default function MetricCard({
  label,
  value,
  unit,
  iconKind,
  tone = 'cyan',
  className = '',
  size = 'md'
}: MetricCardProps) {
  return (
    <div className={`metric-card metric-card--${tone} metric-card--${size} ${className}`}>
      <span className="metric-card__icon">
        <DashIcon kind={iconKind} size={iconSizes[size]} />
      </span>
      <span className="metric-card__label">{label}</span>
      <span className="metric-card__value">
        {value}
        {unit && <small>{unit}</small>}
      </span>
    </div>
  );
}
