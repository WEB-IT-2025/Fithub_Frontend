import React, { useCallback, useEffect, useRef, useState } from 'react'

import AsyncStorage from '@react-native-async-storage/async-storage'
import { Animated, Image, Platform, Text, TouchableOpacity, View } from 'react-native'
import { BarChart, LineChart } from 'react-native-chart-kit'
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import styles from './style/profile.styles'

// ストレージキー
const STORAGE_KEYS = {
    SESSION_TOKEN: 'session_token',
    USER_ID: 'user_id',
}

// API設定
const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || 'http://10.200.4.2:3000').replace(/\/+$/, '')

// プロフィール画面で使用するデータの型定義
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
    recent_contributions?: Array<{
        day: string
        count: string
    }>
}

interface User {
    user_id: string
    user_name: string
    user_icon: string | null
    email: string | null
}

interface ProfileProps {
    userName?: string
    userData?: UserData | null
    onClose?: () => void
}

const contributions = [2, 0, 4, 3, 2, 4, 3] // 0〜4の値のみ使うようにしてください

// コントリビューションの色分け（0, 1-4, 5-9, 10-14, 15-19, 20+）
const contributionColors = [
    '#EFEFF4', // 0
    '#ACEEBB', // 1-4
    '#4BC16B', // 5-9
    '#2BA44E', // 10-14
    '#136229', // 15-19
    '#0B3D1B', // 20+
]

const Profile = ({ userName, userData: externalUserData, onClose }: ProfileProps) => {
    const insets = useSafeAreaInsets()
    const [isSafeAreaReady, setIsSafeAreaReady] = useState(false)
    const [period, setPeriod] = useState<'日' | '週' | '月'>('週')
    const [toggleWidth, setToggleWidth] = useState(0)
    const [userData, setUserData] = useState<UserData | null>(externalUserData || null)
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const sliderAnim = useRef(new Animated.Value(0)).current
    const healthAnim = useRef(new Animated.Value(0)).current
    const sizeAnim = useRef(new Animated.Value(0)).current
    const ageAnim = useRef(new Animated.Value(0)).current

    // APIからユーザーデータを取得する関数
    const fetchUserData = useCallback(async () => {
        try {
            setIsLoading(true)

            // AsyncStorageからトークンを取得
            const token = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_TOKEN)
            if (!token) {
                console.log('Profile: トークンがありません')
                return
            }

            console.log('📊 Profile: データ取得開始')

            // ユーザーデータを取得
            const userResponse = await fetch(`${API_BASE_URL}/api/data/user`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            })

            // ユーザーデータの処理
            if (userResponse.ok) {
                const userData = await userResponse.json()
                console.log('✅ Profile: ユーザーデータ取得成功', userData)

                if (userData.success && userData.data) {
                    setUserData(userData.data)

                    // ユーザー基本情報も設定
                    if (userData.data.user_name || userData.data.user_id) {
                        setUser({
                            user_id: userData.data.user_id,
                            user_name: userData.data.user_name || 'Unknown User',
                            user_icon: userData.data.user_icon || null,
                            email: userData.data.email || null,
                        })
                    }
                }
            } else {
                console.log('❌ Profile: ユーザーデータ取得失敗', userResponse.status)
            }
        } catch (error) {
            console.error('❌ Profile: データ取得エラー:', error)
        } finally {
            setIsLoading(false)
        }
    }, [setIsLoading, setUserData, setUser])

    // SafeAreaInsetsが確実に取得できるまで待つ
    useEffect(() => {
        // iOSの場合はinsets.topが20以上、Androidの場合は0以上であることを確認
        const isInsetsReady = Platform.OS === 'ios' ? insets.top >= 20 : insets.top >= 0

        if (isInsetsReady) {
            // 少し遅延してから表示（SafeAreaが確実に適用されるまで）
            const timer = setTimeout(() => {
                setIsSafeAreaReady(true)
            }, 300)
            return () => clearTimeout(timer)
        }
    }, [insets])

    // コンポーネントマウント時にデータを取得
    useEffect(() => {
        if (!externalUserData) {
            fetchUserData()
        }
    }, [externalUserData, fetchUserData])

    // 外部データが更新された場合に内部状態を更新
    useEffect(() => {
        if (externalUserData) {
            setUserData(externalUserData)
        }
    }, [externalUserData])

    // スライダーアニメーション
    useEffect(() => {
        const sliderMargin = responsiveWidth(1.5)
        const sliderCount = 3
        const sliderWidth = toggleWidth > 0 ? (toggleWidth - sliderMargin * 2) / sliderCount : 0

        const getLeft = (p: '日' | '週' | '月') => {
            if (toggleWidth === 0) return sliderMargin
            if (p === '日') return sliderMargin
            if (p === '週') return sliderMargin + sliderWidth
            return sliderMargin + sliderWidth * 2
        }

        Animated.timing(sliderAnim, {
            toValue: getLeft(period),
            duration: 200,
            useNativeDriver: false,
        }).start()
    }, [period, toggleWidth, sliderAnim])

    // ペットパラメータアニメーション
    useEffect(() => {
        const paramValues = {
            health: 0.9,
            size: 0.5,
            age: 0.3,
        }

        // アニメーションをリセットしてから開始
        healthAnim.setValue(0)
        sizeAnim.setValue(0)
        ageAnim.setValue(0)

        // すべて同じ秒数（例: 800ms）でアニメーション
        Animated.timing(healthAnim, {
            toValue: paramValues.health,
            duration: 800,
            useNativeDriver: false,
        }).start()
        Animated.timing(sizeAnim, {
            toValue: paramValues.size,
            duration: 800,
            useNativeDriver: false,
        }).start()
        Animated.timing(ageAnim, {
            toValue: paramValues.age,
            duration: 800,
            useNativeDriver: false,
        }).start()
    }, [healthAnim, sizeAnim, ageAnim])

    // コントリビューションデータ取得メソッド
    const getContributionsData = () => {
        if (userData?.recent_contributions && userData.recent_contributions.length > 0) {
            const weeklyContributions = new Array(7).fill(0)
            userData.recent_contributions.forEach((contribution) => {
                const date = new Date(contribution.day)
                const dayOfWeek = (date.getDay() + 6) % 7
                const count = parseInt(contribution.count, 10)
                weeklyContributions[dayOfWeek] = count
            })
            return weeklyContributions
        } else {
            return [2, 0, 7, 12, 17, 22, 4] // ダミー値も段階に合わせて
        }
    }

    // 日別歩数データ取得メソッド
    // 日別歩数データ取得メソッド（2時間ごと12本のダミーデータ）
    const getDailyStepsData = () => {
        // 実データがあれば分割して返す（例: userData.today.stepsを13分割）
        if (userData && typeof userData.today.steps === 'number') {
            const steps = userData.today.steps
            // 朝少なめ、昼〜夕方ピーク、夜減少の現実的な配分
            const pattern = [0.04, 0.05, 0.06, 0.09, 0.12, 0.13, 0.13, 0.12, 0.09, 0.07, 0.05, 0.03, 0.02]
            return pattern.map((ratio) => Math.round(steps * ratio))
        }
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
        // 一時的にAPIデータを使わず、常にダミーデータ（30日分）を返す
        return [
            3200, 4100, 2900, 5800, 4700, 3600, 5000, 4200, 3900, 5100, 4800, 3700, 5300, 4400, 4100, 5500, 4600, 3800,
            5700, 4900, 4000, 5900, 4300, 4100, 6100, 4200, 4300, 6300, 4400, 4500,
        ]
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

    // 共通チャート設定取得メソッド
    const getCommonChartConfig = () => ({
        backgroundColor: '#fff',
        backgroundGradientFrom: '#fff',
        backgroundGradientTo: '#fff',
        decimalPlaces: 0,
        labelColor: (opacity = 1) => `rgba(102, 102, 102, ${opacity})`,
        style: {
            borderRadius: 16,
        },
        propsForBackgroundLines: {
            stroke: '#E0E0E0',
            strokeDasharray: '',
        },
    })

    // 日別グラフレンダリングメソッド（ハイブリッド: 棒＋折れ線）
    const renderDailyChart = () => {
        const barData = getDailyStepsData()
        // 累積値を作成
        const lineData = barData.reduce<number[]>((acc, cur, i) => {
            acc.push((acc[i - 1] || 0) + cur)
            return acc
        }, [])
        const labels = getChartLabels()
        const chartWidth = responsiveWidth(95)
        const chartHeight = responsiveHeight(20)
        return (
            <View style={{ width: chartWidth, height: chartHeight }}>
                {/* 棒グラフ（BarChart）: 通常配置で下に表示 */}
                <BarChart
                    data={{
                        labels,
                        datasets: [
                            {
                                data: barData,
                                color: () => '#2BA44E',
                            },
                        ],
                    }}
                    width={chartWidth}
                    height={chartHeight}
                    yAxisLabel=''
                    yAxisSuffix=''
                    yAxisInterval={1}
                    chartConfig={{
                        ...getCommonChartConfig(),
                        color: () => '#2BA44E',
                        fillShadowGradient: '#2BA44E',
                        fillShadowGradientOpacity: 1,
                        fillShadowGradientFrom: '#2BA44E',
                        fillShadowGradientFromOpacity: 1,
                        fillShadowGradientTo: '#2BA44E',
                        fillShadowGradientToOpacity: 1,
                        barPercentage: 0.7,
                    }}
                    style={{
                        borderRadius: 16,
                        // position: 'absolute',
                        // left: 0,
                        // top: 0,
                    }}
                    fromZero
                    showBarTops={true}
                    withInnerLines={true}
                />
                {/* 折れ線グラフ（LineChart, 累積値）: 上に重ねる */}
                <LineChart
                    data={{
                        labels,
                        datasets: [
                            {
                                data: lineData,
                                color: () => '#4BC16B',
                                strokeWidth: 3,
                            },
                        ],
                    }}
                    width={chartWidth}
                    height={chartHeight}
                    yAxisLabel=''
                    yAxisSuffix=''
                    yAxisInterval={1}
                    chartConfig={{
                        ...getCommonChartConfig(),
                        color: (opacity = 1) => `rgba(44, 130, 77, ${opacity})`,
                        propsForDots: {
                            r: '5',
                            strokeWidth: '2',
                            stroke: '#fff',
                        },
                    }}
                    bezier
                    style={{
                        borderRadius: 16,
                        position: 'absolute',
                        left: 0,
                        top: 0,
                    }}
                    fromZero
                />
            </View>
        )
    }

    // 週別グラフレンダリングメソッド
    const renderWeeklyChart = () => (
        <BarChart
            yAxisLabel=''
            data={{
                labels: getChartLabels(),
                datasets: [
                    {
                        data: getWeeklyStepsData(),
                        color: () => '#2BA44E',
                    },
                ],
            }}
            width={responsiveWidth(90)}
            height={responsiveHeight(20)}
            yAxisSuffix=''
            yAxisInterval={1}
            chartConfig={{
                ...getCommonChartConfig(),
                color: () => '#2BA44E',
                fillShadowGradient: '#2BA44E',
                fillShadowGradientOpacity: 1,
                fillShadowGradientFrom: '#2BA44E',
                fillShadowGradientFromOpacity: 1,
                fillShadowGradientTo: '#2BA44E',
                fillShadowGradientToOpacity: 1,
                barPercentage: 0.7,
            }}
            style={{
                borderRadius: 16,
            }}
            fromZero
            showBarTops={true}
            withInnerLines={true}
        />
    )

    // 月別グラフレンダリングメソッド
    const renderMonthlyChart = () => (
        <BarChart
            yAxisLabel=''
            data={{
                labels: getChartLabels(),
                datasets: [
                    {
                        data: getMonthlyStepsData(),
                        color: () => '#2BA44E',
                    },
                ],
            }}
            width={responsiveWidth(90)}
            height={responsiveHeight(20)}
            yAxisSuffix=''
            yAxisInterval={1}
            chartConfig={{
                ...getCommonChartConfig(),
                color: () => '#2BA44E',
                fillShadowGradient: '#2BA44E',
                fillShadowGradientOpacity: 1,
                fillShadowGradientFrom: '#2BA44E',
                fillShadowGradientFromOpacity: 1,
                fillShadowGradientTo: '#2BA44E',
                fillShadowGradientToOpacity: 1,
                barPercentage: 0.1, // 月別は棒をより細く
            }}
            style={{
                borderRadius: 16,
            }}
            fromZero
            showBarTops={true}
            withInnerLines={true}
        />
    )

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

    // SafeAreaInsetsが準備できるまでローディング表示
    if (!isSafeAreaReady) {
        return <View style={{ flex: 1, backgroundColor: '#fff' }} />
    }

    // レスポンシブなスライダーマージン
    const sliderMargin = responsiveWidth(1.5) // 6px -> レスポンシブ
    const sliderCount = 3
    const sliderWidth = toggleWidth > 0 ? (toggleWidth - sliderMargin * 2) / sliderCount : 0

    return (
        // SafeAreaInsetsが準備できるまでローディング表示
        <View style={[styles.container, { paddingTop: responsiveHeight(0.5) }]}>
            {/* タイトル */}
            <Text style={styles.title}>プロフィール</Text>
            <View style={styles.underline} />
            {/* ユーザー名 */}
            <Text style={styles.userName}>{user?.user_name || userName || 'Nguyen Duc Huynh'}</Text>

            {/* コントリビューション（週のみ） */}
            <Text style={styles.sectionLabel}>今週のコントリビューション</Text>
            <View style={styles.contributionBoard}>
                <View style={styles.contributionRow}>
                    {getContributionsData().map((count, idx) => {
                        // 0:0, 1:1-4, 2:5-9, 3:10-14, 4:15-19, 5:20+
                        let colorIdx = 0
                        if (count >= 20) colorIdx = 5
                        else if (count >= 15) colorIdx = 4
                        else if (count >= 10) colorIdx = 3
                        else if (count >= 5) colorIdx = 2
                        else if (count >= 1) colorIdx = 1
                        // 0はcolorIdx=0
                        return (
                            <View
                                key={idx}
                                style={[styles.contributionBox, { backgroundColor: contributionColors[colorIdx] }]}
                            />
                        )
                    })}
                </View>
            </View>
            <View style={styles.Spacer} />
            {/* ペットのパラメータ */}
            <Text style={styles.sectionLabel}>ペットのパラメータ</Text>
            <View style={styles.petParamRow}>
                {/* ペット画像 */}
                <View style={styles.petParamImageWrapper}>
                    <Image
                        source={require('@/assets/images/gifcat.gif')}
                        style={styles.petParamImage}
                        resizeMode='cover'
                    />
                </View>
                {/* 名前＋インジケーター3本（縦並び） */}
                <View
                    style={styles.petParamInfo}
                    collapsable={false}
                >
                    <Text style={styles.petParamName}>とりゃー</Text>
                    <View
                        style={styles.indicatorColumn}
                        collapsable={false}
                    >
                        <View
                            style={styles.indicatorRow}
                            collapsable={false}
                        >
                            <Text style={styles.indicatorLabel}>健康度</Text>
                            <View style={styles.indicator}>
                                <Animated.View
                                    style={{
                                        backgroundColor: '#2BA44E',
                                        height: '100%',
                                        borderRadius: responsiveWidth(1.25), // 5px -> レスポンシブ
                                        width: healthAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: ['0%', '100%'],
                                        }),
                                    }}
                                />
                            </View>
                        </View>
                        <View
                            style={styles.indicatorRow}
                            collapsable={false}
                        >
                            <Text style={styles.indicatorLabel}>サイズ</Text>
                            <View style={styles.indicator}>
                                <Animated.View
                                    style={{
                                        backgroundColor: '#2BA44E',
                                        height: '100%',
                                        borderRadius: responsiveWidth(1.25), // 5px -> レスポンシブ
                                        width: sizeAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: ['0%', '100%'],
                                        }),
                                    }}
                                />
                            </View>
                        </View>
                        <View
                            style={[styles.indicatorRow, { marginBottom: 0 }]}
                            collapsable={false}
                        >
                            <Text style={styles.indicatorLabel}>年齢</Text>
                            <View style={styles.indicator}>
                                <Animated.View
                                    style={{
                                        backgroundColor: '#2BA44E',
                                        height: '100%',
                                        borderRadius: responsiveWidth(1.25), // 5px -> レスポンシブ
                                        width: ageAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: ['0%', '100%'],
                                        }),
                                    }}
                                />
                            </View>
                        </View>
                    </View>
                </View>
            </View>
            <View style={styles.Spacer} />
            {/* ユーザーの運動グラフ */}
            <Text style={styles.sectionLabel}>ユーザーの運動グラフ</Text>

            {/* トグルボタン */}
            <View style={styles.toggleContainer}>
                <View
                    style={styles.toggleBackground}
                    onLayout={(e) => setToggleWidth(e.nativeEvent.layout.width)}
                >
                    <Animated.View
                        style={[
                            styles.toggleSlider,
                            {
                                left: sliderAnim,
                                width: sliderWidth || '33.3%',
                            },
                        ]}
                    />
                    {['日', '週', '月'].map((label) => (
                        <TouchableOpacity
                            key={label}
                            style={styles.toggleTouchable}
                            onPress={() => setPeriod(label as '日' | '週' | '月')}
                            activeOpacity={1}
                        >
                            <Text style={[styles.toggleText, period === label && styles.activeToggleText]}>
                                {label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* 合計・歩数 or 平均・歩数 */}
            <View style={styles.totalRow}>
                <View>
                    <Text style={styles.totalLabel}>{period === '週' || period === '月' ? '平均' : '合計'}</Text>
                    <Text style={styles.totalValue}>
                        {isLoading ?
                            <Text style={styles.totalNumber}>読込中...</Text>
                        :   <>
                                <Text style={styles.totalNumber}>{getDisplaySteps().toLocaleString()}</Text>
                                <Text style={styles.totalUnit}>歩</Text>
                            </>
                        }
                    </Text>
                </View>
            </View>

            {/* グラフ表示 */}
            {isLoading ?
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>データを読み込み中...</Text>
                </View>
            :   <View style={{ alignItems: 'center', marginBottom: responsiveHeight(6) }}>
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

            {/* 左下のプロフィールを閉じるボタン */}
            <TouchableOpacity
                style={{
                    position: 'absolute',
                    left: 16,
                    bottom: '1%',
                    backgroundColor: '#b2d8b2',
                    width: 64,
                    height: 48,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                    // ミッションボードと同じ
                }}
                onPress={() => {
                    if (typeof onClose === 'function') {
                        onClose()
                    }
                }}
                activeOpacity={0.8}
            >
                <Text
                    style={{
                        color: '#388e3c',
                        fontSize: 32,
                        fontWeight: 'bold',
                        textAlign: 'center',
                    }}
                >
                    ✕
                </Text>
            </TouchableOpacity>
        </View>
    )
}

export default Profile
