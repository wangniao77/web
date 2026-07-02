import { useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import BaseChart from './BaseChart';
import { axisLabelStyle, axisStyle, splitLine, tooltip } from './chartTheme';

export function GpaRankChart({
  terms,
  ranks
}: {
  terms: readonly string[];
  ranks: readonly number[];
}) {
  const option = useMemo<EChartsOption>(() => ({
    tooltip: { ...tooltip, formatter: '{b}<br />排名百分位：前 {c}%' },
    grid: { left: 38, right: 10, top: 12, bottom: 22 },
    xAxis: { type: 'category', data: [...terms], ...axisStyle },
    yAxis: {
      type: 'value',
      inverse: true,
      min: 0,
      max: 30,
      ...axisStyle,
      axisLabel: { ...axisLabelStyle, formatter: '前{c}%' },
      splitLine
    },
    series: [{
      type: 'line',
      smooth: true,
      data: [...ranks],
      symbolSize: 6,
      lineStyle: { width: 2.5, color: '#00f2ff', shadowBlur: 10, shadowColor: '#00f2ff' },
      itemStyle: { color: '#00f2ff' },
      areaStyle: { color: 'rgba(0,242,255,0.12)' }
    }]
  }), [ranks, terms]);

  return <BaseChart option={option} />;
}

export function HighPotentialTrendChart({
  months,
  counts
}: {
  months: readonly string[];
  counts: readonly number[];
}) {
  const option = useMemo<EChartsOption>(() => ({
    tooltip,
    grid: { left: 36, right: 8, top: 8, bottom: 20 },
    xAxis: { type: 'category', data: [...months], ...axisStyle },
    yAxis: { type: 'value', ...axisStyle, splitLine },
    series: [{
      type: 'bar',
      data: [...counts],
      barWidth: 10,
      itemStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: '#63ffe1' },
            { offset: 1, color: '#0d71ff' }
          ]
        },
        borderRadius: [4, 4, 0, 0]
      }
    }]
  }), [counts, months]);

  return <BaseChart option={option} />;
}
