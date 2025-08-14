import React from 'react'

import { View } from 'react-native'
import { responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions'
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg'

// データの型定義
export interface ChartData {
    data: number[]
    labels: string[]
}

// カスタムSVGバーチャートコンポーネント
export const CustomBarChart = ({
    data,
    labels,
    width,
    height,
    period = '月',
}: {
    data: number[]
    labels: string[]
    width: number
    height: number
    period?: '日' | '週' | '月'
}) => {
    // データの最大値に応じて上限を決定
    const dataMax = Math.max(...data)
    let maxValue: number
    let yAxisSteps: number[]

    if (period === '週') {
        // 週別: デフォルト7.5k、データが7.5kを超えていた場合は10k
        maxValue = dataMax > 7500 ? 10000 : 7500
        yAxisSteps = maxValue === 10000 ? [0, 2500, 5000, 7500, 10000] : [0, 2500, 5000, 7500]
    } else {
        // 月別: デフォルト7.5k、データが7.5kを超えていた場合は10k
        maxValue = dataMax > 7500 ? 10000 : 7500
        yAxisSteps = maxValue === 10000 ? [0, 2500, 5000, 7500, 10000] : [0, 2500, 5000, 7500]
    }

    const chartPadding = { left: 50, right: 20, top: 20, bottom: 30 }
    const chartWidth = width - chartPadding.left - chartPadding.right
    const chartHeight = height - chartPadding.top - chartPadding.bottom
    const barWidth = (chartWidth / data.length) * 0.6
    const barSpacing = chartWidth / data.length

    return (
        <Svg
            width={width}
            height={height}
        >
            {/* Y軸の固定メモリライン */}
            {yAxisSteps.map((value, index) => {
                const y = chartPadding.top + chartHeight - (value / maxValue) * chartHeight
                return (
                    <G key={value}>
                        <Line
                            x1={chartPadding.left}
                            y1={y}
                            x2={width - chartPadding.right}
                            y2={y}
                            stroke='#E0E0E0'
                            strokeWidth='1'
                        />
                        <SvgText
                            x={chartPadding.left - 10}
                            y={y + 4}
                            fontSize='11'
                            fill='#666'
                            textAnchor='end'
                        >
                            {value === 0 ? '0' : `${(value / 1000).toFixed(1)}K`}
                        </SvgText>
                    </G>
                )
            })}

            {/* データバー */}
            {data.map((value, index) => {
                const barHeight = Math.max((Math.min(value, maxValue) / maxValue) * chartHeight, 1)
                const x = chartPadding.left + index * barSpacing + (barSpacing - barWidth) / 2
                const y = chartPadding.top + chartHeight - barHeight

                return (
                    <Rect
                        key={index}
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        fill='#2BA44E'
                        rx={1}
                    />
                )
            })}

            {/* X軸ラベル */}
            {labels.map((label, index) => {
                if (!label) return null
                const x = chartPadding.left + index * barSpacing + barSpacing / 2
                const y = height - chartPadding.bottom + 15

                return (
                    <SvgText
                        key={index}
                        x={x}
                        y={y}
                        fontSize='11'
                        fill='#666'
                        textAnchor='middle'
                    >
                        {label}
                    </SvgText>
                )
            })}
        </Svg>
    )
}

// 日別用カスタムSVG棒グラフコンポーネント
export const CustomDailyBarChart = ({
    data,
    labels,
    width,
    height,
}: {
    data: number[]
    labels: string[]
    width: number
    height: number
}) => {
    const dataMax = Math.max(...data)
    let maxValue: number
    let yAxisSteps: number[]

    // 日別棒グラフは各時間帯の歩数なので上限を低めに設定
    if (dataMax > 1000) {
        maxValue = 1500
        yAxisSteps = [0, 375, 750, 1125, 1500]
    } else if (dataMax > 750) {
        maxValue = 1000
        yAxisSteps = [0, 250, 500, 750, 1000]
    } else {
        maxValue = 750
        yAxisSteps = [0, 250, 500, 750]
    }

    const chartPadding = { left: 50, right: 20, top: 20, bottom: 30 }
    const chartWidth = width - chartPadding.left - chartPadding.right
    const chartHeight = height - chartPadding.top - chartPadding.bottom
    const barWidth = (chartWidth / data.length) * 0.6
    const barSpacing = chartWidth / data.length

    return (
        <Svg
            width={width}
            height={height}
        >
            {/* Y軸の固定メモリライン */}
            {yAxisSteps.map((value, index) => {
                const y = chartPadding.top + chartHeight - (value / maxValue) * chartHeight
                return (
                    <G key={value}>
                        <Line
                            x1={chartPadding.left}
                            y1={y}
                            x2={width - chartPadding.right}
                            y2={y}
                            stroke='#E0E0E0'
                            strokeWidth='1'
                        />
                        <SvgText
                            x={chartPadding.left - 10}
                            y={y + 4}
                            fontSize='11'
                            fill='#666'
                            textAnchor='end'
                        >
                            {value === 0 ? '0' : value.toString()}
                        </SvgText>
                    </G>
                )
            })}

            {/* データバー */}
            {data.map((value, index) => {
                const barHeight = Math.max((Math.min(value, maxValue) / maxValue) * chartHeight, 1)
                const x = chartPadding.left + index * barSpacing + (barSpacing - barWidth) / 2
                const y = chartPadding.top + chartHeight - barHeight

                return (
                    <Rect
                        key={index}
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        fill='#2BA44E'
                        rx={1}
                    />
                )
            })}

            {/* X軸ラベル */}
            {labels.map((label, index) => {
                if (!label) return null
                const x = chartPadding.left + index * barSpacing + barSpacing / 2
                const y = height - chartPadding.bottom + 15

                return (
                    <SvgText
                        key={index}
                        x={x}
                        y={y}
                        fontSize='11'
                        fill='#666'
                        textAnchor='middle'
                    >
                        {label}
                    </SvgText>
                )
            })}
        </Svg>
    )
}

// 日別用カスタムSVG折れ線グラフコンポーネント（累積値）
export const CustomDailyLineChart = ({
    data,
    labels,
    width,
    height,
}: {
    data: number[]
    labels: string[]
    width: number
    height: number
}) => {
    // 累積値を作成
    const cumulativeData = data.reduce<number[]>((acc, cur, i) => {
        acc.push((acc[i - 1] || 0) + cur)
        return acc
    }, [])

    const dataMax = Math.max(...cumulativeData)
    let maxValue: number
    let yAxisSteps: number[]

    if (dataMax > 10000) {
        maxValue = 15000
        yAxisSteps = [0, 3750, 7500, 11250, 15000]
    } else if (dataMax > 7500) {
        maxValue = 10000
        yAxisSteps = [0, 2500, 5000, 7500, 10000]
    } else {
        maxValue = 7500
        yAxisSteps = [0, 2500, 5000, 7500]
    }

    const chartPadding = { left: 50, right: 20, top: 20, bottom: 30 }
    const chartWidth = width - chartPadding.left - chartPadding.right
    const chartHeight = height - chartPadding.top - chartPadding.bottom
    const pointSpacing = chartWidth / (cumulativeData.length - 1)

    // 折れ線グラフのパスを生成
    const generateLinePath = () => {
        let path = ''
        cumulativeData.forEach((value, index) => {
            const x = chartPadding.left + index * pointSpacing
            const y = chartPadding.top + chartHeight - (Math.min(value, maxValue) / maxValue) * chartHeight

            if (index === 0) {
                path += `M ${x} ${y}`
            } else {
                path += ` L ${x} ${y}`
            }
        })
        return path
    }

    return (
        <Svg
            width={width}
            height={height}
        >
            {/* Y軸の固定メモリライン */}
            {yAxisSteps.map((value, index) => {
                const y = chartPadding.top + chartHeight - (value / maxValue) * chartHeight
                return (
                    <G key={value}>
                        <Line
                            x1={chartPadding.left}
                            y1={y}
                            x2={width - chartPadding.right}
                            y2={y}
                            stroke='#E0E0E0'
                            strokeWidth='1'
                        />
                        <SvgText
                            x={chartPadding.left - 10}
                            y={y + 4}
                            fontSize='11'
                            fill='#666'
                            textAnchor='end'
                        >
                            {value === 0 ? '0' : `${(value / 1000).toFixed(1)}K`}
                        </SvgText>
                    </G>
                )
            })}

            {/* 折れ線グラフ */}
            <Path
                d={generateLinePath()}
                stroke='#4BC16B'
                strokeWidth='3'
                fill='none'
            />

            {/* 折れ線グラフの点 */}
            {cumulativeData.map((value, index) => {
                const x = chartPadding.left + index * pointSpacing
                const y = chartPadding.top + chartHeight - (Math.min(value, maxValue) / maxValue) * chartHeight

                return (
                    <Circle
                        key={index}
                        cx={x}
                        cy={y}
                        r='5'
                        fill='#4BC16B'
                        stroke='#fff'
                        strokeWidth='2'
                    />
                )
            })}

            {/* X軸ラベル */}
            {labels.map((label, index) => {
                if (!label) return null
                const x = chartPadding.left + index * pointSpacing
                const y = height - chartPadding.bottom + 15

                return (
                    <SvgText
                        key={index}
                        x={x}
                        y={y}
                        fontSize='11'
                        fill='#666'
                        textAnchor='middle'
                    >
                        {label}
                    </SvgText>
                )
            })}
        </Svg>
    )
}
