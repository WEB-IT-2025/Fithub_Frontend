import React, { useEffect, useRef, useState } from 'react'

import { Animated, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import ExerciseGraph from '@/components/charts/ExerciseGraph'
import styles from './style/profile.styles'

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

interface OtherProfileProps {
    userName: string
    userData: UserData
    onClose: () => void
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

const OtherProfile = ({ userName, userData, onClose }: OtherProfileProps) => {
    const insets = useSafeAreaInsets()
    const [isSafeAreaReady, setIsSafeAreaReady] = useState(false)
    const [period, setPeriod] = useState<'日' | '週' | '月'>('週')
    const [chartType, setChartType] = useState<'bar' | 'line'>('bar')
    const [toggleWidth, setToggleWidth] = useState(0)
    const sliderAnim = useRef(new Animated.Value(0)).current
    const healthAnim = useRef(new Animated.Value(0)).current
    const sizeAnim = useRef(new Animated.Value(0)).current
    const ageAnim = useRef(new Animated.Value(0)).current

    // SafeAreaInsetsが確実に取得できるまで待つ
    useEffect(() => {
        const isInsetsReady = Platform.OS === 'ios' ? insets.top >= 20 : insets.top >= 0

        if (isInsetsReady) {
            const timer = setTimeout(() => {
                setIsSafeAreaReady(true)
            }, 300)
            return () => clearTimeout(timer)
        }
    }, [insets])

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

        healthAnim.setValue(0)
        sizeAnim.setValue(0)
        ageAnim.setValue(0)

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
                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                const dayIndex = dayNames.indexOf(contribution.day)
                if (dayIndex !== -1) {
                    weeklyContributions[dayIndex] = parseInt(contribution.count) || 0
                }
            })
            return weeklyContributions
        } else {
            return [2, 0, 7, 12, 17, 22, 4]
        }
    }

    // SafeAreaInsetsが準備できるまでローディング表示
    if (!isSafeAreaReady) {
        return <View style={{ flex: 1, backgroundColor: '#fff' }} />
    }

    return (
        <ScrollView 
            style={[styles.container, { paddingTop: responsiveHeight(0.5) }]}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: responsiveHeight(10) }}
        >
            {/* タイトル */}
            <Text style={styles.title}>プロフィール</Text>
            <View style={styles.underline} />

            {/* ユーザー名 */}
            <Text style={styles.userName}>{userName}</Text>

            {/* コントリビューション（週のみ） */}
            <Text style={styles.sectionLabel}>今週のコントリビューション</Text>
            <View style={styles.contributionBoard}>
                <View style={styles.contributionRow}>
                    {getContributionsData().map((count, idx) => (
                        <View
                            key={idx}
                            style={[
                                styles.contributionBox,
                                {
                                    backgroundColor:
                                        contributionColors[
                                            count === 0 ? 0
                                            : count <= 4 ? 1
                                            : count <= 9 ? 2
                                            : count <= 14 ? 3
                                            : count <= 19 ? 4
                                            : 5
                                        ],
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
                <View style={styles.petParamImageWrapper}>
                    {/* ここにペット画像を配置 */}
                    <View style={[styles.petParamImage, { backgroundColor: '#f0f0f0' }]} />
                </View>
                <View style={styles.petParamInfo}>
                    <Text style={styles.petParamName}>ペット</Text>
                    <View style={styles.indicatorColumn}>
                        <View style={styles.indicatorRow}>
                            <Text style={styles.indicatorLabel}>健康度</Text>
                            <View style={styles.indicator}>
                                <Animated.View
                                    style={[
                                        {
                                            height: '100%',
                                            backgroundColor: '#2BA44E',
                                            borderRadius: responsiveWidth(1.25),
                                            width: healthAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: ['0%', '90%'],
                                            }),
                                        },
                                    ]}
                                />
                            </View>
                        </View>
                        <View style={styles.indicatorRow}>
                            <Text style={styles.indicatorLabel}>サイズ</Text>
                            <View style={styles.indicator}>
                                <Animated.View
                                    style={[
                                        {
                                            height: '100%',
                                            backgroundColor: '#2BA44E',
                                            borderRadius: responsiveWidth(1.25),
                                            width: sizeAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: ['0%', '50%'],
                                            }),
                                        },
                                    ]}
                                />
                            </View>
                        </View>
                        <View style={styles.indicatorRow}>
                            <Text style={styles.indicatorLabel}>年齢</Text>
                            <View style={styles.indicator}>
                                <Animated.View
                                    style={[
                                        {
                                            height: '100%',
                                            backgroundColor: '#2BA44E',
                                            borderRadius: responsiveWidth(1.25),
                                            width: ageAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: ['0%', '30%'],
                                            }),
                                        },
                                    ]}
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
                    onLayout={(event) => setToggleWidth(event.nativeEvent.layout.width)}
                >
                    <Animated.View
                        style={[
                            styles.toggleSlider,
                            {
                                left: sliderAnim,
                                width: toggleWidth > 0 ? (toggleWidth - responsiveWidth(1.5) * 2) / 3 : 0,
                            },
                        ]}
                    />
                    {(['日', '週', '月'] as const).map((p) => (
                        <TouchableOpacity
                            key={p}
                            style={styles.toggleTouchable}
                            onPress={() => setPeriod(p)}
                        >
                            <Text style={[styles.toggleText, period === p && styles.activeToggleText]}>{p}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* ExerciseGraphコンポーネント */}
            <ExerciseGraph
                userData={userData}
                period={period}
                chartType={chartType}
                onChartTypeChange={setChartType}
                isLoading={false}
            />

            {/* 左下のプロフィールを閉じるボタン */}
            <TouchableOpacity
                style={styles.closeModalButtonAbsolute}
                onPress={onClose}
                activeOpacity={0.8}
            >
                <Text style={styles.closeModalButtonText}>×</Text>
            </TouchableOpacity>
        </ScrollView>
    )
}

export default OtherProfile
