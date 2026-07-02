import { useEffect, useState } from 'react';
import { dashboardData } from '../data/mockData';
import collegeLogo from '../assets/college-logo.png';
import DashIcon from './DashIcon';

function formatNow() {
  const now = new Date();
  const date = now.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
  const time = now.toLocaleTimeString('zh-CN', { hour12: false });
  return { date, time };
}

export default function Header() {
  const { university, school, motto, title, weather } = dashboardData.header;
  const [clock, setClock] = useState(formatNow);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(formatNow()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <header className="cockpit-header">
      <div className="cockpit-header__brand">
        <div className="school-emblem">
          <img src={collegeLogo} alt="大数据与人工智能学院院徽" />
        </div>
        <div className="school-name">
          <span className="school-name__title">{university}</span>
          <span className="school-name__school">{school}</span>
          <span className="school-name__motto">{motto}</span>
        </div>
      </div>

      <div className="cockpit-header__title">
        <div className="cockpit-header__title-wings" aria-hidden="true" />
        <h1>{title}</h1>
        {'navTabs' in dashboardData.header && (
          <nav className="cockpit-header__tabs">
            {dashboardData.header.navTabs.map((tab, index) => (
              <span key={tab}>
                {tab}
                {index < dashboardData.header.navTabs.length - 1 && <b>|</b>}
              </span>
            ))}
          </nav>
        )}
      </div>

      <div className="cockpit-header__meta">
        <div className="meta-card">
          <DashIcon kind="calendar" size={16} />
          <span>{clock.date}</span>
        </div>
        <div className="meta-card">
          <DashIcon kind="clock" size={16} />
          <span>{clock.time}</span>
        </div>
        <div className="meta-card">
          <DashIcon kind="status" size={16} />
          <span>{weather.temp} {weather.desc}</span>
        </div>
      </div>
    </header>
  );
}
