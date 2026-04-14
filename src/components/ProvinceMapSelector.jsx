import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import * as echarts from 'echarts'
import chinaMap from '../data/china-map.json'
import {
  getRegionByProvince,
  normalizeProvinceName,
} from '../data/config.js'

echarts.registerMap('china-project-map', chinaMap)

function ProvinceMapSelector({ selectedProvinces, onToggleProvince }) {
  const option = useMemo(
    () => ({
      tooltip: {
        trigger: 'item',
        formatter: ({ name }) => {
          const province = normalizeProvinceName(name)
          const region = getRegionByProvince(province)
          return `${province}<br/>${region || '未纳入大区'}`
        },
      },
      series: [
        {
          type: 'map',
          map: 'china-project-map',
          selectedMode: 'multiple',
          roam: false,
          zoom: 1.06,
          label: {
            show: false,
          },
          itemStyle: {
            areaColor: '#f5f8fb',
            borderColor: '#b8cadb',
            borderWidth: 1,
          },
          emphasis: {
            label: {
              show: true,
              color: '#143553',
              fontSize: 11,
            },
            itemStyle: {
              areaColor: '#e3eef9',
            },
          },
          select: {
            label: {
              show: true,
              color: '#0f5d95',
              fontWeight: 700,
              fontSize: 11,
            },
            itemStyle: {
              areaColor: '#cfe2f6',
              borderColor: '#0f67a5',
            },
          },
          data: chinaMap.features
            .map((feature) => normalizeProvinceName(feature.properties.name))
            .filter((province) => getRegionByProvince(province))
            .map((province) => ({
              name: province,
              selected: selectedProvinces.includes(province),
            })),
          nameMap: Object.fromEntries(
            chinaMap.features.map((feature) => [
              feature.properties.name,
              normalizeProvinceName(feature.properties.name),
            ]),
          ),
        },
      ],
    }),
    [selectedProvinces],
  )

  return (
    <ReactECharts
      option={option}
      style={{ width: '100%', height: '520px' }}
      opts={{ renderer: 'svg' }}
      onEvents={{
        click: (params) => {
          const province = normalizeProvinceName(params.name)
          if (!getRegionByProvince(province)) {
            return
          }

          onToggleProvince(province)
        },
      }}
    />
  )
}

export default ProvinceMapSelector
