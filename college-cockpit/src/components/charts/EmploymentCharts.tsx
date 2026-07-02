import { useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import type { NameValue } from '../../data/mockData';
import BaseChart from './BaseChart';
import { axisStyle, chartLabelStyle, splitLine, tooltip, verticalGradient } from './chartTheme';

export function CertificateBarChart({ data }: { data: readonly NameValue[] }) {
  const option = useMemo<EChartsOption>(() => ({
    tooltip,
    grid: { left: 42, right: 14, top: 22, bottom: 24 },
    xAxis: { type: 'category', data: data.map((item) => item.name), ...axisStyle },
    yAxis: { type: 'value', ...axisStyle, splitLine },
    series: [
      {
        type: 'bar',
        data: data.map((item) => item.value),
        barWidth: 22,
        itemStyle: {
          color: verticalGradient('#49f1ff', '#0b55cf'),
          borderRadius: [5, 5, 0, 0],
          shadowBlur: 10,
          shadowColor: 'rgba(57,230,255,0.56)'
        },
        label: { show: true, position: 'top', ...chartLabelStyle }
      }
    ]
  }), [data]);

  return <BaseChart option={option} />;
}
