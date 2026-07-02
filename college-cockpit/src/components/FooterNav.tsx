import { dashboardData } from '../data/mockData';
import DashIcon from './DashIcon';

export default function FooterNav() {
  return (
    <nav className="cockpit-nav" aria-label="驾驶舱导航">
      {dashboardData.footerNav.map((item) => (
        <button
          key={item.label}
          type="button"
          className={`cockpit-nav__item${'active' in item && item.active ? ' cockpit-nav__item--active' : ''}`}
        >
          <span className="cockpit-nav__icon">
            <DashIcon kind={item.iconKind} size={18} />
          </span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
