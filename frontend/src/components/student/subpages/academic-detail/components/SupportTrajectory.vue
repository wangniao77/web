<script setup lang="ts">
/**
 * 帮扶轨迹模块（针对预警学生）
 * 展示学业预警后的帮扶干预记录：约谈时间 / 帮扶老师 / 辅导内容 / 阶段性效果
 * 以横向时间轴形式呈现，由左至右按时间推进。
 */
interface SupportRecord {
  date: string
  teacher: string
  role: string
  content: string
  effect: string
  status: 'done' | 'doing'
}

// 演示数据：业务台账（谈心谈话 / 干预记录）接入后由 dashboard.academic.supportRecords 替换
const records: SupportRecord[] = [
  {
    date: '2025-03-12',
    teacher: '辅导员 · 李老师',
    role: '首次约谈',
    content: '学业预警首次约谈，核实高数挂科原因与当前学习状态。',
    effect: '建立帮扶档案，制定补考复习与周考勤计划。',
    status: 'done',
  },
  {
    date: '2025-03-26',
    teacher: '学业导师 · 王教授',
    role: '一对一辅导',
    content: '高等数学一对一辅导，系统梳理极限、微积分核心考点。',
    effect: '随堂测验成绩提升约 12 分。',
    status: 'done',
  },
  {
    date: '2025-04-20',
    teacher: '辅导员 · 李老师',
    role: '谈心谈话',
    content: '期中考试复盘，梳理时间管理方法，调整学习计划。',
    effect: 'GPA 环比 +0.18，学习状态明显回升。',
    status: 'done',
  },
  {
    date: '2025-05-18',
    teacher: '朋辈导师 · 张同学',
    role: '小组共学',
    content: '组织线性代数小组共学，针对薄弱章节专项训练。',
    effect: '补考通过，本学期无新增不及格课程。',
    status: 'done',
  },
]
</script>

<template>
  <div class="support-card">
    <header class="support-card__head">
      <span class="support-card__bar" aria-hidden="true" />
      <h3 class="support-card__title">帮扶轨迹</h3>
      <span class="support-card__sub">预警学生学业帮扶记录 · 按时间推进</span>
    </header>

    <div class="support-card__body">
      <ul class="timeline-h">
        <li
          v-for="(r, i) in records"
          :key="r.date"
          class="tl-item"
          :class="{ 'tl-item--doing': r.status === 'doing' }"
        >
          <div class="tl-axis">
            <span class="tl-connector" :class="{ 'tl-connector--start': i === 0 }" />
            <span class="tl-node" :class="{ 'is-doing': r.status === 'doing' }" />
          </div>
          <div class="tl-card">
            <div class="tl-top">
              <span class="tl-date">{{ r.date }}</span>
              <span class="tl-role">{{ r.role }}</span>
            </div>
            <div class="tl-teacher">
              <span class="tl-teacher-label">帮扶老师</span>
              <span class="tl-teacher-name">{{ r.teacher }}</span>
            </div>
            <div class="tl-row">
              <span class="tl-row-label">辅导内容</span>
              <p class="tl-text">{{ r.content }}</p>
            </div>
            <div class="tl-row">
              <span class="tl-row-label">阶段效果</span>
              <p class="tl-text tl-text--effect">{{ r.effect }}</p>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped lang="scss">
.support-card {
  position: relative;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(102, 217, 255, 0.16);
  border-radius: 8px;
  background:
    linear-gradient(145deg, rgba(0, 113, 206, 0.16), rgba(3, 12, 34, 0.78)),
    rgba(5, 18, 48, 0.54);
  box-shadow:
    0 12px 26px rgba(0, 0, 0, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    inset 0 0 22px rgba(0, 184, 255, 0.06);
  padding: 12px 16px 14px;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 12px;
    right: 12px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0, 242, 255, 0.62), transparent);
  }

  &__head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 14px;
    flex-shrink: 0;
  }

  &__bar {
    width: 3px;
    height: 14px;
    border-radius: 2px;
    background: linear-gradient(180deg, #00e5ff, #00b8ff);
    box-shadow: 0 0 6px rgba(0, 212, 255, 0.45);
    flex-shrink: 0;
  }

  &__title {
    margin: 0;
    font-size: 17px;
    font-weight: 700;
    color: #f4fbff;
    text-shadow: 0 0 10px rgba(0, 242, 255, 0.18);
  }

  &__sub {
    margin-left: auto;
    font-size: 12px;
    color: rgba(184, 236, 255, 0.6);
    white-space: nowrap;
  }

  &__body {
    flex: 1;
    min-width: 0;
    overflow-x: auto;
    padding-bottom: 4px;
  }
}

.timeline-h {
  display: flex;
  gap: 14px;
  min-width: min-content;
  list-style: none;
  margin: 0;
  padding: 0;
}

.tl-item {
  flex: 1 0 200px;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.tl-axis {
  position: relative;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tl-connector {
  position: absolute;
  top: 50%;
  left: -50%;
  right: 50%;
  height: 2px;
  transform: translateY(-50%);
  background: linear-gradient(90deg, rgba(0, 212, 255, 0.15), rgba(0, 212, 255, 0.55));

  &--start { display: none; }
}

.tl-node {
  position: relative;
  z-index: 1;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #66d9ff;
  box-shadow: 0 0 10px rgba(0, 212, 255, 0.6);
  border: 2px solid rgba(5, 18, 48, 0.9);

  &.is-doing {
    background: #f0c040;
    box-shadow: 0 0 10px rgba(240, 192, 64, 0.7);
  }
}

.tl-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 10px;
  border-radius: 6px;
  background: rgba(0, 38, 73, 0.32);
  border: 1px solid rgba(102, 217, 255, 0.1);
}

.tl-top {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tl-date {
  font-family: 'DIN Alternate', sans-serif;
  font-size: 14px;
  font-weight: 800;
  color: #8ef6ff;
}

.tl-role {
  font-size: 11px;
  font-weight: 700;
  color: #04101f;
  background: linear-gradient(90deg, #7ef0d0, #34d399);
  padding: 1px 7px;
  border-radius: 999px;
}

.tl-teacher {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.tl-teacher-label {
  flex-shrink: 0;
  color: #7eb4d8;
  font-size: 12px;
}

.tl-teacher-name {
  color: #d0e8f8;
  font-weight: 700;
}

.tl-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
}

.tl-row-label {
  flex-shrink: 0;
  margin-top: 1px;
  font-size: 12px;
  color: #7eb4d8;
  width: 56px;
}

.tl-text {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: #cfe8ff;

  &--effect {
    color: #7ff6c4;
  }
}
</style>
