import type { ReactNode } from 'react';
import DashIcon, { type IconKind } from './DashIcon';

interface PanelProps {
  number: number;
  title: string;
  iconKind?: IconKind;
  className?: string;
  children: ReactNode;
}

export default function Panel({ number, title, iconKind = 'academic', className = '', children }: PanelProps) {
  return (
    <section className={`panel panel--section ${className}`}>
      <div className="panel__title">
        <span className="panel__number">{number}</span>
        <span className="panel__icon">
          <DashIcon kind={iconKind} size={15} />
        </span>
        <span className="panel__label">{title}</span>
      </div>
      <div className="panel__body">{children}</div>
    </section>
  );
}
