import DashIcon from './DashIcon';
import { dashboardData } from '../data/mockData';

interface TeachingCourseDetailPageProps {
  onBack: () => void;
}

export default function TeachingCourseDetailPage({ onBack }: TeachingCourseDetailPageProps) {
  const { teaching } = dashboardData;

  return (
    <div className="teach-detail-page dashboard cockpit">
      <div className="dashboard-scanline" aria-hidden="true" />
      <header className="teach-detail-page__header">
        <button type="button" className="teach-detail-page__back" onClick={onBack}>
          ← 返回驾驶舱
        </button>
        <div className="teach-detail-page__title">
          <DashIcon kind="academic" size={24} />
          <div>
            <h1>{teaching.title}</h1>
            <span>课程建设 · 分类明细</span>
          </div>
        </div>
        <div className="teach-detail-page__meta">
          <span>开课门数 <strong>{teaching.kpis[0].value}</strong></span>
          <span>优质课程 <strong>{teaching.kpis[1].value}</strong></span>
        </div>
      </header>

      <main className="teach-detail-page__body">
        {teaching.courseDetails.map((group) => {
          const summary = teaching.courseConstruction.find((item) => item.name === group.category);

          return (
            <section key={group.category} className="teach-detail-section">
              <header className="teach-detail-section__head">
                <h2>{group.category}</h2>
                <span>{summary?.value ?? group.courses.length} 门</span>
              </header>
              <div className="teach-detail-table-wrap">
                <table className="teach-detail-table">
                  <thead>
                    <tr>
                      <th>课程/基地名称</th>
                      <th>课程代码</th>
                      <th>负责人</th>
                      <th>所属专业</th>
                      <th>认定时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.courses.map((course) => (
                      <tr key={course.code}>
                        <td>{course.name}</td>
                        <td>{course.code}</td>
                        <td>{course.teacher}</td>
                        <td>{course.major}</td>
                        <td>{course.approvedAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}

export function parseTeachingCourseRoute(hash: string): boolean {
  return hash === '#/teaching/courses';
}

export function openTeachingCourseDetail() {
  window.location.hash = '#/teaching/courses';
}

export function closeTeachingCourseDetail() {
  window.location.hash = '';
}
