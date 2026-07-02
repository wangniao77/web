import * as echarts from 'echarts';

export const cyan = '#39e6ff';
export const blue = '#00a8ff';
export const deepBlue = '#083a78';
export const amber = '#ffb82e';
export const orange = '#ff7b2f';
export const textColor = '#e8f7ff';
export const textColorBright = '#ffffff';

export const axisLabelStyle = { color: textColor, fontSize: 13, fontWeight: 500 as const };
export const axisLabelStyleCompact = { color: textColor, fontSize: 13, lineHeight: 16, fontWeight: 500 as const };
export const chartLabelStyle = { color: '#f4fbff', fontSize: 14, fontWeight: 700 as const };
export const nameTextStyle = { color: textColor, fontSize: 13, fontWeight: 600 as const };
export const legendTextStyle = { color: '#d8efff', fontSize: 13, fontWeight: 500 as const };

export const tooltip = {
  trigger: 'axis' as const,
  backgroundColor: 'rgba(2, 14, 38, 0.94)',
  borderColor: 'rgba(0, 242, 255, 0.65)',
  borderWidth: 1,
  extraCssText: 'box-shadow: 0 0 16px rgba(0, 242, 255, 0.35);',
  textStyle: { color: '#f4fbff', fontSize: 13, fontWeight: 500 },
  confine: true
};

export const axisStyle = {
  alignTicks: false,
  axisLine: { lineStyle: { color: 'rgba(80,180,255,0.32)' } },
  axisTick: { show: false },
  axisLabel: axisLabelStyle
};

export const splitLine = {
  lineStyle: { color: 'rgba(0, 242, 255, 0.12)', type: 'dashed' as const }
};

export const chartAnimation = {
  animation: true,
  animationDuration: 1400,
  animationEasing: 'cubicOut' as const,
  animationDurationUpdate: 900,
  animationEasingUpdate: 'cubicOut' as const
};

export const seriesAnimation = {
  animationDelay: (index: number) => index * 80,
  animationDuration: 1200
};

export function verticalGradient(top = cyan, bottom = '#0a55d9') {
  return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: top },
    { offset: 0.48, color: blue },
    { offset: 1, color: bottom }
  ]);
}

export function horizontalGradient(left = '#0d6cff', right = cyan) {
  return new echarts.graphic.LinearGradient(0, 0, 1, 0, [
    { offset: 0, color: left },
    { offset: 1, color: right }
  ]);
}

export function orangeGradient() {
  return new echarts.graphic.LinearGradient(0, 0, 1, 0, [
    { offset: 0, color: '#ff5a37' },
    { offset: 1, color: amber }
  ]);
}

export function compactMajorName(name: string) {
  return name
    .replace('计算机科学与技术（创新实验班）', '计算机科学与技术\n（创新实验班）')
    .replace('大数据管理与应用（数据治理）', '大数据管理与应用\n（数据治理）');
}
