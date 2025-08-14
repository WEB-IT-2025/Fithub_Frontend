import React from 'react'
import { faChartColumn, faChartLine } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { Text, TouchableOpacity, View } from 'react-native'
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions'

import { CustomBarChart, CustomDailyBarChart, CustomDailyLineChart } from './ExerciseCharts'

// データの型定義
interface UserData {
    today: {
        steps: number
        contributions: number
        date: string
    }
    recent_exercise?: Array<{
        day: string
        exercise_quantity: number
    }>
}

interface ExerciseGraphProps {
    userData?: UserData
    period: '日' | '週' | '月'
    chartType: 'bar' | 'line'
    onChartTypeChange: (type: 'bar' | 'line') => void
    isLoading?: boolean
}

const ExerciseGraph: React.FC<ExerciseGraphProps> = ({
    userData,
    period,
    chartType,
    onChartTypeChange,
    isLoading = false,
}) => {
    // 日別歩数データ取得メソッド（2時間ごと13本のダミーデータ）
    const getDailyStepsData = () => {
        // ダミーデータ（朝少なめ→昼多め→夜減少の現実的な推移）
        return [200, 300, 400, 700, 1000, 1100, 1200, 1100, 900, 600, 400, 200, 100]
    }

    // 週別歩数データ取得メソッド
    const getWeeklyStepsData = () => {
        if (userData?.recent_exercise && userData.recent_exercise.length > 0) {
            // 曜日別にデータを整理（月曜=0, 火曜=1, ..., 日曜=6）
            const weeklySteps = new Array(7).fill(0) // [月, 火, 水, 木, 金, 土, 日]
            userData.recent_exercise.forEach((exercise) => {
                const date = new Date(exercise.day)
                const dayOfWeek = (date.getDay() + 6) % 7 // 日曜=0を月曜=0に変換
                weeklySteps[dayOfWeek] = exercise.exercise_quantity
            })
            return weeklySteps
        } else {
            // ダミーデータ（月〜日の7日分）
            return [3200, 4100, 2900, 5800, 4700, 3600, userData?.today.steps || 5000]
        }
    }

    // 月別歩数データ取得メソッド
    const getMonthlyStepsData = () => {
        // ダミーデータ（30日分）、10000歩以下に制限
        const rawData = [
            3200, 4100, 2900, 5800, 4700, 3600, 5000, 4200, 3900, 5100,
            4800, 3700, 5300, 4400, 4100, 5500, 4600, 3800, 5700, 4900,
            4000, 5900, 4300, 4100, 6100, 4200, 4300, 9300, 4400, 4500,
        ]
        return rawData.map((steps) => Math.min(steps, 10000))
    }

    // 期間別歩数データ取得メソッド
    const getStepsData = () => {
        switch (period) {
            case '日':
                return getDailyStepsData()
            case '週':
                return getWeeklyStepsData()
            case '月':
                return getMonthlyStepsData()
            default:
                return getDailyStepsData()
        }
    }

    // 表示用歩数計算メソッド（合計・平均）
    const getDisplaySteps = () => {
        const stepsData = getStepsData()
        if (period === '週' || period === '月') {
            if (stepsData.length === 0) return 0
            // 平均歩数
            return Math.round(stepsData.reduce((sum, steps) => sum + steps, 0) / stepsData.length)
        } else {
            // 合計歩数
            return stepsData.reduce((sum, steps) => sum + steps, 0)
        }
    }

    // 期間別ラベル取得メソッド
    const getChartLabels = () => {
        switch (period) {
            case '日':
                // 2時間ごと+24時
                return ['0', '2', '4', '6', '8', '10', '12', '14', '16', '18', '20', '22', '24']
            case '週':
                return ['月', '火', '水', '木', '金', '土', '日']
            case '月': {
                // 1,8,15,22,29日だけ表示し、それ以外は空文字
                const len = getStepsData().length
                return Array.from({ length: len }, (_, i) => {
                    return i % 7 === 0 ? `${i + 1}日` : ''
                })
            }
            default:
                return ['今日']
        }
    }

    // 日別グラフレンダリングメソッド（SVGカスタムチャート）
    const renderDailyChart = () => {
        const barData = getDailyStepsData()
        const labels = getChartLabels()
        const chartWidth = responsiveWidth(95)
        const chartHeight = responsiveHeight(20)

        return (
            <View style={{ alignItems: 'center' }}>
                {chartType === 'bar' ?
                    <CustomDailyBarChart
                        data={barData}
                        labels={labels}
                        width={chartWidth}
                        height={chartHeight}
                    />
                :   <CustomDailyLineChart
                        data={barData}
                        labels={labels}
                        width={chartWidth}
                        height={chartHeight}
                    />
                }
            </View>
        )
    }

    // 週別グラフレンダリングメソッド（SVGカスタムチャート）
    const renderWeeklyChart = () => {
        const weeklyData = getWeeklyStepsData()
        const labels = getChartLabels()
        const chartWidth = responsiveWidth(90)
        const chartHeight = responsiveHeight(20)

        return (
            <View style={{ alignItems: 'center' }}>
                <CustomBarChart
                    data={weeklyData}
                    labels={labels}
                    width={chartWidth}
                    height={chartHeight}
                    period='週'
                />
            </View>
        )
    }

    // 月別グラフレンダリングメソッド（SVGカスタムチャート）
    const renderMonthlyChart = () => {
        const monthlyData = getMonthlyStepsData()
        const labels = getChartLabels()
        const chartWidth = responsiveWidth(90)
        const chartHeight = responsiveHeight(20)

        return (
            <View style={{ alignItems: 'center' }}>
                <CustomBarChart
                    data={monthlyData}
                    labels={labels}
                    width={chartWidth}
                    height={chartHeight}
                    period='月'
                />
            </View>
        )
    }

    // 期間別グラフレンダリングメソッド
    const renderChart = () => {
        switch (period) {
            case '日':
                return renderDailyChart()
            case '週':
                return renderWeeklyChart()
            case '月':
                return renderMonthlyChart()
            default:
                return renderDailyChart()
        }
    }

    return (
        <>
            {/* 合計・歩数 or 平均・歩数 */}
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                marginBottom: responsiveHeight(1),
                paddingHorizontal: responsiveWidth(2),
            }}>
                <View style={{ flex: 1 }}>
                    <Text style={{
                        fontSize: responsiveFontSize(2),
                        color: '#666',
                        marginBottom: responsiveHeight(0.5),
                    }}>
                        {period === '週' || period === '月' ? '平均' : '合計'}
                    </Text>
                    {isLoading ?
                        <Text style={{
                            fontSize: responsiveFontSize(3),
                            fontWeight: 'bold',
                            color: '#333',
                        }}>読込中...</Text>
                    :   <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                            <Text style={{
                                fontSize: responsiveFontSize(3.5),
                                fontWeight: 'bold',
                                color: '#333',
                            }}>
                                {getDisplaySteps().toLocaleString()}
                            </Text>
                            <Text style={{
                                fontSize: responsiveFontSize(2),
                                color: '#666',
                                marginLeft: responsiveWidth(1),
                            }}>歩</Text>
                        </View>
                    }
                </View>

                {/* 日別用のチャートタイプ切り替えボタン（右端） */}
                {period === '日' && (
                    <TouchableOpacity
                        style={{
                            width: responsiveWidth(12),
                            height: responsiveHeight(5.5),
                            backgroundColor: '#2BA44E',
                            borderRadius: 12,
                            marginTop: responsiveHeight(1),
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                        onPress={() => onChartTypeChange(chartType === 'bar' ? 'line' : 'bar')}
                        activeOpacity={0.8}
                    >
                        <FontAwesomeIcon
                            icon={chartType === 'bar' ? faChartColumn : faChartLine}
                            size={responsiveFontSize(2.5)}
                            color='#fff'
                        />
                    </TouchableOpacity>
                )}
            </View>

            {/* グラフ表示 */}
            {isLoading ?
                <View style={{
                    height: responsiveHeight(25),
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f5f5f5',
                    borderRadius: 24,
                    marginBottom: responsiveHeight(2),
                }}>
                    <Text style={{
                        fontSize: responsiveFontSize(2),
                        color: '#666',
                    }}>データを読み込み中...</Text>
                </View>
            :   <View style={{ alignItems: 'center', marginBottom: responsiveHeight(2) }}>
                    <View
                        style={{
                            width: '100%',
                            backgroundColor: '#fff',
                            borderRadius: 24,
                            paddingVertical: responsiveHeight(0.5),
                            paddingLeft: responsiveWidth(0),
                            paddingRight: responsiveWidth(0),
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.08,
                            shadowRadius: 12,
                            elevation: 4,
                            marginBottom: 0,
                        }}
                    >
                        {renderChart()}
                    </View>
                </View>
            }
        </>
    )
}

export default ExerciseGraph
