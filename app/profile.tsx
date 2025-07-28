import React, { useCallback, useEffect, useRef, useState } from 'react'

import AsyncStorage from '@react-native-async-storage/async-storage'
import { Animated, Image, Platform, Text, TouchableOpacity, View } from 'react-native'
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Circle, Path } from 'react-native-svg'

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
}

const contributions = [2, 0, 4, 3, 2, 4, 3] // 0〜4の値のみ使うようにしてください

// コントリビューションの色分け
const contributionColors = [
    '#EFEFF4', // 0
    '#ACEEBB', // 1
    '#4BC16B', // 2
    '#2BA44E', // 3
    '#136229', // 4
]

const Profile = ({ userName, userData: externalUserData }: ProfileProps) => {
    const insets = useSafeAreaInsets()
    const [isSafeAreaReady, setIsSafeAreaReady] = useState(false)
    const [period, setPeriod] = useState<'日' | '週' | '月'>('日')
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

    // SafeAreaInsetsが準備できるまでローディング表示
    if (!isSafeAreaReady) {
        return <View style={{ flex: 1, backgroundColor: '#fff' }} />
    }

    // コントリビューションデータを取得する関数
    const getContributionsData = () => {
        if (period === '日') {
            // 日表示：今日のコントリビューション
            return userData?.today.contributions ? [userData.today.contributions] : [0]
        } else if (period === '週') {
            // 週表示：曜日別コントリビューション（月〜日）
            if (userData?.recent_contributions && userData.recent_contributions.length > 0) {
                const weeklyContributions = new Array(7).fill(0) // [月, 火, 水, 木, 金, 土, 日]

                userData.recent_contributions.forEach((contribution) => {
                    const date = new Date(contribution.day)
                    const dayOfWeek = (date.getDay() + 6) % 7 // 日曜=0を月曜=0に変換
                    const count = parseInt(contribution.count, 10)
                    weeklyContributions[dayOfWeek] = Math.min(Math.max(count, 0), 4) // 0-4の範囲にクランプ
                })

                return weeklyContributions
            } else {
                // デフォルトデータ（曜日別）
                return [2, 0, 4, 3, 2, 4, 3]
            }
        } else {
            // 月表示：APIから取得した実際のコントリビューションデータのみ
            if (userData?.recent_contributions && userData.recent_contributions.length > 0) {
                const sortedContributions = [...userData.recent_contributions].sort(
                    (a, b) => new Date(a.day).getTime() - new Date(b.day).getTime()
                )

                // APIから取得した実際のデータのみを使用（補完しない）
                return sortedContributions.map((day) => {
                    const count = parseInt(day.count, 10)
                    return Math.min(Math.max(count, 0), 4) // 0-4の範囲にクランプ
                })
            } else {
                // APIデータがない場合は空配列
                return []
            }
        }
    }

    // 歩数データを期間別に取得する関数（過去データ含む）
    const getStepsData = () => {
        switch (period) {
            case '日':
                return userData ? [userData.today.steps] : [5000]

            case '週':
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

            case '月':
                if (userData?.recent_exercise && userData.recent_exercise.length > 0) {
                    // recent_exerciseを日付順にソート（古い順から新しい順）
                    const sortedExercise = [...userData.recent_exercise].sort(
                        (a, b) => new Date(a.day).getTime() - new Date(b.day).getTime()
                    )

                    // 実際に取得できたデータのみを使用
                    return sortedExercise.map((day) => day.exercise_quantity)
                } else {
                    // データがない場合は空配列
                    return []
                }

            default:
                return userData ? [userData.today.steps] : [5000]
        }
    }

    // 合計歩数を計算する関数
    const getTotalSteps = () => {
        const stepsData = getStepsData()
        return stepsData.reduce((sum, steps) => sum + steps, 0)
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

            {/* コントリビューション */}
            <Text style={styles.sectionLabel}>
                {period === '日' ?
                    '今日のコントリビューション'
                : period === '週' ?
                    '今週のコントリビューション'
                :   '今月のコントリビューション'}
            </Text>
            {/* コントリビューションデータ */}
            <View style={[styles.contributionBoard, period === '月' && { maxWidth: '100%', flexWrap: 'wrap' }]}>
                <View style={[styles.contributionRow, period === '月' && { flexWrap: 'wrap', maxWidth: '100%' }]}>
                    {getContributionsData().map((count, idx) => (
                        <View
                            key={idx}
                            style={[
                                styles.contributionBox,
                                { backgroundColor: contributionColors[Math.max(0, Math.min(count, 4))] },
                                period === '月' && {
                                    width: responsiveWidth(6),
                                    height: responsiveWidth(6),
                                    margin: responsiveWidth(0.3),
                                },
                            ]}
                        />
                    ))}
                </View>
            </View>
            <View style={styles.Spacer} />
            {/* ペットのパラメータ */}
            <Text style={styles.sectionLabel}>ペットのパラメータ</Text>
            <View style={styles.petParamRow}>
                {/* ペット画像 */}
                <View style={styles.petParamImageWrapper}>
                    <Image
                        source={require('@/assets/images/cat1.png')}
                        style={styles.petParamImage}
                        resizeMode='cover'
                    />
                </View>
                {/* 名前＋インジケーター3本（縦並び） */}
                <View
                    style={styles.petParamInfo}
                    collapsable={false}
                >
                    <Text style={styles.petParamName}>くろた</Text>
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

            {/* 合計・歩数 */}
            <View style={styles.totalRow}>
                <View>
                    <Text style={styles.totalLabel}>合計</Text>
                    <Text style={styles.totalValue}>
                        {isLoading ?
                            <Text style={styles.totalNumber}>読込中...</Text>
                        :   <>
                                <Text style={styles.totalNumber}>{getTotalSteps().toLocaleString()}</Text>
                                <Text style={styles.totalUnit}>歩</Text>
                            </>
                        }
                    </Text>
                </View>
            </View>

            {/* SVGベースの滑らかな折れ線グラフ */}
            {isLoading ?
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>データを読み込み中...</Text>
                </View>
            :   <View style={styles.chartContainer}>
                    <View style={styles.chartArea}>
                        {/* Y軸のラベル（左側） */}
                        <View style={styles.yAxisLabels}>
                            {(() => {
                                const stepsData = getStepsData()
                                const maxSteps = Math.max(...stepsData, 1)
                                const labels = [
                                    maxSteps,
                                    Math.round(maxSteps * 0.75),
                                    Math.round(maxSteps * 0.5),
                                    Math.round(maxSteps * 0.25),
                                    0,
                                ]
                                return labels.map((value, index) => (
                                    <Text
                                        key={index}
                                        style={styles.yAxisLabel}
                                    >
                                        {value >= 1000 ? `${Math.round(value / 100) / 10}k` : value.toString()}
                                    </Text>
                                ))
                            })()}
                        </View>

                        {/* グリッド線（背景） */}
                        <View style={styles.gridLines}>
                            {[0, 0.25, 0.5, 0.75, 1.0].map((ratio, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.gridLine,
                                        {
                                            bottom: ratio * responsiveHeight(15),
                                        },
                                    ]}
                                />
                            ))}
                        </View>

                        {/* SVGグラフエリア */}
                        <View style={styles.svgContainer}>
                            <Svg
                                width={responsiveWidth(70)}
                                height={responsiveHeight(15)}
                                style={styles.svgGraph}
                            >
                                {(() => {
                                    const stepsData = getStepsData()
                                    const maxSteps = Math.max(...stepsData, 1)
                                    const width = responsiveWidth(70)
                                    const height = responsiveHeight(15)
                                    const padding = 10

                                    // データポイントの座標を計算
                                    const points = stepsData.map((steps, index) => {
                                        const x = padding + (index * (width - 2 * padding)) / (stepsData.length - 1)
                                        const y = height - padding - (steps / maxSteps) * (height - 2 * padding)
                                        return { x, y, steps }
                                    })

                                    // 直線パスを生成
                                    const createStraightPath = (points: any[]) => {
                                        if (points.length < 2) return ''

                                        let path = `M ${points[0].x} ${points[0].y}`

                                        for (let i = 1; i < points.length; i++) {
                                            const currentPoint = points[i]
                                            path += ` L ${currentPoint.x} ${currentPoint.y}`
                                        }

                                        return path
                                    }

                                    const pathData = createStraightPath(points)

                                    return (
                                        <>
                                            {/* 直線の折れ線 */}
                                            <Path
                                                d={pathData}
                                                stroke='#888888'
                                                strokeWidth='3'
                                                fill='none'
                                                strokeLinecap='round'
                                                strokeLinejoin='round'
                                            />

                                            {/* データポイント */}
                                            {points.map((point, index) => (
                                                <Circle
                                                    key={index}
                                                    cx={point.x}
                                                    cy={point.y}
                                                    r='6'
                                                    fill='#888888'
                                                    stroke='#FFF'
                                                    strokeWidth='2'
                                                />
                                            ))}
                                        </>
                                    )
                                })()}
                            </Svg>
                        </View>

                        {/* データポイントの値と日付ラベル */}
                        <View style={styles.dataLabels}>
                            {getStepsData().map((steps, index) => (
                                <View
                                    key={index}
                                    style={styles.labelColumn}
                                >
                                    {/* 歩数値 */}
                                    <Text style={styles.stepValue}>
                                        {steps >= 1000 ? `${Math.round(steps / 100) / 10}k` : steps.toString()}
                                    </Text>

                                    {/* 日付ラベル */}
                                    <Text style={styles.dateLabel}>
                                        {period === '日' ?
                                            '今日'
                                        : period === '週' ?
                                            (() => {
                                                // 固定の曜日表示（月〜日）
                                                const dayNames = ['月', '火', '水', '木', '金', '土', '日']
                                                return dayNames[index] || ''
                                            })()
                                        : index % 5 === 0 ?
                                            `${(() => {
                                                // APIから取得した実際の日付データを使用
                                                if (userData?.recent_exercise && userData.recent_exercise.length > 0) {
                                                    const sortedExercise = [...userData.recent_exercise].sort(
                                                        (a, b) => new Date(a.day).getTime() - new Date(b.day).getTime()
                                                    )
                                                    // 実際のデータ数に基づいて処理
                                                    if (sortedExercise[index]) {
                                                        const date = new Date(sortedExercise[index].day)
                                                        return `${date.getDate()}日`
                                                    }
                                                }
                                                // データがない場合は空文字
                                                return ''
                                            })()}`
                                        :   ''}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            }
        </View>
    )
}

export default Profile
