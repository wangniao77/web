import DashIcon from './DashIcon';
import { HighPotentialTrendChart } from './charts/HighPotentialCharts';
import { dashboardData, highPotentialModules } from '../data/mockData';
import { openHighPotentialDetail } from './HighPotentialDetailPage';

export default function HighPotentialPanel() {
  const { highPotential: hp } = dashboardData;

  return (
    <div className="high-potential high-potential--overview">
      <div className="hp-overview-head">
        <div className="hp-overview-head__stats">
          <div>
            <span>高潜学生总数</span>
            <strong>{hp.summary.total}<small>人</small></strong>
          </div>
          <div>
            <span>本学期变化</span>
            <strong className="up">{hp.summary.change}</strong>
          </div>
          <div>
            <span>高潜覆盖率</span>
            <strong>{hp.summary.coverage}</strong>
          </div>
        </div>
        <div className="hp-overview-head__chart">
          <div className="chart-frame__title">高潜人数增长趋势</div>
          <div className="hp-overview-head__chart-body">
            <HighPotentialTrendChart months={hp.summary.trend.months} counts={hp.summary.trend.counts} />
          </div>
        </div>
      </div>

      <p className="hp-overview-tip">点击下列维度卡片，进入详情页查看完整数据</p>

      <div className="hp-overview-grid">
        {highPotentialModules.map((module) => (
          <button
            key={module.id}
            type="button"
            className="hp-overview-card"
            onClick={() => openHighPotentialDetail(module.id)}
          >
            <span className="hp-overview-card__icon">
              <DashIcon kind={module.iconKind} size={20} />
            </span>
            <span className="hp-overview-card__title">{module.title}</span>
            <span className="hp-overview-card__metric">
              {module.cardMetric.value}
              {'unit' in module.cardMetric && module.cardMetric.unit ? (
                <small>{module.cardMetric.unit}</small>
              ) : null}
            </span>
            <span className="hp-overview-card__label">{module.cardMetric.label}</span>
            <span className="hp-overview-card__hint">查看详情 →</span>
          </button>
        ))}
      </div>
    </div>
  );
}
