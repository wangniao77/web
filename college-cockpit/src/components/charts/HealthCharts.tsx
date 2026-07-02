import { useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import type { NameValue } from '../../data/mockData';
import BaseChart from './BaseChart';
import { axisLabelStyle, axisStyle, chartLabelStyle, horizontalGradient, legendTextStyle, splitLine, textColor, tooltip } from './chartTheme';

export function CampusRunChart({ data }: { data: readonly NameValue[] }) {
  const option = useMemo<EChartsOption>(() => ({
    tooltip: { ...tooltip, formatter: '{b}<br />完成率：{c}%' },
    grid: { left: 42, right: 28, top: 14, bottom: 16 },
    xAxis: { type: 'value', max: 100, show: false },
    yAxis: { type: 'category', inverse: true, data: data.map((item) => item.name), ...axisStyle },
    series: [
      {
        type: 'bar',
        data: data.map((item) => item.value),
        barWidth: 10,
        itemStyle: { color: horizontalGradient('#1174ff', '#6cffef'), borderRadius: 8, shadowBlur: 8, shadowColor: 'rgba(57,230,255,0.5)' },
        label: { show: true, position: 'right', formatter: '{c}%', ...chartLabelStyle }
      }
    ]
  }), [data]);

  return <BaseChart option={option} />;
}

interface HeatmapChartProps {
  days: readonly string[];
  hours: readonly string[];
  values: Array<[number, number, number]>;
}

export function HeatmapChart({ days, hours, values }: HeatmapChartProps) {
  const option = useMemo<EChartsOption>(() => ({
    tooltip: {
      position: 'top',
      backgroundColor: 'rgba(2, 14, 38, 0.94)',
      borderColor: 'rgba(57, 230, 255, 0.55)',
      textStyle: { color: '#f4fbff', fontSize: 13, fontWeight: 500 },
      formatter: (params: unknown) => {
        const target = Array.isArray(params) ? params[0] : params;
        const rawValue = (target as { value?: unknown } | undefined)?.value;
        const value = Array.isArray(rawValue) ? rawValue : [0, 0, 0];
        return `${days[value[0] as number]} ${hours[value[1] as number]}<br />热度：${value[2]}`;
      }
    },
    grid: { left: 42, right: 20, top: 12, bottom: 20 },
    xAxis: { type: 'category', data: days, ...axisStyle, splitArea: { show: true, areaStyle: { color: ['rgba(0,96,150,0.08)', 'rgba(0,180,255,0.03)'] } } },
    yAxis: { type: 'category', data: hours, ...axisStyle, splitArea: { show: true } },
    visualMap: {
      min: 0,
      max: 100,
      calculable: false,
      orient: 'vertical',
      right: 0,
      top: 2,
      itemWidth: 8,
      itemHeight: 64,
      text: ['高', '低'],
      textStyle: legendTextStyle,
      inRange: { color: ['#08356f', '#0b91d4', '#28f0e0', '#f6d04d'] }
    },
    series: [
      {
        type: 'heatmap',
        data: values,
        label: { show: false },
        itemStyle: { borderColor: 'rgba(7,32,72,0.88)', borderWidth: 1 }
      }
    ]
  }), [days, hours, values]);

  return <BaseChart option={option} />;
}

export function SportsRadarChart({ data }: { data: readonly NameValue[] }) {
  const option = useMemo<EChartsOption>(() => ({
    tooltip,
    radar: {
      center: ['50%', '54%'],
      radius: '66%',
      indicator: data.map((item) => ({ name: item.name, max: 100 })),
      splitNumber: 4,
      axisName: { color: textColor, fontSize: 12, fontWeight: 600 },
      axisLine: { lineStyle: { color: 'rgba(57,230,255,0.28)' } },
      splitLine: { lineStyle: { color: 'rgba(57,230,255,0.22)' } },
      splitArea: { areaStyle: { color: ['rgba(0,200,255,0.03)', 'rgba(0,200,255,0.09)'] } }
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: data.map((item) => item.value),
            name: '运动项目偏好',
            areaStyle: { color: 'rgba(0, 200, 255, 0.32)' },
            lineStyle: { color: '#39e6ff', width: 2, shadowBlur: 10, shadowColor: '#39e6ff' },
            itemStyle: { color: '#ffcf4a' }
          }
        ]
      }
    ]
  }), [data]);

  return <BaseChart option={option} />;
}
