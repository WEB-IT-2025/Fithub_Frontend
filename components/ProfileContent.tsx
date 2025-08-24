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
const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.11.57:3000').replace(/\/+$/, '')

// JWT解析ヘルパー関数
const parseJwtPayload = (token: string): any | null => {
    try {
        const parts = token.split('.')
        if (parts.length !== 3) return null

        const payload = parts[1]
        let base64 = payload.replace(/-/g, '+').replace(/_/g, '/')

        switch (base64.length % 4) {
            case 2:
                base64 += '=='
                break
            case 3:
                base64 += '='
                break
        }

        return JSON.parse(atob(base64))
    } catch {
        return null
    }
}

// コントリビューションデータの型定義（実際のAPIレスポンスに合わせて修正）
interface ContributionData {
    success: boolean
    data: {
        user_id: string
        recent_contributions: Array<{
            day: string
            count: string
        }>
        weekly_total: number
        monthly_total: number
        last_updated: string
    }
}

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
    hourly_steps?: Array<{
        time: string
        timeValue: number
        steps: number
        totalSteps: number
        timestamp: string
    }>
}

interface User {
    user_id: string
    user_name: string
    user_icon: string | null
    email: string | null
}

interface PetData {
    user_id: string
    user_name: string
    user_icon: string
    main_pet_item_id: string
    main_pet_name: string
    main_pet_user_name: string | null
    main_pet_image_url: string
    main_pet_type: string
    main_pet_size: number
    main_pet_intimacy: number
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
    const [petData, setPetData] = useState<PetData | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isPetLoading, setIsPetLoading] = useState(false)
    const [isHourlyDataLoading, setIsHourlyDataLoading] = useState(false)
    const [contributionData, setContributionData] = useState<ContributionData | null>(null)
    const [isContributionLoading, setIsContributionLoading] = useState(false)
    const sliderAnim = useRef(new Animated.Value(0)).current
    const healthAnim = useRef(new Animated.Value(0)).current
    const sizeAnim = useRef(new Animated.Value(0)).current
    const ageAnim = useRef(new Animated.Value(0)).current

    // コントリビューションデータを取得する関数
    const fetchContributionData = useCallback(async () => {
        if (!isOwnProfile) return // 他人のプロフィールの場合は取得しない

        console.log('🔄 コントリビューションデータ取得開始')
        setIsContributionLoading(true)

        try {
            // セッショントークンを取得
            const token = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_TOKEN)
            if (!token) {
                console.warn('⚠️ セッショントークンが見つかりません')
                return
            }

            // JWTからユーザーIDを抽出
            const payload = parseJwtPayload(token)
            const userId = payload?.user_id

            if (!userId) {
                console.error('❌ JWTからユーザーIDを取得できませんでした')
                return
            }

            const apiUrl = `${API_BASE_URL}/api/data/contribution/${userId}`
            console.log('📡 コントリビューションAPI呼び出し:', apiUrl)
            console.log('👤 使用ユーザーID:', userId)

            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            })

            console.log('📡 コントリビューションAPI応答:', response.status)

            if (response.ok) {
                const data: ContributionData = await response.json()
                console.log('✅ コントリビューションデータ取得成功:', data)

                if (data.success) {
                    setContributionData(data)
                    console.log(`📊 今週の総コントリビューション数: ${data.data.weekly_total}`)
                    console.log(`📊 今月の総コントリビューション数: ${data.data.monthly_total}`)
                    console.log(`📅 データ更新日: ${data.data.last_updated}`)
                } else {
                    console.warn('⚠️ コントリビューションAPIからsuccessがfalse')
                }
            } else {
                const errorText = await response.text()
                console.error('❌ コントリビューションAPI失敗:', response.status, errorText)
            }
        } catch (error) {
            console.error('❌ コントリビューション取得エラー:', error)
        } finally {
            setIsContributionLoading(false)
        }
    }, [isOwnProfile])

    // APIからメインペットデータを取得する関数
    const fetchMainPet = useCallback(async () => {
        if (!isOwnProfile) return // 他人のプロフィールの場合は取得しない

        console.log('メインペット情報取得開始')
        setIsPetLoading(true)
        try {
            const token = await AsyncStorage.getItem('session_token')
            if (!token) {
                console.log('トークンが見つかりません')
                return
            }

            const response = await fetch(`${API_BASE_URL}/api/pet/profile`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            })

            console.log('メインペットAPIレスポンスステータス:', response.status)

            if (response.ok) {
                const data = await response.json()
                console.log('🐱 メインペットデータ受信:', JSON.stringify(data, null, 2))

                if (data.success && data.data) {
                    setPetData(data.data)
                    console.log('🐱 メインペット設定完了:', {
                        main_pet_user_name: data.data.main_pet_user_name,
                        main_pet_name: data.data.main_pet_name,
                        main_pet_image_url: data.data.main_pet_image_url,
                        main_pet_intimacy: data.data.main_pet_intimacy,
                        main_pet_size: data.data.main_pet_size,
                    })
                } else {
                    console.log('❌ メインペットデータが不正:', data)
                    setPetData(null)
                }
            } else {
                const errorText = await response.text()
                console.log('メインペットAPI エラー:', response.status, errorText)
                setPetData(null)
            }
        } catch (error) {
            console.error('メインペット取得エラー:', error)
            setPetData(null)
        } finally {
            setIsPetLoading(false)
        }
    }, [isOwnProfile])

    // APIから2時間ごとの歩数データを取得する関数
    const fetchHourlyStepsData = useCallback(async () => {
        if (!isOwnProfile || isHourlyDataLoading) return null // 他人のプロフィールまたは既にローディング中の場合は取得しない

        try {
            setIsHourlyDataLoading(true)

            // AsyncStorageからトークンを取得
            const token = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_TOKEN)
            if (!token) {
                console.log('Profile: トークンがありません（hourly）')
                return null
            }

            console.log('🕒 Profile: 時間別データ取得開始')

            // 時間別データを取得
            const hourlyResponse = await fetch(`${API_BASE_URL}/api/data/hourly`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            })

            if (hourlyResponse.ok) {
                const hourlyData = await hourlyResponse.json()
                console.log('✅ Profile: 時間別データ取得成功', hourlyData)

                if (hourlyData.success && hourlyData.data && hourlyData.data.hourly_data) {
                    console.log('🕒 Profile: 時間別データの詳細:', {
                        dataType: typeof hourlyData.data.hourly_data,
                        isArray: Array.isArray(hourlyData.data.hourly_data),
                        length: hourlyData.data.hourly_data.length,
                        firstItem: hourlyData.data.hourly_data[0],
                        allData: hourlyData.data.hourly_data,
                    })

                    // データが配列でない場合の対処
                    if (!Array.isArray(hourlyData.data.hourly_data)) {
                        console.log('❌ Profile: 時間別データが配列ではありません', hourlyData.data.hourly_data)
                        return null
                    }

                    // データの各要素が期待される形式かチェック
                    const isValidData = hourlyData.data.hourly_data.every(
                        (item) =>
                            typeof item === 'object' &&
                            typeof item.timeValue === 'number' &&
                            typeof item.steps === 'number'
                    )

                    if (!isValidData) {
                        console.log('❌ Profile: 時間別データの形式が不正です', hourlyData.data.hourly_data)
                        return null
                    }

                    console.log('✅ Profile: 時間別データ検証完了')
                    return hourlyData.data.hourly_data
                } else {
                    console.log('❌ Profile: APIレスポンスが不正です', {
                        success: hourlyData.success,
                        hasData: !!hourlyData.data,
                        hasHourlyData: !!(hourlyData.data && hourlyData.data.hourly_data),
                    })
                }
            } else {
                console.log('❌ Profile: 時間別データ取得失敗', hourlyResponse.status)
            }
        } catch (error) {
            console.error('❌ Profile: 時間別データ取得エラー:', error)
        } finally {
            setIsHourlyDataLoading(false)
        }

        return null
    }, [isOwnProfile, isHourlyDataLoading])

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
                    // 時間別データも取得して結合
                    const hourlySteps = await fetchHourlyStepsData()
                    console.log('🔗 Profile: データ結合処理:', {
                        userDataExists: !!userData.data,
                        hourlyStepsExists: !!hourlySteps,
                        hourlyStepsLength: hourlySteps ? hourlySteps.length : 0,
                    })

                    const combinedUserData = {
                        ...userData.data,
                        hourly_steps: hourlySteps,
                    }

                    console.log('🔗 Profile: 結合後データ:', {
                        today: combinedUserData.today,
                        recent_exercise: combinedUserData.recent_exercise ? combinedUserData.recent_exercise.length : 0,
                        hourly_steps: combinedUserData.hourly_steps ? combinedUserData.hourly_steps.length : 0,
                    })

                    setUserData(combinedUserData)

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
    }, [isOwnProfile])

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
        if (!externalUserData && isOwnProfile && !isLoading) {
            fetchUserData()
            fetchMainPet()
            fetchContributionData() // コントリビューションデータも自動取得
        }
    }, [externalUserData, isOwnProfile])

    // 外部データが更新された場合に内部状態を更新
    useEffect(() => {
        if (externalUserData) {
            setUserData(externalUserData)
        }
    }, [externalUserData])

    // 期間が「日」に変更された時、時間別データが不足している場合は取得
    useEffect(() => {
        const fetchHourlyDataIfNeeded = async () => {
            console.log('🕒 期間変更チェック:', {
                period,
                isOwnProfile,
                userDataExists: !!userData,
                hourlyStepsExists: !!userData?.hourly_steps,
                isHourlyDataLoading,
            })

            // 条件: 期間が「日」、自分のプロフィール、ユーザーデータ存在、時間別データなし、ローディング中でない
            if (period === '日' && isOwnProfile && userData && !userData.hourly_steps && !isHourlyDataLoading) {
                console.log('🕒 期間が「日」に変更されました。時間別データを取得します。')
                const hourlySteps = await fetchHourlyStepsData()
                console.log('🕒 期間変更時取得データ:', {
                    hourlySteps,
                    isArray: Array.isArray(hourlySteps),
                    length: hourlySteps ? hourlySteps.length : 0,
                })
                if (hourlySteps && hourlySteps.length > 0) {
                    console.log('🕒 期間変更時データ取得成功:', hourlySteps.length)
                    setUserData((prevData) => {
                        // prevDataがnullでないことを確認
                        if (!prevData) return prevData

                        const newData = {
                            ...prevData,
                            hourly_steps: hourlySteps,
                        }
                        console.log('🕒 期間変更時データ更新完了:', {
                            hourly_steps: newData.hourly_steps ? newData.hourly_steps.length : 0,
                        })
                        return newData
                    })
                } else {
                    console.log('❌ 時間別データの取得に失敗しました')
                }
            }
        }

        fetchHourlyDataIfNeeded()
    }, [period, isOwnProfile, userData?.today?.date, isHourlyDataLoading, fetchHourlyStepsData])

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
            health: petData ? Math.min(petData.main_pet_intimacy / 100, 1) : 0.9,
            size: petData ? Math.min(petData.main_pet_size / 100, 1) : 0.5,
            intimacy: petData ? Math.min(petData.main_pet_intimacy / 100, 1) : 0.3,
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
                toValue: paramValues.intimacy,
                duration: 800,
                useNativeDriver: false,
            }).start()
        }, 100)

        return () => clearTimeout(timer)
    }, [isSafeAreaReady, healthAnim, sizeAnim, ageAnim, petData])

    // ペット画像を取得する関数
    const getPetImage = () => {
        if (!petData || !petData.main_pet_image_url) {
            return require('@/assets/images/gifcat.gif') // デフォルト画像
        }

        console.log('🖼️ 画像URL:', petData.main_pet_image_url)

        try {
            // 画像ファイル名から直接パスを構築
            const imagePath = `@/assets/images/${petData.main_pet_image_url}`
            console.log('🖼️ 構築されたパス:', imagePath)

            // 動的requireの代わりに、画像名から直接require
            switch (petData.main_pet_image_url) {
                case 'black_cat.png':
                    return require('@/assets/images/black_cat.png')
                case 'vitiligo_cat.png':
                    return require('@/assets/images/vitiligo_cat.png')
                case 'mike_cat.png':
                    return require('@/assets/images/mike_cat.png')
                case 'tora_cat.png':
                    return require('@/assets/images/tora_cat.png')
                case 'ameshort_cat.png':
                    return require('@/assets/images/ameshort_cat.png')
                case 'fithub_cat.png':
                    return require('@/assets/images/fithub_cat.png')
                case 'cat1.png':
                    return require('@/assets/images/cat1.png')
                case 'shiba_dog.png':
                    return require('@/assets/images/shiba_dog.png')
                case 'chihuahua.png':
                    return require('@/assets/images/chihuahua.png')
                case 'pome.png':
                    return require('@/assets/images/pome.png')
                case 'toipo.png':
                    return require('@/assets/images/toipo.png')
                case 'bulldog.png':
                    return require('@/assets/images/bulldog.png')
                case 'gingin_penguin.png':
                    return require('@/assets/images/gingin_penguin.png')
                case 'takopee.png':
                    return require('@/assets/images/takopee.png')
                case 'penguin.png':
                    return require('@/assets/images/penguin.png')
                case 'slime.png':
                    return require('@/assets/images/slime.png')
                case 'zebra.png':
                    return require('@/assets/images/zebra.png')
                case 'rabbit.png':
                    return require('@/assets/images/rabbit.png')
                case 'chinpan.png':
                    return require('@/assets/images/chinpan.png')
                case 'panda.png':
                    return require('@/assets/images/panda.png')
                case 'gifcat.gif':
                    return require('@/assets/images/gifcat.gif')
                default:
                    console.log('🖼️ 未知の画像:', petData.main_pet_image_url)
                    return require('@/assets/images/gifcat.gif')
            }
        } catch (error) {
            console.log('🖼️ 画像読み込みエラー:', error)
            return require('@/assets/images/gifcat.gif')
        }
    }

    // コントリビューションデータ取得メソッド（新しいAPIから取得したデータを使用）
    const getContributionsData = () => {
        if (contributionData?.data?.recent_contributions && contributionData.data.recent_contributions.length > 0) {
            // APIから取得した直近7日分のデータを時系列順に並べる（左が古い、右が新しい）
            const contributions = contributionData.data.recent_contributions
                .sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime()) // 日付順にソート
                .slice(-7) // 直近7日分を取得
                .map((contribution) => parseInt(contribution.count, 10))

            console.log('📊 APIから取得したコントリビューションデータ:', contributions)
            console.log('📊 元データ:', contributionData.data.recent_contributions)

            // 7日に満たない場合は左側を0で埋める
            while (contributions.length < 7) {
                contributions.unshift(0)
            }

            return contributions
        } else if (userData?.recent_contributions && userData.recent_contributions.length > 0) {
            // フォールバック: 既存のuserDataから取得
            const contributions = userData.recent_contributions
                .sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime()) // 日付順にソート
                .slice(-7) // 直近7日分を取得
                .map((contribution) => parseInt(contribution.count, 10))

            console.log('📊 userDataから取得したコントリビューションデータ:', contributions)

            // 7日に満たない場合は左側を0で埋める
            while (contributions.length < 7) {
                contributions.unshift(0)
            }

            return contributions
        } else {
            // ダミー値も左が古い、右が新しい（時系列順）
            console.log('⚠️ コントリビューションデータなし - ダミーデータを使用')
            console.log('⚠️ contributionData:', contributionData)
            console.log('⚠️ userData?.recent_contributions:', userData?.recent_contributions)
            return [2, 0, 7, 12, 17, 22, 4]
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
            <Text style={styles.sectionLabel}>
                今週のコントリビューション
                {isContributionLoading && <Text style={{ fontSize: 12, color: '#666' }}> (取得中...)</Text>}
            </Text>
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
                            source={getPetImage()}
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
                    <Text style={styles.petParamName}>
                        {isOwnProfile ?
                            isPetLoading ?
                                'ローディング中...'
                            :   petData?.main_pet_user_name || petData?.main_pet_name || 'ペット名なし'
                        :   'ペット'}
                    </Text>
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
                userData={(() => {
                    // デバッグ用：現在のuserDataの内容をログ出力
                    console.log('🔍 ProfileContent: ExerciseGraphに渡すuserData:', {
                        today: userData?.today,
                        recent_exercise: userData?.recent_exercise ? `${userData.recent_exercise.length}件` : 'なし',
                        hourly_steps: userData?.hourly_steps ? `${userData.hourly_steps.length}件` : 'なし',
                        hourly_steps_data: userData?.hourly_steps,
                    })
                    return userData || undefined
                })()}
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
