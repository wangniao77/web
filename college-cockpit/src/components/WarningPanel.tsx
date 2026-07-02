import DashIcon from './DashIcon';
import { CreditCompletionChart, WarningMonitorChart } from './charts/CockpitCharts';
import { dashboardData } from '../data/mockData';
import { openWarningDetail } from './WarningDetailPage';

export default function WarningPanel() {
  const { warning } = dashboardData;

  return (
    <div className="warning-panel">
      <div className="warning-panel__left">
        <div className="warning-panel__section-title">预警指标（近三个月）</div>
        <ul className="warning-panel__list">
          {warning.indicators.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={`warning-panel__item warning-panel__item--${item.tone}`}
                onClick={() => openWarningDetail(item.id)}
              >
                <div className="warning-panel__badge">
                  <DashIcon kind={item.iconKind} size={24} />
                </div>
                <div className="warning-panel__info">
                  <span>{item.label}</span>
                  <strong>
                    {item.value}
                    {item.unit ? <small>{item.unit}</small> : null}
                  </strong>
                </div>
                <div className="warning-panel__side">
                  <em className={`warning-panel__delta warning-panel__delta--${item.deltaTrend}`}>
                    {item.delta}
                  </em>
                  <span className="warning-panel__link">查看名单 ›</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="warning-panel__charts">
        <div className="warning-panel__chart warning-panel__chart--trend">
          <div className="warning-panel__chart-title">预警趋势（近六个月）</div>
          <div className="warning-panel__chart-body">
            <WarningMonitorChart
              months={warning.trend.months}
              mental={warning.trend.mental}
              employment={warning.trend.employment}
            />
          </div>
        </div>
        <div className="warning-panel__chart warning-panel__chart--credit">
          <div className="warning-panel__chart-title">第二课堂各类学分完成情况（大三 / 大四）</div>
          <div className="warning-panel__chart-body">
            <CreditCompletionChart
              categories={warning.creditCompletion.categories}
              junior={warning.creditCompletion.junior}
              senior={warning.creditCompletion.senior}
              threshold={warning.creditCompletion.threshold}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
