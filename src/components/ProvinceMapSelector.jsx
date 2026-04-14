import { useMemo, useRef, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import * as echarts from 'echarts'
import chinaMap from '../data/china-map.json'
import {
  getRegionByProvince,
  REGION_COLORS,
  REGION_DESCRIPTIONS,
  normalizeProvinceName,
} from '../data/config.js'

echarts.registerMap('china-project-map', chinaMap)

function walkCoordinates(coordinates, callback) {
  if (!Array.isArray(coordinates)) {
    return
  }

  if (
    coordinates.length === 2 &&
    typeof coordinates[0] === 'number' &&
    typeof coordinates[1] === 'number'
  ) {
    callback(coordinates)
    return
  }

  coordinates.forEach((child) => walkCoordinates(child, callback))
}

function ProvinceMapSelector({
  selectedRegion,
  onSelectRegion,
  onBoxSelectProvinces,
  onSelectWholeRegion,
  onClearSelection,
}) {
  const chartRef = useRef(null)
  const wrapperRef = useRef(null)
  const [brushMode, setBrushMode] = useState(false)
  const [selectionBox, setSelectionBox] = useState(null)
  const dragStartRef = useRef(null)

  const option = useMemo(
    () => ({
      tooltip: {
        trigger: 'item',
        formatter: ({ name }) => {
          const province = normalizeProvinceName(name)
          const region = getRegionByProvince(province)
          const description = region ? REGION_DESCRIPTIONS[region] : '未纳入当前会议大区。'
          return `${province}<br/>${region || '未纳入大区'}<br/>${description}`
        },
      },
      series: [
        {
          type: 'map',
          map: 'china-project-map',
          selectedMode: false,
          roam: false,
          zoom: 1.06,
          label: {
            show: false,
          },
          emphasis: {
            label: {
              show: true,
              color: '#143553',
              fontSize: 11,
            },
            itemStyle: {
              borderColor: '#0f67a5',
              borderWidth: 2,
            },
          },
          data: chinaMap.features
            .map((feature) => normalizeProvinceName(feature.properties.name))
            .filter((province) => getRegionByProvince(province))
            .map((province) => ({
              name: province,
              itemStyle: {
                areaColor: REGION_COLORS[getRegionByProvince(province)] || '#f5f8fb',
                borderColor:
                  selectedRegion === getRegionByProvince(province) ? '#0f67a5' : '#b8cadb',
                borderWidth: selectedRegion === getRegionByProvince(province) ? 2 : 1,
                opacity: selectedRegion && selectedRegion !== getRegionByProvince(province) ? 0.45 : 1,
              },
              label: {
                show: selectedRegion === getRegionByProvince(province),
                color: '#143553',
                fontSize: 11,
              },
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
    [selectedRegion],
  )

  const updateSelectionBox = (clientX, clientY) => {
    const container = wrapperRef.current
    const start = dragStartRef.current
    if (!container || !start) {
      return
    }

    const bounds = container.getBoundingClientRect()
    const x1 = Math.max(0, Math.min(start.x, clientX - bounds.left))
    const y1 = Math.max(0, Math.min(start.y, clientY - bounds.top))
    const x2 = Math.max(0, Math.min(clientX - bounds.left, bounds.width))
    const y2 = Math.max(0, Math.min(clientY - bounds.top, bounds.height))

    setSelectionBox({
      left: Math.min(x1, x2),
      top: Math.min(y1, y2),
      width: Math.abs(x2 - x1),
      height: Math.abs(y2 - y1),
    })
  }

  const handleMouseDown = (event) => {
    if (!brushMode || !selectedRegion || !wrapperRef.current) {
      return
    }

    const bounds = wrapperRef.current.getBoundingClientRect()
    dragStartRef.current = {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    }
    setSelectionBox({
      left: event.clientX - bounds.left,
      top: event.clientY - bounds.top,
      width: 0,
      height: 0,
    })
  }

  const handleMouseMove = (event) => {
    if (!dragStartRef.current) {
      return
    }

    updateSelectionBox(event.clientX, event.clientY)
  }

  const handleMouseUp = () => {
    if (!dragStartRef.current || !selectionBox || !selectedRegion) {
      dragStartRef.current = null
      setSelectionBox(null)
      return
    }

    const chart = chartRef.current?.getEchartsInstance()
    if (!chart || selectionBox.width < 6 || selectionBox.height < 6) {
      dragStartRef.current = null
      setSelectionBox(null)
      return
    }

    const selected = chinaMap.features
      .map((feature) => normalizeProvinceName(feature.properties.name))
      .filter((province) => getRegionByProvince(province) === selectedRegion)
      .filter((province) => {
        const feature = chinaMap.features.find(
          (item) => normalizeProvinceName(item.properties.name) === province,
        )
        if (!feature) {
          return false
        }

        let minX = Number.POSITIVE_INFINITY
        let minY = Number.POSITIVE_INFINITY
        let maxX = Number.NEGATIVE_INFINITY
        let maxY = Number.NEGATIVE_INFINITY

        walkCoordinates(feature.geometry.coordinates, (coord) => {
          const pixel = chart.convertToPixel({ seriesIndex: 0 }, coord)
          if (!pixel || Number.isNaN(pixel[0]) || Number.isNaN(pixel[1])) {
            return
          }
          minX = Math.min(minX, pixel[0])
          minY = Math.min(minY, pixel[1])
          maxX = Math.max(maxX, pixel[0])
          maxY = Math.max(maxY, pixel[1])
        })

        if (
          !Number.isFinite(minX) ||
          !Number.isFinite(minY) ||
          !Number.isFinite(maxX) ||
          !Number.isFinite(maxY)
        ) {
          return false
        }

        const intersects =
          maxX >= selectionBox.left &&
          minX <= selectionBox.left + selectionBox.width &&
          maxY >= selectionBox.top &&
          minY <= selectionBox.top + selectionBox.height

        return intersects
      })

    if (selected.length > 0) {
      onBoxSelectProvinces(selected)
    }

    dragStartRef.current = null
    setSelectionBox(null)
  }

  return (
    <div className="map-selector">
      <div className="map-selector__toolbar">
        <div className="helper-text">
          {selectedRegion
            ? `当前已选大区：${selectedRegion}，可框选该大区内的省份。`
            : '先点击地图中的任意省份以确定大区。'}
        </div>
        <div className="button-row">
          <button
            type="button"
            className={`button ${brushMode ? 'button--primary' : 'button--secondary'}`}
            onClick={() => setBrushMode((value) => !value)}
            disabled={!selectedRegion}
          >
            {brushMode ? '退出框选' : '框选省份'}
          </button>
          <button
            type="button"
            className="button button--secondary"
            onClick={() => selectedRegion && onSelectWholeRegion(selectedRegion)}
            disabled={!selectedRegion}
          >
            一键选中整个大区
          </button>
          <button
            type="button"
            className="button button--secondary"
            onClick={() => {
              setBrushMode(false)
              onClearSelection()
            }}
          >
            清空
          </button>
        </div>
      </div>

      <div
        className={`map-selector__canvas ${brushMode ? 'map-selector__canvas--brush' : ''}`}
        ref={wrapperRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <ReactECharts
          ref={chartRef}
          option={option}
          style={{ width: '100%', height: '520px' }}
          opts={{ renderer: 'svg' }}
          onEvents={{
            click: (params) => {
              if (brushMode) {
                return
              }

              const province = normalizeProvinceName(params.name)
              const region = getRegionByProvince(province)
              if (!region) {
                return
              }

              onSelectRegion(region)
            },
          }}
        />

        {selectionBox ? (
          <div
            className="map-selector__selection"
            style={{
              left: selectionBox.left,
              top: selectionBox.top,
              width: selectionBox.width,
              height: selectionBox.height,
            }}
          />
        ) : null}
      </div>
    </div>
  )
}

export default ProvinceMapSelector
