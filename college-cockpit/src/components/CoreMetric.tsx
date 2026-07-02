import DashIcon, { type IconKind } from './DashIcon';

interface CoreMetricProps {
  label: string;
  value: string;
  unit?: string;
  trend?: string;
  iconKind: IconKind;
  className?: string;
  variant?: 'card' | 'hero';
  side?: 'left' | 'right';
}

export default function CoreMetric({
  label,
  value,
  unit,
  trend,
  iconKind,
  className = '',
  variant = 'card',
  side = 'left'
}: CoreMetricProps) {
  const rootClass = variant === 'hero' ? 'core-orbit-metric' : 'core-metric-card';

  if (variant === 'hero') {
    return (
      <div className={`${rootClass} ${rootClass}--${side} ${className}`.trim()}>
        <div className={`${rootClass}__icon`}>
          <DashIcon kind={iconKind} size={20} />
        </div>
        <div className={`${rootClass}__body`}>
          <span className={`${rootClass}__label`}>{label}</span>
          <strong className={`${rootClass}__value`}>
            {value}
            {unit && <small>{unit}</small>}
          </strong>
          {trend && <em className={`${rootClass}__trend`}>{trend}</em>}
        </div>
      </div>
    );
  }

  return (
    <div className={`${rootClass} ${className}`.trim()}>
      <div className={`${rootClass}__icon`}>
        <DashIcon kind={iconKind} size={24} />
      </div>
      <span className={`${rootClass}__label`}>{label}</span>
      <strong className={`${rootClass}__value`}>
        {value}
        {unit && <small>{unit}</small>}
      </strong>
      {trend && <em className={`${rootClass}__trend`}>{trend}</em>}
    </div>
  );
}
