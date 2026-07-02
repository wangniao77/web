import MetricCard from './MetricCard';
import { SimpleHBarChart } from './charts/CockpitCharts';
import { dashboardData } from '../data/mockData';
import { openTeachingCourseDetail } from './TeachingCourseDetailPage';

export default function TeachingPanel() {
  const { teaching } = dashboardData;

  return (
    <div className="teaching-grid">
      <div className="kpi-row kpi-row--auto">
        {teaching.kpis.map((kpi) => (
          <MetricCard key={kpi.label} {...kpi} size="sm" layout="balance" />
        ))}
      </div>
      <div className="teaching-chart-full">
        <div className="chart-frame chart-frame--teaching">
          <div className="chart-frame__head">
            <span className="chart-frame__title">课程建设</span>
            <button type="button" className="chart-frame__link" onClick={openTeachingCourseDetail}>
              查看详情 ›
            </button>
          </div>
          <div className="chart-frame__body chart-frame__body--tall">
            <SimpleHBarChart data={teaching.courseConstruction} unit="门" />
          </div>
        </div>
      </div>
    </div>
  );
}
