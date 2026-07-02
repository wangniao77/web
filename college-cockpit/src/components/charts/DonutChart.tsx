import { useMemo } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import BaseChart from './BaseChart';

interface DonutChartProps {
  value: number;
  className?: string;
  small?: boolean;
}

export default function DonutChart({ value, className = '', small = false }: DonutChartProps) {
  const option = useMemo<EChartsOption>(() => {
    const ringColor = new echarts.graphic.LinearGradient(0, 0, 1, 1, [
      { offset: 0, color: '#0a7cff' },
      { offset: 0.55, color: '#20d4ff' },
      { offset: 1, color: '#63ffe1' }
    ]);

    return {
      backgroundColor: 'transparent',
      animation: true,
      animationDuration: 1600,
      animationEasing: 'elasticOut',
      series: [
        {
          type: 'pie',
          radius: small ? ['58%', '75%'] : ['62%', '80%'],
          center: ['50%', '50%'],
          silent: true,
          clockwise: true,
          startAngle: 90,
          animationType: 'scale',
          animationEasing: 'elasticOut',
          animationDelay: 200,
          label: { show: false },
          labelLine: { show: false },
          data: [
            {
              value,
              itemStyle: {
                color: ringColor,
                shadowBlur: 14,
                shadowColor: 'rgba(57,230,255,0.72)'
              }
            },
            {
              value: 100 - value,
              itemStyle: { color: 'rgba(70, 120, 190, 0.28)' }
            }
          ]
        }
      ],
      graphic: [
        {
          type: 'text',
          left: 'center',
          top: 'center',
          style: {
            text: `${value}%`,
            fill: '#ffffff',
            fontSize: small ? 22 : 28,
            fontWeight: 800,
            textShadowColor: 'rgba(0, 16, 40, 0.9)',
            textShadowBlur: 2,
            textShadowOffsetX: 0,
            textShadowOffsetY: 1
          }
        }
      ]
    };
  }, [small, value]);

  return <BaseChart option={option} className={className} />;
}
