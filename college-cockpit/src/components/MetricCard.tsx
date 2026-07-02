import DashIcon from './DashIcon';
import type { MetricItem } from '../data/mockData';

interface MetricCardProps extends MetricItem {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  layout?: 'default' | 'balance';
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
  size = 'md',
  layout = 'default'
}: MetricCardProps) {
  const isBalance = layout === 'balance';

  return (
    <div className={`metric-card metric-card--${tone} metric-card--${size}${isBalance ? ' metric-card--balance' : ''} ${className}`}>
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
