import DashIcon from './DashIcon';
import { dashboardData, type TaskProgressItem, type TaskStatus } from '../data/mockData';
import { openKeyTasksDetail } from './KeyTasksDetailPage';

const STATUS_LABEL: Record<TaskStatus, string> = {
  completed: '已完成',
  'in-progress': '推进中',
  attention: '需关注'
};

type TasksData = typeof dashboardData.tasks;

export default function TaskProgressPanel({ tasks }: { tasks: TasksData }) {
  const { summary } = tasks;

  return (
    <div className="task-progress-panel">
      <div className="task-progress-panel__legend" aria-label="任务状态图例">
        <span className="task-progress-panel__legend-item task-progress-panel__legend-item--completed">
          <i /> 已完成
        </span>
        <span className="task-progress-panel__legend-item task-progress-panel__legend-item--progress">
          <i /> 推进中
        </span>
        <span className="task-progress-panel__legend-item task-progress-panel__legend-item--attention">
          <i /> 需关注
        </span>
      </div>

      <ul className="task-progress-panel__list">
        {tasks.items.map((item) => (
          <TaskRow key={item.id} item={item} />
        ))}
      </ul>

      <div className="task-progress-panel__summary">
        <div className="task-progress-panel__summary-item">
          <span>重点任务总数</span>
          <strong>{summary.total}<small>项</small></strong>
        </div>
        <div className="task-progress-panel__summary-item task-progress-panel__summary-item--completed">
          <DashIcon kind="complete" size={16} />
          <div>
            <span>已完成</span>
            <strong>{summary.completed.count}<small>项</small> {summary.completed.percent}%</strong>
          </div>
        </div>
        <div className="task-progress-panel__summary-item task-progress-panel__summary-item--progress">
          <DashIcon kind="follow" size={16} />
          <div>
            <span>推进中</span>
            <strong>{summary.inProgress.count}<small>项</small> {summary.inProgress.percent}%</strong>
          </div>
        </div>
        <div className="task-progress-panel__summary-item task-progress-panel__summary-item--attention">
          <DashIcon kind="riskHigh" size={16} />
          <div>
            <span>需关注</span>
            <strong>{summary.attention.count}<small>项</small> {summary.attention.percent}%</strong>
          </div>
        </div>
      </div>

      <button type="button" className="task-progress-panel__more" onClick={openKeyTasksDetail}>
        查看详情 →
      </button>
    </div>
  );
}

function TaskRow({ item }: { item: TaskProgressItem }) {
  return (
    <li className={`task-progress-panel__row task-progress-panel__row--${item.status}`}>
      <span className="task-progress-panel__icon">
        <DashIcon kind={item.iconKind} size={16} />
      </span>
      <span className="task-progress-panel__name">{item.name}</span>
      <div className="task-progress-panel__bar">
        <i style={{ width: `${item.percent}%` }} />
      </div>
      <strong className="task-progress-panel__percent">{item.percent}%</strong>
      <span className={`task-progress-panel__tag task-progress-panel__tag--${item.status}`}>
        {STATUS_LABEL[item.status]}
      </span>
    </li>
  );
}
