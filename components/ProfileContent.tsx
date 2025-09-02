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

// 新しい週歩数データの型定義
interface WeeklyStepsData {
    success: boolean
    data: {
        user_id: string
        recent_exercise: Array<{
            day: string
            exercise_quantity: number
        }>
        total_steps: string
        period: string
        last_updated: string
    }
}

// 新しい月歩数データの型定義
interface MonthlyStepsData {
    success: boolean
    data: {
        user_id: string
        recent_exercise: Array<{
            day: string
            exercise_quantity: number
        }>
        total_steps: string
        period: string
        last_updated: string
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
    hourly_exercise?: Array<{
        time: string
        timeValue: number
        steps: number
        totalSteps: number
        timestamp: string
    }>
    // 週歩数データの新しいフィールド
    weekly_total_steps?: number
    weekly_period?: string
    weekly_last_updated?: string
    // 月歩数データの新しいフィールド
    monthly_exercise?: Array<{
        day: string
        exercise_quantity: number
    }>
    monthly_total_steps?: number
    monthly_period?: string
    monthly_last_updated?: string
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
    userId?: string // 実際のユーザーID
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
    userId,
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
    const fetchContributionData = useCallback(
        async (targetUserId?: string) => {
            setIsContributionLoading(true)
            try {
                const token = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_TOKEN)
                if (!token) return

                let actualUserId: string | undefined
                if (isOwnProfile) {
                    const payload = parseJwtPayload(token)
                    actualUserId = payload?.user_id
                } else {
                    actualUserId = targetUserId
                }
                if (!actualUserId) return

                const apiUrl = `${API_BASE_URL}/api/data/contribution/${actualUserId}`
                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                })

                if (response.ok) {
                    const data: ContributionData = await response.json()
                    if (data.success) {
                        setContributionData(data)
                        console.log('✅ Contribution API: success')
                    } else {
                        console.warn('⚠️ Contribution API: success=false')
                    }
                } else {
                    const errorText = await response.text()
                    console.error('❌ Contribution API: failed', response.status, errorText)
                }
            } catch (error) {
                console.error('❌ Contribution API: error', error)
            } finally {
                setIsContributionLoading(false)
            }
        },
        [isOwnProfile]
    )

    // APIから週歩数データを取得する関数（成功/失敗のみログ）
    const fetchWeeklyStepsData = useCallback(
        async (targetUserId?: string) => {
            try {
                const token = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_TOKEN)
                if (!token) return null

                let actualUserId: string | undefined
                if (isOwnProfile) {
                    const payload = parseJwtPayload(token)
                    actualUserId = payload?.user_id
                } else {
                    actualUserId = targetUserId
                }
                if (!actualUserId) return null

                const apiUrl = `${API_BASE_URL}/api/data/weekly/${actualUserId}`
                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                })

                if (response.ok) {
                    const data: WeeklyStepsData = await response.json()
                    if (data.success && data.data) {
                        console.log('✅ Weekly steps API: success')
                        return data.data
                    }
                    console.warn('⚠️ Weekly steps API: success=false or no data')
                } else {
                    const errorText = await response.text()
                    console.error('❌ Weekly steps API: failed', response.status, errorText)
                }
                return null
            } catch (error) {
                console.error('❌ Weekly steps API: error', error)
                return null
            }
        },
        [isOwnProfile]
    )

    // APIから月歩数データを取得する関数（成功/失敗のみログ）
    const fetchMonthlyStepsData = useCallback(
        async (targetUserId?: string) => {
            try {
                const token = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_TOKEN)
                if (!token) return null

                let actualUserId: string | undefined
                if (isOwnProfile) {
                    const payload = parseJwtPayload(token)
                    actualUserId = payload?.user_id
                } else {
                    actualUserId = targetUserId
                }
                if (!actualUserId) return null

                const apiUrl = `${API_BASE_URL}/api/data/monthly/${actualUserId}`
                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                })

                if (response.ok) {
                    const data: MonthlyStepsData = await response.json()
                    if (data.success && data.data) {
                        console.log('✅ Monthly steps API: success')
                        return data.data
                    }
                    console.warn('⚠️ Monthly steps API: success=false or no data')
                } else {
                    const errorText = await response.text()
                    console.error('❌ Monthly steps API: failed', response.status, errorText)
                }
                return null
            } catch (error) {
                console.error('❌ Monthly steps API: error', error)
                return null
            }
        },
        [isOwnProfile]
    )

    // APIからメインペットデータを取得する関数
    const fetchMainPet = useCallback(async (targetUserId?: string) => {
        console.log('メインペット情報取得開始')
        setIsPetLoading(true)
        try {
            let actualUserId: string | undefined

            if (isOwnProfile) {
                // 自分のプロフィールの場合はJWTからユーザーIDを取得
                const token = await AsyncStorage.getItem('session_token')
                if (!token) {
                    console.log('トークンが見つかりません')
                    return
                }

                const payload = parseJwtPayload(token)
                actualUserId = payload?.user_id
            } else {
                // 他人のプロフィールの場合は渡されたuserIdを使用
                actualUserId = targetUserId || userId
            }

            if (!actualUserId) {
                console.log('ユーザーIDが取得できません')
                return
            }

            const response = await fetch(`${API_BASE_URL}/api/pet/profile/${actualUserId}`, {
                method: 'GET',
                headers: {
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
    }, [isOwnProfile, userId])

    // APIから2時間ごとの歩数データを取得する関数
    const fetchHourlyStepsData = useCallback(async (targetUserId?: string) => {
        if (isHourlyDataLoading) return null // 既にローディング中の場合は取得しない

        try {
            setIsHourlyDataLoading(true)

            // ユーザーIDを決定（渡された場合はそれを使用、そうでなければ自分のID）
            let actualUserId = targetUserId
            if (!actualUserId) {
                // AsyncStorageからトークンを取得してユーザーIDを抽出
                const token = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_TOKEN)
                if (!token) {
                    console.log('Profile: トークンがありません（hourly）')
                    return null
                }

                const payload = parseJwtPayload(token)
                if (!payload || !payload.user_id) {
                    console.log('Profile: JWTからユーザーIDを取得できません（hourly）')
                    return null
                }
                actualUserId = payload.user_id
            }

            console.log('🕒 Profile: 時間別データ取得開始', { userId: actualUserId })

            // 時間別データを取得（新しいエンドポイント使用）
            const hourlyResponse = await fetch(`${API_BASE_URL}/api/data/hourly/${actualUserId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            if (hourlyResponse.ok) {
                const hourlyData = await hourlyResponse.json()
                console.log('✅ Profile: 時間別データ取得成功', hourlyData)

                if (hourlyData.success && hourlyData.data && hourlyData.data.hourly_data) {
                    console.log('🕒 Profile: 時間別データの詳細:', {
                        totalSteps: hourlyData.data.total_steps,
                        dataPoints: hourlyData.data.data_points,
                        date: hourlyData.data.date,
                        userId: hourlyData.data.user_id,
                        hourlyDataLength: hourlyData.data.hourly_data.length
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
    }, [isHourlyDataLoading])

    // APIからユーザーデータを取得する関数
    const fetchUserData = useCallback(async () => {
        if (!isOwnProfile) return // 他人のプロフィールの場合はAPIからデータを取得しない

        try {
            console.log('🔄 ProfileContent: fetchUserData開始')
            setIsLoading(true)

            // AsyncStorageからトークンを取得
            const token = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_TOKEN)
            if (!token) {
                console.log('❌ Profile: トークンがありません')
                return
            }

            console.log('📊 Profile: データ取得開始（週歩数・月歩数APIのみ）')

            // 週歩数データと月歩数データを並行取得
            const [weeklyStepsData, monthlyStepsData] = await Promise.all([
                fetchWeeklyStepsData(),
                fetchMonthlyStepsData(),
            ])

            console.log('📊 Profile: API呼び出し完了', {
                weeklyStepsData_exists: !!weeklyStepsData,
                monthlyStepsData_exists: !!monthlyStepsData,
            })

            if (weeklyStepsData) {
                // 時間別データも取得（自分のプロフィールの場合のみ）
                const hourlySteps = await fetchHourlyStepsData()
                console.log('🔗 Profile: データ結合処理:', {
                    hourlyStepsExists: !!hourlySteps,
                    hourlyStepsLength: hourlySteps ? hourlySteps.length : 0,
                    weeklyStepsExists: !!weeklyStepsData,
                    weeklyStepsCount: weeklyStepsData ? weeklyStepsData.recent_exercise.length : 0,
                })

                // 週歩数データの詳細ログ
                console.log('📊 週歩数データの詳細:', {
                    total_steps: weeklyStepsData.total_steps,
                    period: weeklyStepsData.period,
                    recent_exercise_count: weeklyStepsData.recent_exercise.length,
                    recent_exercise_data: weeklyStepsData.recent_exercise,
                })

                // 今日のデータを作成（週歩数データの最新日から）
                const today = {
                    steps:
                        weeklyStepsData.recent_exercise.length > 0 ?
                            weeklyStepsData.recent_exercise[weeklyStepsData.recent_exercise.length - 1]
                                .exercise_quantity
                        :   0,
                    contributions: 0, // デフォルト値
                    date: new Date().toISOString().split('T')[0],
                }

                const combinedUserData = {
                    today: today,
                    recent_exercise: weeklyStepsData.recent_exercise,
                    monthly_exercise: monthlyStepsData?.recent_exercise || [],
                    hourly_steps: hourlySteps,
                    weekly_total_steps: parseInt(weeklyStepsData.total_steps),
                    monthly_total_steps: monthlyStepsData?.total_steps ? parseInt(monthlyStepsData.total_steps) : 0,
                    weekly_period: weeklyStepsData.period,
                    monthly_period: monthlyStepsData?.period || '',
                    weekly_last_updated: weeklyStepsData.last_updated,
                    monthly_last_updated: monthlyStepsData?.last_updated || '',
                }

                console.log('🎯🎯🎯 結合後のcombinedUserDataの完全な内容 🎯🎯🎯')
                console.log(JSON.stringify(combinedUserData, null, 2))
                console.log('🎯🎯🎯 combinedUserData終了 🎯🎯🎯')

                console.log('🔗 Profile: 結合後データ:', {
                    today: combinedUserData.today,
                    recent_exercise: combinedUserData.recent_exercise ? combinedUserData.recent_exercise.length : 0,
                    recent_exercise_source: '週歩数API',
                    monthly_exercise: combinedUserData.monthly_exercise ? combinedUserData.monthly_exercise.length : 0,
                    monthly_exercise_source: '月歩数API',
                    hourly_steps: combinedUserData.hourly_steps ? combinedUserData.hourly_steps.length : 0,
                    weekly_total_steps: combinedUserData.weekly_total_steps,
                    monthly_total_steps: combinedUserData.monthly_total_steps,
                    weekly_period: combinedUserData.weekly_period,
                    monthly_period: combinedUserData.monthly_period,
                })

                // 実際のrecent_exerciseデータの内容もログ出力
                if (combinedUserData.recent_exercise && combinedUserData.recent_exercise.length > 0) {
                    console.log('📊 実際の週間recent_exerciseデータ:')
                    combinedUserData.recent_exercise.forEach((exercise, index) => {
                        console.log(`📅 ${index + 1}: ${exercise.day} - ${exercise.exercise_quantity}歩`)
                    })
                }

                // 月間データの内容もログ出力
                if (combinedUserData.monthly_exercise && combinedUserData.monthly_exercise.length > 0) {
                    console.log('📊 実際の月間exerciseデータ:')
                    combinedUserData.monthly_exercise.forEach((exercise, index) => {
                        console.log(`📅 ${index + 1}: ${exercise.day} - ${exercise.exercise_quantity}歩`)
                    })
                }

                console.log('💾 ProfileContent: setUserData呼び出し前', {
                    combinedUserData_exists: !!combinedUserData,
                    combinedUserData_keys: Object.keys(combinedUserData),
                    recent_exercise_length: combinedUserData.recent_exercise?.length || 0,
                })

                setUserData(combinedUserData)

                console.log('✅ ProfileContent: setUserData呼び出し完了')

                // setUserData後に少し待ってから状態を確認
                setTimeout(() => {
                    console.log('⏰ ProfileContent: setUserData後の状態確認', {
                        userData_updated: !!userData,
                        recent_exercise_exists: !!userData?.recent_exercise,
                    })
                }, 100)

                // ユーザー基本情報も設定（週歩数データから）
                setUser({
                    user_id: weeklyStepsData.user_id,
                    user_name: 'User', // 週歩数APIにはuser_nameがないため固定値
                    user_icon: null,
                    email: null,
                })
                console.log('✅ ProfileContent: setUser呼び出し完了')
            } else {
                console.error('❌ Profile: 週歩数データの取得に失敗')
            }
        } catch (error) {
            console.error('❌ Profile: データ取得エラー:', error)
        } finally {
            console.log('🏁 ProfileContent: fetchUserData完了, setIsLoading(false)呼び出し')
            setIsLoading(false)
        }
    }, [isOwnProfile])

    // 他人のプロフィール用のデータ取得関数
    const fetchOtherUserData = useCallback(
        async (targetUserId: string) => {
            try {
                setIsLoading(true)
                const [weeklyStepsData, monthlyStepsData] = await Promise.all([
                    fetchWeeklyStepsData(targetUserId),
                    fetchMonthlyStepsData(targetUserId),
                ])

                if (weeklyStepsData) {
                    // 時間別データも取得
                    const hourlySteps = await fetchHourlyStepsData(targetUserId)
                    console.log('🔗 Other Profile: データ結合処理:', {
                        hourlyStepsExists: !!hourlySteps,
                        hourlyStepsLength: hourlySteps ? hourlySteps.length : 0,
                        weeklyStepsExists: !!weeklyStepsData,
                        weeklyStepsCount: weeklyStepsData ? weeklyStepsData.recent_exercise.length : 0,
                    })

                    const today = {
                        steps:
                            weeklyStepsData.recent_exercise.length > 0 ?
                                weeklyStepsData.recent_exercise[weeklyStepsData.recent_exercise.length - 1]
                                    .exercise_quantity
                            :   0,
                        contributions: 0,
                        date: new Date().toISOString().split('T')[0],
                    }

                    const combinedUserData = {
                        today,
                        recent_exercise: weeklyStepsData.recent_exercise,
                        monthly_exercise: monthlyStepsData?.recent_exercise || [],
                        hourly_exercise: hourlySteps || [], // 時間別データを追加
                        weekly_total_steps: parseInt(String(weeklyStepsData.total_steps)),
                        monthly_total_steps:
                            monthlyStepsData?.total_steps ? parseInt(String(monthlyStepsData.total_steps)) : 0,
                        weekly_period: weeklyStepsData.period,
                        monthly_period: monthlyStepsData?.period || '',
                        weekly_last_updated: weeklyStepsData.last_updated,
                        monthly_last_updated: monthlyStepsData?.last_updated || '',
                    }

                    setUserData(combinedUserData)
                    setUser({
                        user_id: weeklyStepsData.user_id,
                        user_name: userName || 'User',
                        user_icon: null,
                        email: null,
                    })
                } else {
                    console.error('❌ 他人プロフィール: weekly steps not available')
                }
            } catch (error) {
                console.error('❌ 他人プロフィール: error', error)
            } finally {
                setIsLoading(false)
            }
        },
        [fetchWeeklyStepsData, fetchMonthlyStepsData, fetchHourlyStepsData, userName]
    )

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
        console.log('🎯 ProfileContent: useEffect実行 - マウント時チェック')
        console.log('🎯 条件詳細:', {
            externalUserData: !!externalUserData,
            isOwnProfile,
            isLoading,
            shouldFetch: isOwnProfile && !isLoading, // 自分のプロフィールなら常に最新データを取得
            currentUserData: !!userData,
        })

        // 自分のプロフィールの場合は常に最新のAPIデータを取得
        if (isOwnProfile) {
            console.log('🎯 ProfileContent: マウント時データ取得開始（強制実行）')
            console.log('🔄 ProfileContent: fetchUserData呼び出し中...')

            // ローディング状態に関係なく強制実行
            fetchUserData()
            fetchMainPet()
            fetchContributionData() // 自分のプロフィール用
        } else {
            // 他人のプロフィールの場合もコントリビューションデータと運動データ、ペット情報を取得
            console.log('🎯 ProfileContent: 他人のプロフィールのデータ取得')
            const targetUserId = userId || userName
            if (targetUserId) {
                fetchContributionData(targetUserId) // userIdを優先、なければuserNameを使用
                fetchOtherUserData(targetUserId) // 運動データも取得
                fetchMainPet(targetUserId) // ペット情報も取得
            }
        }
    }, [isOwnProfile, userId, userName]) // userIdも依存配列に追加

    // 外部データが更新された場合に内部状態を更新
    useEffect(() => {
        console.log('🔄 ProfileContent: externalUserData変更検出', {
            externalUserData_exists: !!externalUserData,
        })
        if (externalUserData) {
            console.log('✅ ProfileContent: externalUserDataからuserData更新')
            setUserData(externalUserData)
        }
    }, [externalUserData])

    // userDataの変更を監視
    useEffect(() => {
        console.log('📊 ProfileContent: userData状態変更:', {
            userData_exists: !!userData,
            recent_exercise_exists: !!userData?.recent_exercise,
            recent_exercise_length: userData?.recent_exercise?.length || 0,
            today_exists: !!userData?.today,
        })
    }, [userData])

    // contributionDataの変更を監視
    useEffect(() => {
        console.log('📊 ProfileContent: contributionData状態変更:', {
            contributionData_exists: !!contributionData,
            recent_contributions_exists: !!contributionData?.data?.recent_contributions,
            recent_contributions_length: contributionData?.data?.recent_contributions?.length || 0,
            weekly_total: contributionData?.data?.weekly_total,
            monthly_total: contributionData?.data?.monthly_total,
        })

        if (contributionData?.data?.recent_contributions) {
            console.log('📊 contributionData詳細 - 最初の3件:')
            contributionData.data.recent_contributions.slice(0, 3).forEach((contrib, index) => {
                console.log(`  ${index + 1}. ${contrib.day}: ${contrib.count}`)
            })
        }
    }, [contributionData])

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
        console.log('🔍 getContributionsData呼び出し - 詳細チェック開始')
        console.log('🔍 contributionData存在確認:', !!contributionData)
        console.log('🔍 contributionData詳細:', contributionData)

        if (contributionData?.data?.recent_contributions) {
            console.log('🔍 recent_contributions存在:', contributionData.data.recent_contributions.length)
            console.log('🔍 recent_contributions内容:', contributionData.data.recent_contributions)
        }

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

            console.log('📊 最終的なコントリビューションデータ:', contributions)
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
            console.log('⚠️ contributionData?.data:', contributionData?.data)
            console.log(
                '⚠️ contributionData?.data?.recent_contributions:',
                contributionData?.data?.recent_contributions
            )
            console.log('⚠️ userData?.recent_contributions:', userData?.recent_contributions)
            console.log('⚠️ isOwnProfile:', isOwnProfile)
            console.log('⚠️ userName:', userName)
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
                    {petData ?
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
                        {isPetLoading ?
                            'ローディング中...'
                        :   petData?.main_pet_user_name || petData?.main_pet_name || 'ペット名なし'}
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
                    console.log('🎯🎯🎯 ExerciseGraphに渡すuserDataの完全チェック 🎯🎯🎯')
                    console.log('userData:', JSON.stringify(userData, null, 2))
                    console.log('🎯🎯🎯 ExerciseGraph渡しデータ終了 🎯🎯🎯')

                    // デバッグ用：現在のuserDataの内容を詳細にログ出力
                    console.log('🔍 ProfileContent: ExerciseGraphに渡すuserData 詳細:', {
                        userData_exists: !!userData,
                        today: userData?.today,
                        recent_exercise_exists: !!userData?.recent_exercise,
                        recent_exercise_length: userData?.recent_exercise?.length || 0,
                        recent_exercise_data: userData?.recent_exercise,
                        hourly_steps: userData?.hourly_steps ? `${userData.hourly_steps.length}件` : 'なし',
                        weekly_total_steps: userData?.weekly_total_steps,
                        weekly_period: userData?.weekly_period,
                        weekly_last_updated: userData?.weekly_last_updated,
                        データソース: userData?.weekly_total_steps ? '週歩数API使用' : '基本ユーザーAPI使用',
                    })

                    // recent_exerciseの具体的なデータもログ出力
                    if (userData?.recent_exercise && userData.recent_exercise.length > 0) {
                        console.log('📊 ExerciseGraphに渡すrecent_exerciseの内容:')
                        userData.recent_exercise.forEach((exercise, index) => {
                            console.log(`📅 ${index + 1}: ${exercise.day} - ${exercise.exercise_quantity}歩`)
                        })

                        // 週の総歩数を計算
                        const calculatedTotal = userData.recent_exercise.reduce(
                            (sum, exercise) => sum + exercise.exercise_quantity,
                            0
                        )
                        console.log(`🧮 計算された週総歩数: ${calculatedTotal}歩`)
                        console.log(`📊 APIから取得した週総歩数: ${userData.weekly_total_steps || '取得なし'}歩`)

                        // ダミーデータかどうかの判定
                        const isDummyData = userData.recent_exercise.every(
                            (exercise) =>
                                exercise.day.includes('2024') ||
                                exercise.exercise_quantity === 0 ||
                                exercise.exercise_quantity > 50000
                        )
                        console.log(`🎭 データ判定: ${isDummyData ? 'ダミーデータの可能性' : '実データ'}`)

                        // APIソースの確認
                        if (userData.weekly_total_steps) {
                            console.log('✅ 週歩数APIからのデータを使用中')
                        } else {
                            console.log('⚠️ 基本ユーザーAPIのデータを使用中 - 週歩数APIが失敗した可能性')
                        }
                    } else {
                        console.log('❌ recent_exerciseデータが空または未定義')
                        console.log('🔍 ExerciseGraphはダミーデータ(0)を使用することになります')
                    }

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
