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
    monthly_exercise?: Array<{
        day: string
        exercise_quantity: number
    }>
    hourly_steps?: Array<{
        time: string
        timeValue: number
        steps: number
        totalSteps: number
        timestamp: string
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
    // 日別歩数データ取得メソッド（2時間ごと13本のデータ）
    const getDailyStepsData = () => {
        console.log('🕒 ExerciseGraph: getDailyStepsData呼び出し', {
            userData: !!userData,
            hourly_steps: userData?.hourly_steps,
            hourly_steps_length: userData?.hourly_steps ? userData.hourly_steps.length : 0,
        })

        if (userData?.hourly_steps && userData.hourly_steps.length > 0) {
            // 現在の時刻を取得
            const now = new Date()
            const currentHour = now.getHours()

            console.log('🕒 現在時刻:', {
                currentHour,
                currentTime: now.toLocaleTimeString(),
            })

            // APIから取得した時間別データを2時間ごとにグループ化
            const hourlyData = new Array(13).fill(0) // 0,2,4,6,8,10,12,14,16,18,20,22,24の13区間

            console.log('🕒 ExerciseGraph: 時間別データを処理開始', userData.hourly_steps)

            userData.hourly_steps.forEach((item, index) => {
                // timeValueを使ってインデックスを計算（timeValue は 0,2,4,6,8,10,12,14,16,18,20,22）
                const hourIndex = item.timeValue / 2 // 2時間ごとの区間に変換 (0,1,2,3,4,5,6,7,8,9,10,11)

                // 現在時刻より早いデータのみ処理する
                if (item.timeValue <= currentHour) {
                    console.log(
                        `🕒 ExerciseGraph: アイテム${index}: timeValue=${item.timeValue}, steps=${item.steps}, hourIndex=${hourIndex} (現在時刻より早い)`
                    )
                    if (hourIndex >= 0 && hourIndex < 12) {
                        // 0-11のインデックス（12区間）
                        hourlyData[hourIndex] = item.steps // 各区間の歩数
                    }
                } else {
                    console.log(
                        `🕒 ExerciseGraph: アイテム${index}: timeValue=${item.timeValue}, steps=${item.steps} (現在時刻より未来なのでスキップ)`
                    )
                }
            })

            // 24時の区間（インデックス12）は通常0なので、そのまま0で良い

            console.log('🕒 時間別歩数データ使用（現在時刻フィルタ適用後）:', hourlyData)
            return hourlyData
        } else {
            // ダミーデータ（朝少なめ→昼多め→夜減少の現実的な推移）
            console.log('🕒 ダミー時間別歩数データ使用')
            return [200, 300, 400, 700, 1000, 1100, 1200, 1100, 900, 600, 400, 200, 100]
        }
    }

    // 週別歩数データ取得メソッド
    const getWeeklyStepsData = () => {
        if (userData?.recent_exercise && userData.recent_exercise.length > 0) {
            console.log('✅ ExerciseGraph: 実データを使用してweeklyStepsを生成')
            console.log('🔥 週歩数API データ:', userData.recent_exercise)
            
            // 曜日別にデータを整理（月曜=0, 火曜=1, ..., 日曜=6）
            const weeklySteps = new Array(7).fill(0) // [月, 火, 水, 木, 金, 土, 日]
            
            userData.recent_exercise.forEach((exercise, index) => {
                console.log(`🎯 処理中のデータ${index}: "${exercise.day}", 歩数=${exercise.exercise_quantity}`)
                
                // タイムゾーンの影響を避けるため UTC 基準で日付を解析
                const date = new Date(exercise.day)
                const dayOfWeek = (date.getUTCDay() + 6) % 7 // UTC基準で日曜=0を月曜=0に変換
                
                console.log(`📅 日付解析: ${exercise.day}`)
                console.log(`  - UTC曜日: ${date.getUTCDay()} (${['日','月','火','水','木','金','土'][date.getUTCDay()]})`)
                console.log(`  - 配列インデックス: ${dayOfWeek} (${['月','火','水','木','金','土','日'][dayOfWeek]}曜日)`)
                console.log(`  - 配置する歩数: ${exercise.exercise_quantity}`)
                
                if (dayOfWeek >= 0 && dayOfWeek < 7) {
                    weeklySteps[dayOfWeek] = exercise.exercise_quantity
                    console.log(`✅ 配置完了: weeklySteps[${dayOfWeek}] = ${exercise.exercise_quantity}`)
                    
                    // 日曜日の特別チェック
                    if (dayOfWeek === 6) {
                        console.log(`🌟 日曜日データ: ${exercise.exercise_quantity}歩 (期待値: 2225歩)`)
                        console.log(`🌟 正しいか: ${exercise.exercise_quantity === 2225 ? '✅' : '❌'}`)
                    }
                }
            })
            
            console.log('🎯 最終結果:', weeklySteps)
            console.log('📊 各曜日:')
            weeklySteps.forEach((steps, i) => {
                const dayName = ['月','火','水','木','金','土','日'][i]
                console.log(`  ${dayName}: ${steps}歩`)
            })
            
            return weeklySteps
        } else {
            console.log('❌ 実データなし - ダミーデータ使用')
            // ダミーデータ（月〜日の7日分）
            return [3200, 4100, 2900, 5800, 4700, 3600, userData?.today.steps || 5000]
        }
    }

    // 月別歩数データ取得メソッド
    const getMonthlyStepsData = () => {
        console.log('📊 ExerciseGraph: getMonthlyStepsData開始')
        console.log('📊 ExerciseGraph: userDataの存在チェック:', !!userData)
        
        if (!userData?.monthly_exercise) {
            console.log('⚠️ ExerciseGraph: monthly_exerciseデータが存在しません、ダミーデータを使用')
            // ダミーデータ（31日分）、10000歩以下に制限
            const rawData = [
                3200, 4100, 2900, 5800, 4700, 3600, 5000, 4200, 3900, 5100, 4800, 3700, 5300, 4400, 4100, 5500, 4600, 3800,
                5700, 4900, 4000, 5900, 4300, 4100, 6100, 4200, 4300, 9300, 4400, 4500, 3800,
            ]
            return rawData.map((steps) => Math.min(steps, 10000))
        }

        console.log('📊 ExerciseGraph: monthly_exerciseデータが存在', {
            monthly_exercise_length: userData.monthly_exercise.length,
            first_item: userData.monthly_exercise[0]
        })

        // 31日分の空データを用意
        const monthlySteps = new Array(31).fill(0)
        
        // APIデータをマッピング
        userData.monthly_exercise.forEach((exercise, index) => {
            const exerciseDate = new Date(exercise.day)
            const day = exerciseDate.getUTCDate() // UTCベースで日付取得（タイムゾーン問題を回避）
            
            console.log(`🔍 月別データマッピング[${index}]:`, {
                original_day: exercise.day,
                parsed_date: exerciseDate.toISOString(),
                day_number: day,
                exercise_quantity: exercise.exercise_quantity,
                array_index: day - 1,
                will_be_placed_at_position: day - 1
            })
            
            if (day >= 1 && day <= 31) {
                const steps = typeof exercise.exercise_quantity === 'string' 
                    ? parseInt(exercise.exercise_quantity) || 0
                    : exercise.exercise_quantity || 0
                monthlySteps[day - 1] = Math.min(steps, 10000) // 10000歩上限
                
                console.log(`✅ データ配置完了: ${exercise.day} (${day}日目) → 配列位置[${day-1}] = ${monthlySteps[day-1]}歩`)
            } else {
                console.log(`❌ 無効な日付: ${exercise.day} → day=${day}`)
            }
        })

        console.log('📊 最終的な月別データ配列（最初の10日分）:', monthlySteps.slice(0, 10))
        console.log('📊 最終的な月別データ配列（最後の10日分）:', monthlySteps.slice(-10))

        console.log('📊 ExerciseGraph: getMonthlyStepsData完了', {
            result_length: monthlySteps.length,
            total_steps: monthlySteps.reduce((sum, steps) => sum + steps, 0),
            first_5_days: monthlySteps.slice(0, 5)
        })

        return monthlySteps
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
        console.log('📊 ExerciseGraph: getDisplaySteps呼び出し', {
            period,
            stepsDataLength: stepsData.length,
            stepsData: stepsData,
            userData_exists: !!userData,
            hourly_steps_exists: !!userData?.hourly_steps,
        })

        if (period === '週' || period === '月') {
            if (stepsData.length === 0) return 0
            // 平均歩数
            const average = Math.round(stepsData.reduce((sum, steps) => sum + steps, 0) / stepsData.length)
            console.log('📊 ExerciseGraph: 平均計算結果', { period, average, stepsData })
            return average
        } else {
            // 合計歩数
            const total = stepsData.reduce((sum, steps) => sum + steps, 0)
            console.log('📊 ExerciseGraph: 合計計算結果', { period, total, stepsData })
            return total
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
                // 1,8,15,22,29日だけ表示し、それ以外は空文字（31日分）
                const len = 31 // 月別は常に31日分表示
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

        // 折れ線グラフ用に現在時刻までのデータを制限
        let chartData = barData
        let chartLabels = labels

        if (chartType === 'line') {
            const now = new Date()
            const currentHour = now.getHours()
            // 現在時刻の2時間区間を計算（例：14時なら7番目の区間）
            const currentIndex = Math.floor(currentHour / 2) + 1 // +1は現在の区間も含める

            console.log('📈 折れ線グラフ: 現在時刻によるデータ制限', {
                currentHour,
                currentIndex,
                originalDataLength: barData.length,
                originalData: barData,
            })

            // 現在時刻までのデータのみを使用
            chartData = barData.slice(0, currentIndex)
            chartLabels = labels.slice(0, currentIndex)

            console.log('📈 折れ線グラフ: 制限後のデータ', {
                chartDataLength: chartData.length,
                chartData,
                chartLabels,
            })
        }

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
                        data={chartData}
                        labels={chartLabels}
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
            <View
                style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    marginBottom: responsiveHeight(1),
                    paddingHorizontal: responsiveWidth(2),
                }}
            >
                <View style={{ flex: 1 }}>
                    <Text
                        style={{
                            fontSize: responsiveFontSize(2),
                            color: '#666',
                            marginBottom: responsiveHeight(0.5),
                        }}
                    >
                        {period === '週' || period === '月' ? '平均' : '合計'}
                    </Text>
                    {isLoading ?
                        <Text
                            style={{
                                fontSize: responsiveFontSize(3),
                                fontWeight: 'bold',
                                color: '#333',
                            }}
                        >
                            読込中...
                        </Text>
                    :   <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                            <Text
                                style={{
                                    fontSize: responsiveFontSize(3.5),
                                    fontWeight: 'bold',
                                    color: '#333',
                                }}
                            >
                                {getDisplaySteps().toLocaleString()}
                            </Text>
                            <Text
                                style={{
                                    fontSize: responsiveFontSize(2),
                                    color: '#666',
                                    marginLeft: responsiveWidth(1),
                                }}
                            >
                                歩
                            </Text>
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
                <View
                    style={{
                        height: responsiveHeight(25),
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#f5f5f5',
                        borderRadius: 24,
                        marginBottom: responsiveHeight(2),
                    }}
                >
                    <Text
                        style={{
                            fontSize: responsiveFontSize(2),
                            color: '#666',
                        }}
                    >
                        データを読み込み中...
                    </Text>
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
