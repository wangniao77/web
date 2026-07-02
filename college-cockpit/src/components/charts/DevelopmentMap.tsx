import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import chinaJson from '../../assets/china.json';
import { dashboardData } from '../../data/mockData';
import BaseChart from './BaseChart';

let chinaMapRegistered = false;

function ensureChinaMap() {
  if (!chinaMapRegistered) {
    echarts.registerMap('china', chinaJson as Parameters<typeof echarts.registerMap>[1]);
    chinaMapRegistered = true;
  }
}

export default function DevelopmentMap() {
  const { legend, provinces, scatterPoints } = dashboardData.studentMap;

  const option = useMemo<EChartsOption>(() => {
    ensureChinaMap();

    const provinceData = provinces.map((item) => ({ name: item.name, value: item.value }));
    const scatterData = scatterPoints.map((point) => ({
      name: point.name,
      value: [...point.coord, point.value]
    }));

    const hubCoord = scatterPoints[0]?.coord;
    const linkData = hubCoord
      ? scatterPoints.slice(1).map((point) => ({
          coords: [[...hubCoord], [...point.coord]]
        }))
      : [];

    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(2, 18, 48, 0.92)',
        borderColor: 'rgba(57, 230, 255, 0.45)',
        textStyle: { color: '#f4fbff', fontSize: 13, fontWeight: 500 },
        formatter: (params) => {
          const item = Array.isArray(params) ? params[0] : params;
          const raw = item.value;
          const count = Array.isArray(raw) ? raw[2] : typeof raw === 'number' ? raw : 0;
          return `${item.name ?? ''}<br />生源人数：${count} 人`;
        }
      },
      visualMap: {
        show: false,
        min: 0,
        max: 4200,
        seriesIndex: 0,
        inRange: {
          color: ['#082a58', '#0c4f92', '#1689c8', '#39e6ff', '#9df7ff']
        }
      },
      geo: {
        map: 'china',
        roam: false,
        zoom: 1.05,
        center: [105, 36],
        aspectScale: 0.82,
        layoutCenter: ['50%', '52%'],
        layoutSize: '88%',
        label: { show: false },
        itemStyle: {
          areaColor: '#07366e',
          borderColor: 'rgba(57, 230, 255, 0.65)',
          borderWidth: 0.8,
          shadowColor: 'rgba(57, 230, 255, 0.28)',
          shadowBlur: 10
        },
        emphasis: {
          label: { show: false },
          itemStyle: {
            areaColor: '#0d7fd4',
            borderColor: '#8af4ff'
          }
        },
        regions: [
          {
            name: '南海诸岛',
            itemStyle: {
              areaColor: 'rgba(7, 54, 110, 0.35)',
              borderColor: 'rgba(57, 230, 255, 0.25)',
              opacity: 0.55
            },
            emphasis: { itemStyle: { areaColor: 'rgba(13, 127, 212, 0.45)' } }
          }
        ]
      },
      series: [
        {
          name: '生源分布',
          type: 'map',
          map: 'china',
          geoIndex: 0,
          data: provinceData,
          emphasis: { label: { show: false } }
        },
        {
          type: 'lines',
          coordinateSystem: 'geo',
          geoIndex: 0,
          zlevel: 2,
          silent: true,
          effect: {
            show: true,
            period: 3.5,
            trailLength: 0.18,
            symbol: 'circle',
            symbolSize: 3,
            color: '#8af4ff'
          },
          lineStyle: {
            color: 'rgba(57, 230, 255, 0.35)',
            width: 1,
            curveness: 0.18,
            type: 'dashed'
          },
          data: linkData
        },
        {
          type: 'effectScatter',
          coordinateSystem: 'geo',
          geoIndex: 0,
          zlevel: 3,
          rippleEffect: {
            brushType: 'stroke',
            scale: 3.2,
            period: 3.2
          },
          symbolSize: (val) => {
            const count = Array.isArray(val) ? val[2] : 0;
            return Math.max(7, Math.min(16, Math.sqrt(count) * 0.24));
          },
          itemStyle: {
            color: '#39e6ff',
            shadowBlur: 10,
            shadowColor: 'rgba(57, 230, 255, 0.9)'
          },
          data: scatterData
        }
      ]
    };
  }, [provinces, scatterPoints]);

  return (
    <div className="tech-map">
      <div className="map-legend">
        <span>数量（人）</span>
        {legend.map((item, index) => (
          <b key={item}>
            <i style={{ '--legend-alpha': `${1 - index * 0.1}` } as CSSProperties} />
            {item}
          </b>
        ))}
      </div>
      <BaseChart option={option} className="china-map-chart" />
    </div>
  );
}
