import React, { useCallback, useEffect, useRef, useState } from 'react'

import { faGithub } from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Animated, Image, Platform, Text, TouchableOpacity, View } from 'react-native'
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import ExerciseGraph from '@/components/charts/ExerciseGraph'

import styles from '../app/style/profile.styles'

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

interface ProfileContentProps {
    userName?: string
    userData?: UserData | null
    onClose?: () => void
    showTitle?: boolean // タイトルと下線を表示するかどうか
    isOwnProfile?: boolean // 自分のプロフィールかどうか（データ取得の制御用）
}

// コントリビューションの色分け（0, 1-4, 5-9, 10-14, 15-19, 20+）
const contributionColors = [
    '#EFEFF4', // 0
    '#ACEEBB', // 1-4
    '#4BC16B', // 5-9
    '#2BA44E', // 10-14
    '#136229', // 15-19
    '#0B3D1B', // 20+
]

const ProfileContent = ({
    userName,
    userData: externalUserData,
    onClose,
    showTitle = true,
    isOwnProfile = false,
}: ProfileContentProps) => {
    const insets = useSafeAreaInsets()
    const [isSafeAreaReady, setIsSafeAreaReady] = useState(false)
    const [period, setPeriod] = useState<'日' | '週' | '月'>('週')
    const [chartType, setChartType] = useState<'bar' | 'line'>('bar') // 日別グラフの表示タイプ
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
        if (!isOwnProfile) return // 他人のプロフィールの場合はAPIからデータを取得しない

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
    }, [isOwnProfile, setIsLoading, setUserData, setUser])

    // SafeAreaInsetsが確実に取得できるまで待つ
    useEffect(() => {
        // 自分のプロフィールの場合のみSafeAreaInsetsを待つ
        if (isOwnProfile) {
            // iOSの場合はinsets.topが20以上、Androidの場合は0以上であることを確認
            const isInsetsReady = Platform.OS === 'ios' ? insets.top >= 20 : insets.top >= 0

            if (isInsetsReady) {
                // 少し遅延してから表示（SafeAreaが確実に適用されるまで）
                const timer = setTimeout(() => {
                    setIsSafeAreaReady(true)
                }, 300)
                return () => clearTimeout(timer)
            }
        } else {
            // 他人のプロフィールの場合は即座に表示
            setIsSafeAreaReady(true)
        }
    }, [insets, isOwnProfile])

    // コンポーネントマウント時にデータを取得
    useEffect(() => {
        if (!externalUserData && isOwnProfile) {
            fetchUserData()
        }
    }, [externalUserData, isOwnProfile, fetchUserData])

    // 外部データが更新された場合に内部状態を更新
    useEffect(() => {
        if (externalUserData) {
            setUserData(externalUserData)
        }
    }, [externalUserData])

    // スライダーアニメーション
    useEffect(() => {
        // SafeAreaが準備できてから実行
        if (!isSafeAreaReady) return

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
    }, [period, toggleWidth, sliderAnim, isSafeAreaReady])

    // ペットパラメータアニメーション
    useEffect(() => {
        // SafeAreaが準備できてから実行
        if (!isSafeAreaReady) return

        const paramValues = {
            health: 0.9,
            size: 0.5,
            age: 0.3,
        }

        // アニメーションをリセットしてから開始
        healthAnim.setValue(0)
        sizeAnim.setValue(0)
        ageAnim.setValue(0)

        // 少し遅延してからアニメーション開始
        const timer = setTimeout(() => {
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
        }, 100)

        return () => clearTimeout(timer)
    }, [isSafeAreaReady, healthAnim, sizeAnim, ageAnim])

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

    // SafeAreaInsetsが準備できるまでローディング表示
    if (!isSafeAreaReady) {
        return <View style={{ flex: 1, backgroundColor: '#fff' }} />
    }

    return (
        <>
            {/* タイトル（条件付きで表示） */}
            {showTitle && (
                <>
                    <Text style={styles.title}>プロフィール</Text>
                    <View style={styles.underline} />
                </>
            )}

            {/* 他人のプロフィール用の小さなタイトル */}
            {!showTitle && (
                <>
                    <Text
                        style={{
                            fontSize: responsiveFontSize(1.8),
                            fontWeight: 'bold',
                            textAlign: 'center',
                            marginBottom: responsiveHeight(0.5),
                            marginTop: responsiveHeight(1),
                            color: '#000',
                        }}
                    >
                        プロフィール
                    </Text>
                    <View style={[styles.underline, { marginBottom: responsiveHeight(0.5) }]} />
                </>
            )}

            {/* タイトルがない場合の適切な空白 */}
            {!showTitle && <View style={{ height: responsiveHeight(0.5) }} />}

            {/* ユーザー名 */}
            {!showTitle ?
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '3%',
                        marginHorizontal: '3%',
                    }}
                >
                    <Text
                        style={[
                            styles.userName,
                            {
                                fontSize: Platform.OS === 'android' ? responsiveFontSize(2.8) : responsiveFontSize(3),
                                marginLeft: 0,
                                marginBottom: 0,
                                flex: 1,
                            },
                        ]}
                    >
                        {user?.user_name || userName || 'Nguyen Duc Huynh'}
                    </Text>
                    <TouchableOpacity
                        style={{
                            backgroundColor: '#24292e',
                            paddingHorizontal: responsiveWidth(3),
                            paddingVertical: responsiveHeight(0.8),
                            borderRadius: responsiveWidth(2),
                            marginLeft: responsiveWidth(2),
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}
                        onPress={() => {
                            // TODO: GitHubプロフィールを開く処理
                        }}
                    >
                        <FontAwesomeIcon
                            icon={faGithub}
                            size={responsiveFontSize(1.6)}
                            color='#ffffff'
                            style={{ marginRight: responsiveWidth(1.5) }}
                        />
                        <Text
                            style={{
                                color: '#ffffff',
                                fontSize: responsiveFontSize(1.4),
                                fontWeight: '600',
                            }}
                        >
                            GitHub
                        </Text>
                    </TouchableOpacity>
                </View>
            :   <Text style={styles.userName}>{user?.user_name || userName || 'Nguyen Duc Huynh'}</Text>}

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
                    {isOwnProfile ?
                        <Image
                            source={require('@/assets/images/gifcat.gif')}
                            style={styles.petParamImage}
                            resizeMode='cover'
                        />
                    :   <View style={[styles.petParamImage, { backgroundColor: '#f0f0f0' }]} />}
                </View>
                {/* 名前＋インジケーター3本（縦並び） */}
                <View
                    style={styles.petParamInfo}
                    collapsable={false}
                >
                    <Text style={styles.petParamName}>{isOwnProfile ? 'とりゃー' : 'ペット'}</Text>
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
                                        marginRight: isOwnProfile ? '30%' : '10%',
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
                            <Text style={styles.indicatorLabel}>{isOwnProfile ? '親密度' : '年齢'}</Text>
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
                                width: toggleWidth > 0 ? (toggleWidth - responsiveWidth(1.5) * 2) / 3 : 0,
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

            {/* ExerciseGraphコンポーネント */}
            <ExerciseGraph
                userData={userData || undefined}
                period={period}
                chartType={chartType}
                onChartTypeChange={setChartType}
                isLoading={isLoading}
            />

            {/* 左下のプロフィールを閉じるボタン */}
            {onClose && (
                <TouchableOpacity
                    style={styles.closeModalButtonAbsolute}
                    onPress={onClose}
                    activeOpacity={0.8}
                >
                    <Text style={styles.closeModalButtonText}>✕</Text>
                </TouchableOpacity>
            )}
        </>
    )
}

export default ProfileContent
