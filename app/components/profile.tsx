import React, { useEffect, useRef, useState } from 'react'

import { useRouter } from 'expo-router'

import AsyncStorage from '@react-native-async-storage/async-storage'
import { Animated, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions'
import Svg, { Circle, Path } from 'react-native-svg'

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
    const [period, setPeriod] = useState<'日' | '週' | '月'>('日')
    const [toggleWidth, setToggleWidth] = useState(0)
    const [userData, setUserData] = useState<UserData | null>(externalUserData || null)
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const sliderAnim = useRef(new Animated.Value(0)).current
    const router = useRouter()

    // コントリビューションデータを取得する関数
    const getContributionsData = () => {
        if (period === '日') {
            // 日表示：今日のコントリビューション
            return userData?.today.contributions ? [userData.today.contributions] : [0]
        } else if (period === '週') {
            // 週表示：曜日別コントリビューション（月〜日）
            if (userData?.recent_contributions && userData.recent_contributions.length > 0) {
                const weeklyContributions = new Array(7).fill(0) // [月, 火, 水, 木, 金, 土, 日]
                
                userData.recent_contributions.forEach(contribution => {
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

    // APIからユーザーデータを取得する関数
    const fetchUserData = async () => {
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
    }

    // コンポーネントマウント時にデータを取得
    useEffect(() => {
        if (!externalUserData) {
            fetchUserData()
        }
    }, [externalUserData])

    // 外部データが更新された場合に内部状態を更新
    useEffect(() => {
        if (externalUserData) {
            setUserData(externalUserData)
        }
    }, [externalUserData])

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

    // スライダー位置を計算
    const getLeft = (p: '日' | '週' | '月') => {
        if (toggleWidth === 0) return sliderMargin
        if (p === '日') return sliderMargin
        if (p === '週') return sliderMargin + sliderWidth
        return sliderMargin + sliderWidth * 2
    }

    useEffect(() => {
        Animated.timing(sliderAnim, {
            toValue: getLeft(period),
            duration: 200,
            useNativeDriver: false,
        }).start()
    }, [period, toggleWidth])

    // 進捗率（0~1）を指定
    const paramValues = {
        health: 0.9,
        size: 0.5,
        age: 0.3,
    }

    // Animated.Valueを用意
    const healthAnim = useRef(new Animated.Value(0)).current
    const sizeAnim = useRef(new Animated.Value(0)).current
    const ageAnim = useRef(new Animated.Value(0)).current

    useEffect(() => {
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
    }, [])

    return (
        <View style={styles.container}>
            {/* タイトル＋右上ボタン */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={styles.title}>プロフィール</Text>
                <TouchableOpacity
                    style={styles.configButton}
                    onPress={() => router.push('/config')}
                >
                    <Text style={styles.configButtonText}>⚙️</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.underline} />
            {/* ユーザー名 */}
            <Text style={styles.userName}>{user?.user_name || userName || 'Nguyen Duc Huynh'}</Text>

            {/* コントリビューション */}
            <Text style={styles.sectionLabel}>
                {period === '日' ? '今日のコントリビューション' : 
                 period === '週' ? '今週のコントリビューション' : 
                 '今月のコントリビューション'}
            </Text>
            {/* コントリビューションデータ */}
            <View style={[
                styles.contributionBoard,
                period === '月' && { maxWidth: '100%', flexWrap: 'wrap' }
            ]}>
                <View style={[
                    styles.contributionRow,
                    period === '月' && { flexWrap: 'wrap', maxWidth: '100%' }
                ]}>
                    {getContributionsData().map((count, idx) => (
                        <View
                            key={idx}
                            style={[
                                styles.contributionBox,
                                { backgroundColor: contributionColors[Math.max(0, Math.min(count, 4))] },
                                period === '月' && { 
                                    width: responsiveWidth(6), 
                                    height: responsiveWidth(6),
                                    margin: responsiveWidth(0.3)
                                }
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
                        source={require('@/assets/images/moukona.jpeg')}
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

const styles = StyleSheet.create({
    configButton: {
        padding: 8,
        marginRight: 2,
    },
    configButtonText: {
        fontSize: 24,
    },
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        borderRadius: responsiveWidth(5), // 20 -> レスポンシブ
        padding: responsiveWidth(6), // 24 -> レスポンシブ
        paddingTop: Platform.OS === 'ios' ? responsiveHeight(6) : responsiveHeight(0), // iOS用に上部パディング増加
    },
    title: {
        fontSize: Platform.OS === 'android' ? responsiveFontSize(2.8) : responsiveFontSize(3), // Androidで少し小さく
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: responsiveHeight(0.25),
        color: '#388e3c',
    },
    underline: {
        height: responsiveHeight(0.125), // 1 -> レスポンシブ
        backgroundColor: '#ccc',
        width: '150%',
        alignSelf: 'center',
        marginBottom: responsiveHeight(1.25), // 10 -> レスポンシブ
        opacity: 0.5,
    },
    userName: {
        fontSize: Platform.OS === 'android' ? responsiveFontSize(2.1) : responsiveFontSize(2.25), // Androidで少し小さく
        fontWeight: 'bold',
        color: '#000',
        marginBottom: responsiveHeight(1.25),
        textAlign: 'left',
    },
    sectionLabel: {
        fontSize: Platform.OS === 'android' ? responsiveFontSize(1.9) : responsiveFontSize(2), // Androidで少し小さく
        color: '#000',
        fontWeight: 'bold',
        marginBottom: responsiveHeight(1),
        textAlign: 'left',
        alignSelf: 'flex-start',
    },
    contributionBoard: {
        backgroundColor: '#fff',
        borderRadius: responsiveWidth(4),
        paddingVertical: responsiveHeight(1.25),
        paddingHorizontal: responsiveWidth(4),
        marginBottom: responsiveHeight(2),
        alignSelf: 'flex-start',
        // プラットフォーム別シャドウ
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: responsiveHeight(0.75) },
                shadowOpacity: 0.18,
                shadowRadius: responsiveWidth(3),
            },
            android: {
                elevation: 6, // Androidではelevationを少し下げる
            },
        }),
    },
    contributionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    contributionBox: {
        width: responsiveWidth(9), // 36 -> レスポンシブ
        height: responsiveWidth(9), // 36 -> レスポンシブ（正方形を維持）
        borderRadius: responsiveWidth(2), // 8 -> レスポンシブ
        marginLeft: responsiveWidth(1), // 4 -> レスポンシブ
        marginRight: responsiveWidth(1), // 4 -> レスポンシブ
        alignItems: 'center',
        justifyContent: 'center',
    },
    Spacer: {
        height: responsiveHeight(1.5), // 12 -> レスポンシブ
    },
    petParamRow: {
        flexDirection: 'row',
        alignItems: 'stretch',
        marginBottom: responsiveHeight(3), // 24 -> レスポンシブ
        width: '100%',
    },
    petParamImageWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
        height: responsiveHeight(10), // 80 -> レスポンシブ
        marginRight: responsiveWidth(4), // 16 -> レスポンシブ
    },
    petParamImage: {
        width: responsiveWidth(25), // 100 -> レスポンシブ
        height: responsiveWidth(25), // 100 -> レスポンシブ（正方形を維持）
    },
    petParamInfo: {
        flex: 1,
        justifyContent: Platform.OS === 'android' ? 'flex-start' : 'center', // Androidで上寄せ
        height: responsiveHeight(10), // 80 -> レスポンシブ
        ...Platform.select({
            android: {
                paddingVertical: 0,
                marginVertical: 0,
                marginTop: -responsiveHeight(0.5), // Androidで上に少し移動
            },
        }),
    },
    petParamName: {
        fontSize: Platform.OS === 'android' ? responsiveFontSize(2.1) : responsiveFontSize(2.25), // Androidで少し小さく
        fontWeight: 'bold',
        color: '#388e3c',
        marginBottom: responsiveHeight(1.5), // 余白を追加（0 → 0.5）
        textAlign: 'left',
        ...Platform.select({
            android: {
                lineHeight: responsiveFontSize(2.1) * 1.0, // lineHeightをより小さく
                paddingVertical: 0,
                marginTop: 0,
            },
            ios: {
                lineHeight: responsiveFontSize(2.25) * 1.1, // iOSも少し小さく
            },
        }),
    },
    indicatorColumn: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        ...Platform.select({
            android: {
                justifyContent: 'flex-start',
                paddingVertical: 0,
                marginVertical: 0,
            },
            ios: {
                justifyContent: 'flex-start',
            },
        }),
    },
    indicatorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        ...Platform.select({
            android: {
                height: responsiveHeight(2.5), // さらに高さを増やす（2.0 → 2.5）
                marginBottom: responsiveHeight(0.3), // マージンを調整
                margin: 0,
                padding: 0,
            },
            ios: {
                marginBottom: responsiveHeight(0.5),
            },
        }),
    },
    indicatorLabel: {
        fontSize: Platform.OS === 'android' ? responsiveFontSize(1.7) : responsiveFontSize(1.75), // Androidで少し小さく
        color: '#333',
        marginRight: responsiveWidth(2.5),
        minWidth: responsiveWidth(15),
        textAlign: 'right',
    },
    indicator: {
        height: responsiveHeight(1.25),
        borderRadius: responsiveWidth(1.25),
        flex: 1,
        minWidth: 0,
        backgroundColor: '#fff',
        // プラットフォーム別シャドウ
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: responsiveHeight(0.25) },
                shadowOpacity: 0.18,
                shadowRadius: responsiveWidth(1),
            },
            android: {
                elevation: 2, // Androidではelevationを少し下げる
            },
        }),
        overflow: 'visible',
        position: 'relative',
    },
    toggleContainer: {
        alignItems: 'center',
        marginBottom: responsiveHeight(2), // 16 -> レスポンシブ
        width: '100%',
    },
    toggleBackground: {
        width: '100%',
        maxWidth: responsiveWidth(100),
        height: responsiveHeight(5.5),
        backgroundColor: '#fff',
        borderRadius: responsiveHeight(2.75),
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
        // プラットフォーム別シャドウ
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: responsiveHeight(0.25) },
                shadowOpacity: 0.12,
                shadowRadius: responsiveWidth(1.5),
            },
            android: {
                elevation: 3, // Androidではelevationを少し下げる
            },
        }),
    },
    toggleSlider: {
        position: 'absolute',
        top: responsiveHeight(0.5), // 4 -> レスポンシブ
        height: responsiveHeight(4.5), // 36 -> レスポンシブ
        backgroundColor: '#136229',
        borderRadius: responsiveHeight(2.25), // 18 -> レスポンシブ
        zIndex: 1,
    },
    toggleTouchable: {
        flex: 1,
        height: responsiveHeight(5.5), // 44 -> レスポンシブ
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    toggleText: {
        color: '#136229',
        fontWeight: 'bold',
        fontSize: responsiveFontSize(2), // 16 -> レスポンシブ
    },
    activeToggleText: {
        color: '#fff',
    },
    totalRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: responsiveHeight(1), // 8 -> レスポンシブ
        gap: responsiveWidth(2), // 8 -> レスポンシブ
    },
    totalLabel: {
        fontSize: responsiveFontSize(1.5), // 12 -> レスポンシブ
        color: '#666',
        marginBottom: responsiveHeight(0.25), // 2 -> レスポンシブ
    },
    totalValue: {
        fontWeight: 'bold',
        color: '#000',
        fontSize: responsiveFontSize(2.5), // 20 -> レスポンシブ
    },
    totalNumber: {
        fontSize: responsiveFontSize(4), // 32 -> レスポンシブ
        fontWeight: 'bold',
        color: '#000',
    },
    totalUnit: {
        fontSize: responsiveFontSize(2), // 16 -> レスポンシブ
        fontWeight: 'bold',
        color: '#000',
    },
    graphPlaceholder: {
        height: responsiveHeight(22.5), // 180 -> レスポンシブ
        width: '100%',
        backgroundColor: '#f4f4f4',
        borderRadius: responsiveWidth(3), // 12 -> レスポンシブ
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: responsiveHeight(3), // 24 -> レスポンシブ
    },
    // ローディング用のスタイル
  loadingContainer: {
      
        height: responsiveHeight(20),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9f9f9',
        borderRadius: responsiveWidth(3),
        marginBottom: responsiveHeight(3),
    },
    loadingText: {
        fontSize: responsiveFontSize(1.8),
        color: '#666',
        fontWeight: '500',
    },
    // グラフ用のスタイル
    chartContainer: {
        width: '100%',
        marginBottom: responsiveHeight(3),
    },
    chartArea: {
        height: responsiveHeight(20),
        backgroundColor: '#FAFAFA',
        borderRadius: responsiveWidth(2),
        padding: responsiveWidth(3),
        position: 'relative',
        flexDirection: 'row',
        // プラットフォーム別シャドウ
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: responsiveHeight(0.5) },
                shadowOpacity: 0.15,
                shadowRadius: responsiveWidth(2),
            },
            android: {
                elevation: 4,
            },
        }),
    },
    // Y軸ラベル
    yAxisLabels: {
        width: responsiveWidth(12),
        height: responsiveHeight(15),
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingRight: responsiveWidth(2),
        marginTop: responsiveHeight(1),
    },
    yAxisLabel: {
        fontSize: responsiveFontSize(1.1),
        color: '#666',
        textAlign: 'right',
    },
    // SVGコンテナ
    svgContainer: {
        flex: 1,
        height: responsiveHeight(15),
        marginTop: responsiveHeight(1),
        position: 'relative',
        // プラットフォーム別シャドウ（軽め）
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: responsiveHeight(0.25) },
                shadowOpacity: 0.08,
                shadowRadius: responsiveWidth(1),
            },
            android: {
                elevation: 2,
            },
        }),
    },
    svgGraph: {
        position: 'absolute',
        top: 0,
        left: 0,
    },
    // データラベル
    dataLabels: {
        position: 'absolute',
        bottom: responsiveHeight(1),
        left: responsiveWidth(15),
        right: responsiveWidth(3),
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    labelColumn: {
        alignItems: 'center',
        flex: 1,
    },
    // グリッド線
    gridLines: {
        position: 'absolute',
        top: responsiveHeight(1),
        left: responsiveWidth(15),
        right: responsiveWidth(3),
        height: responsiveHeight(15),
    },
    gridLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: '#E0E0E0',
        opacity: 0.5,
    },
    chartPoints: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        zIndex: 1,
    },
    chartPoint: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: responsiveWidth(0.2),
        height: '100%',
        justifyContent: 'space-between',
    },
    stepValue: {
        fontSize: responsiveFontSize(1.2),
        color: '#888888',
        fontWeight: '600',
        marginBottom: responsiveHeight(0.5),
        textAlign: 'center',
    },
    pointContainer: {
        width: '100%',
        height: responsiveHeight(12),
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    dataPoint: {
        width: responsiveWidth(2.5),
        height: responsiveWidth(2.5),
        borderRadius: responsiveWidth(1.25),
        position: 'absolute',
        zIndex: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
    },
    connectionLine: {
        position: 'absolute',
        backgroundColor: '#4BC16B',
        height: 2,
        left: responsiveWidth(1.25),
        transformOrigin: 'left center',
        zIndex: 1,
    },
    connectionLines: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: responsiveWidth(2),
        paddingVertical: responsiveHeight(1),
        zIndex: 2,
    },
    verticalLine: {
        width: responsiveWidth(0.5),
        backgroundColor: '#4BC16B',
        borderRadius: responsiveWidth(0.25),
        opacity: 0.6,
    },
    dateLabel: {
        fontSize: responsiveFontSize(1.1),
        color: '#888',
        textAlign: 'center',
    },
})

export default Profile
