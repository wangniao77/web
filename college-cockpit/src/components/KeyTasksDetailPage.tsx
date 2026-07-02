import DashIcon from './DashIcon';
import { dashboardData, type TaskProgressItem, type TaskStatus } from '../data/mockData';

const STATUS_LABEL: Record<TaskStatus, string> = {
  completed: '已完成',
  'in-progress': '推进中',
  attention: '需关注'
};

function TaskDetailCard({ item }: { item: TaskProgressItem }) {
  const doneCount = item.milestones.filter((m) => m.done).length;

  return (
    <article className={`kt-detail-card kt-detail-card--${item.status}`}>
      <header className="kt-detail-card__head">
        <span className="kt-detail-card__icon">
          <DashIcon kind={item.iconKind} size={22} />
        </span>
        <div className="kt-detail-card__title">
          <h2>{item.name}</h2>
          <p>{item.description}</p>
        </div>
        <span className={`kt-detail-card__tag kt-detail-card__tag--${item.status}`}>
          {STATUS_LABEL[item.status]}
        </span>
      </header>

      <div className="kt-detail-card__meta">
        <div>
          <span>牵头部门</span>
          <strong>{item.leadDept}</strong>
        </div>
        <div>
          <span>计划完成</span>
          <strong>{item.deadline}</strong>
        </div>
        <div>
          <span>完成进度</span>
          <strong>{item.percent}%</strong>
        </div>
        <div>
          <span>里程碑</span>
          <strong>{doneCount}/{item.milestones.length}</strong>
        </div>
      </div>

      <div className="kt-detail-card__bar">
        <i style={{ width: `${item.percent}%` }} />
      </div>

      <ul className="kt-detail-card__milestones">
        {item.milestones.map((milestone) => (
          <li key={milestone.label} className={milestone.done ? 'done' : ''}>
            <span>{milestone.done ? '✓' : '○'}</span>
            {milestone.label}
          </li>
        ))}
      </ul>
    </article>
  );
}

interface KeyTasksDetailPageProps {
  onBack: () => void;
}

export default function KeyTasksDetailPage({ onBack }: KeyTasksDetailPageProps) {
  const { tasks } = dashboardData;

  return (
    <div className="kt-detail-page dashboard cockpit">
      <div className="dashboard-scanline" aria-hidden="true" />
      <header className="kt-detail-page__header">
        <button type="button" className="kt-detail-page__back" onClick={onBack}>
          ← 返回驾驶舱
        </button>
        <div className="kt-detail-page__title">
          <DashIcon kind="task" size={24} />
          <div>
            <h1>{tasks.title}</h1>
            <span>重点任务全景 · 详细进展</span>
          </div>
        </div>
        <div className="kt-detail-page__meta">
          <span>任务总数 <strong>{tasks.summary.total}</strong> 项</span>
          <span>推进中 <strong className="up">{tasks.summary.inProgress.count}</strong> 项</span>
          <span>需关注 <strong className="warn">{tasks.summary.attention.count}</strong> 项</span>
        </div>
      </header>
      <main className="kt-detail-page__body">
        {tasks.items.map((item) => (
          <TaskDetailCard key={item.id} item={item} />
        ))}
      </main>
    </div>
  );
}

export function parseKeyTasksRoute(hash: string): boolean {
  return hash === '#/key-tasks' || hash === '#/tasks';
}

export function openKeyTasksDetail() {
  window.location.hash = '#/key-tasks';
}

export function closeKeyTasksDetail() {
  window.location.hash = '';
}
