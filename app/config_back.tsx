import React, { useCallback, useEffect, useRef, useState } from 'react'

import AsyncStorage from '@react-native-async-storage/async-storage'
import {
    Alert,
    AppState,
    AppStateStatus,
    Button,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native'
import WebView from 'react-native-webview'

// ユーザー情報の型定義
interface User {
    user_id: string
    user_name: string
    user_icon: string
    email: string
}

// OAuth データの型定義
interface OAuthData {
    access_token: string
    refresh_token: string
    expires_in: number
    user_info: {
        user_name: string
        email: string
        user_icon: string
    }
}

// ユーザーデータAPI関連の型定義
interface ExerciseData {
    day: string
    exercise_quantity: number
}

interface ContributionData {
    day: string
    count: string
}

interface TodayData {
    date: string
    steps: number
    contributions: number
}

interface UserData {
    user_id: string
    today: TodayData
    recent_exercise: ExerciseData[]
    recent_contributions: ContributionData[]
    last_updated: string
}

interface WeeklyStats {
    total_steps: number
    total_contributions: number
    active_days: number
}

interface MonthlyStats {
    total_steps: number
    total_contributions: number
    active_days: number
}

interface UserStats {
    user_id: string
    weekly: WeeklyStats
    monthly: MonthlyStats
    last_updated: string
}

interface SyncResult {
    user_id: string
    synced_at: string
    exercise_data: {
        date: string
        steps: number
        source: string
        status: string
    }
    contribution_data: {
        date: string
        contributions: number
        source: string
        status: string
    }
}

// デバッグログエントリの型定義
interface DebugLogEntry {
    timestamp: string
    type: 'AppState' | 'AsyncStorage' | 'JWT' | 'API' | 'Auth' | 'Data'
    event: string
    details: any
}

// バックエンドのAPIベースURL
const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || 'http://10.200.4.2:3000').replace(/\/+$/, '')

// ストレージキー
const STORAGE_KEYS = {
    SESSION_TOKEN: 'session_token',
    USER_ID: 'user_id',
    DEBUG_LOGS: 'debug_logs',
}

// base64url形式をbase64形式に変換するヘルパー関数
const base64UrlToBase64 = (str: string): string => {
    // base64urlからbase64への変換
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/')

    // パディングを追加
    switch (base64.length % 4) {
        case 0:
            break
        case 2:
            base64 += '=='
            break
        case 3:
            base64 += '='
            break
        default:
            throw new Error('Invalid base64url string')
    }

    return base64
}

// JWTのペイロードを安全に解析するヘルパー関数
const parseJwtPayload = (token: string): any | null => {
    try {
        const parts = token.split('.')
        if (parts.length !== 3) {
            console.error('❌ JWT形式が不正です: パーツ数が3でない')
            return null
        }

        const payload = parts[1]
        const base64Payload = base64UrlToBase64(payload)
        const decodedPayload = atob(base64Payload)
        const parsedPayload = JSON.parse(decodedPayload)

        console.log('✅ JWT解析成功:', {
            header: parts[0].length,
            payload: parts[1].length,
            signature: parts[2].length,
            exp: parsedPayload.exp,
            iat: parsedPayload.iat,
            user_id: parsedPayload.user_id,
            user_name: parsedPayload.user_name,
            type: parsedPayload.type || 'unknown',
            provider: parsedPayload.provider || 'unknown',
            session_type: parsedPayload.session_type || 'unknown',
            oauth_provider: parsedPayload.oauth_provider || 'unknown',
            auth_method: parsedPayload.auth_method || 'unknown',
            fullPayload: parsedPayload, // 完全なペイロードを表示
        })

        return parsedPayload
    } catch (error) {
        console.error('❌ JWT解析エラー:', error)
        return null
    }
}

// JWT有効期限をチェックする関数
const isJwtExpired = (token: string | null): boolean => {
    if (!token) {
        console.log('🔍 JWT期限チェック: トークンがnull/undefined')
        return true
    }

    try {
        const payload = parseJwtPayload(token)
        if (!payload) {
            console.log('🔍 JWT期限チェック: ペイロード解析に失敗')
            return true
        }

        const currentTime = Math.floor(Date.now() / 1000)
        const timeLeft = payload.exp - currentTime
        const timeLeftMinutes = Math.floor(timeLeft / 60)
        const timeLeftHours = Math.floor(timeLeftMinutes / 60)
        const timeLeftDays = Math.floor(timeLeftHours / 24)
        const expired = currentTime >= payload.exp

        // 詳細なタイムスタンプ情報を表示
        const jwtDetailedLog = {
            tokenPrefix: token.substring(0, 20) + '...',
            tokenLength: token.length,
            payload: {
                iat: payload.iat,
                exp: payload.exp,
                user_id: payload.user_id,
                user_name: payload.user_name,
            },
            times: {
                current: currentTime,
                issued: payload.iat,
                expires: payload.exp,
                issuedDate: new Date(payload.iat * 1000).toISOString(),
                expiresDate: new Date(payload.exp * 1000).toISOString(),
                currentDate: new Date(currentTime * 1000).toISOString(),
            },
            duration: {
                totalLifetime: payload.exp - payload.iat,
                totalLifetimeDays: Math.floor((payload.exp - payload.iat) / (24 * 60 * 60)),
                timeSinceIssued: currentTime - payload.iat,
                timeSinceIssuedDays: Math.floor((currentTime - payload.iat) / (24 * 60 * 60)),
                timeLeft: timeLeft,
                timeLeftMinutes: timeLeftMinutes,
                timeLeftHours: timeLeftHours,
                timeLeftDays: timeLeftDays,
            },
            status: {
                expired: expired,
                valid: !expired,
                reason: expired ? 'current_time_exceeds_exp' : 'within_valid_period',
            },
        }

        console.log('🔍 JWT詳細期限チェック:', jwtDetailedLog)

        // 期限切れの場合、詳細な理由を記録
        if (expired) {
            console.log('⚠️ JWT期限切れ詳細:', {
                expiredBy: timeLeft * -1,
                expiredByMinutes: Math.floor((timeLeft * -1) / 60),
                expiredByHours: Math.floor((timeLeft * -1) / 3600),
                expiredByDays: Math.floor((timeLeft * -1) / (24 * 3600)),
                wasValidFor: payload.exp - payload.iat,
                wasValidForDays: Math.floor((payload.exp - payload.iat) / (24 * 3600)),
            })
        }

        return expired
    } catch (error) {
        console.error('❌ JWT期限チェックエラー:', error)
        return true
    }
}

const ConfigScreen = () => {
    const [user, setUser] = useState<User | null>(null)
    const [sessionToken, setSessionToken] = useState<string | null>(null)
    const [userId, setUserId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [oauthModalVisible, setOauthModalVisible] = useState(false)
    const [oauthProvider, setOauthProvider] = useState<'google' | 'github'>('google')
    const [oauthUrl, setOauthUrl] = useState<string>('')
    const [debugLogs, setDebugLogs] = useState<DebugLogEntry[]>([])
    const [showDebugLogs, setShowDebugLogs] = useState(false)

    // データAPI関連のstate
    const [userData, setUserData] = useState<UserData | null>(null)
    const [userStats, setUserStats] = useState<UserStats | null>(null)
    const [isSyncing, setIsSyncing] = useState(false)
    const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)

    const webViewRef = useRef<WebView>(null)
    const appStateRef = useRef<AppStateStatus>(AppState.currentState)
    const lastForegroundTime = useRef<number>(Date.now())

    // デバッグログを追加する関数
    const addDebugLog = async (
        type: 'AppState' | 'AsyncStorage' | 'JWT' | 'API' | 'Auth' | 'Data',
        event: string,
        details: any
    ) => {
        const logEntry: DebugLogEntry = {
            timestamp: new Date().toISOString(),
            type,
            event,
            details,
        }

        console.log(`🐛 [${type}] ${event}:`, details)

        setDebugLogs((prev) => {
            const newLogs = [...prev, logEntry].slice(-100) // 最新100件を保持
            // AsyncStorageにも保存
            AsyncStorage.setItem(STORAGE_KEYS.DEBUG_LOGS, JSON.stringify(newLogs)).catch((err) => {
                console.error('❌ デバッグログ保存エラー:', err)
            })
            return newLogs
        })
    }

    // デバッグログを読み込む関数
    const loadDebugLogs = async () => {
        try {
            const savedLogs = await AsyncStorage.getItem(STORAGE_KEYS.DEBUG_LOGS)
            if (savedLogs) {
                const parsed = JSON.parse(savedLogs)
                setDebugLogs(parsed)
                console.log('📱 デバッグログ読み込み完了:', parsed.length, '件')
            }
        } catch (error) {
            console.error('❌ デバッグログ読み込みエラー:', error)
        }
    }

    // AsyncStorage操作のヘルパー関数
    const setStorageItem = async (key: string, value: string): Promise<boolean> => {
        try {
            await AsyncStorage.setItem(key, value)
            console.log(`✅ AsyncStorage保存成功: ${key} = ${value}`)

            // 保存直後に再取得して検証
            const retrieved = await AsyncStorage.getItem(key)
            if (retrieved === value) {
                console.log(`✅ AsyncStorage検証成功: ${key} = ${retrieved}`)
                await addDebugLog('AsyncStorage', 'setItem', { key, value, verified: true })
                return true
            } else {
                console.error(`❌ AsyncStorage検証失敗: ${key} - 保存値: ${value}, 取得値: ${retrieved}`)
                await addDebugLog('AsyncStorage', 'setItem', { key, value, retrieved, verified: false })
                return false
            }
        } catch (error) {
            console.error(`❌ AsyncStorage保存エラー: ${key}`, error)
            await addDebugLog('AsyncStorage', 'setItem_error', {
                key,
                value,
                error: error instanceof Error ? error.message : String(error),
            })
            return false
        }
    }

    const getStorageItem = async (key: string): Promise<string | null> => {
        try {
            const value = await AsyncStorage.getItem(key)
            console.log(`📱 AsyncStorage取得: ${key} = ${value}`)
            await addDebugLog('AsyncStorage', 'getItem', { key, value, valueLength: value?.length || 0 })
            return value
        } catch (error) {
            console.error(`❌ AsyncStorage取得エラー: ${key}`, error)
            await addDebugLog('AsyncStorage', 'getItem_error', {
                key,
                error: error instanceof Error ? error.message : String(error),
            })
            return null
        }
    }

    const removeStorageItem = async (key: string): Promise<boolean> => {
        try {
            await AsyncStorage.removeItem(key)
            console.log(`🗑️ AsyncStorage削除: ${key}`)

            // 削除直後に再取得して検証
            const retrieved = await AsyncStorage.getItem(key)
            if (retrieved === null) {
                console.log(`✅ AsyncStorage削除検証成功: ${key}`)
                await addDebugLog('AsyncStorage', 'removeItem', { key, verified: true })
                return true
            } else {
                console.error(`❌ AsyncStorage削除検証失敗: ${key} - 削除後取得値: ${retrieved}`)
                await addDebugLog('AsyncStorage', 'removeItem', { key, retrieved, verified: false })
                return false
            }
        } catch (error) {
            console.error(`❌ AsyncStorage削除エラー: ${key}`, error)
            await addDebugLog('AsyncStorage', 'removeItem_error', {
                key,
                error: error instanceof Error ? error.message : String(error),
            })
            return false
        }
    }

    // 認証情報の保存
    const saveAuthInfo = async (token: string, userIdValue: string): Promise<boolean> => {
        console.log('🔐 認証情報を保存中...')

        const tokenSaved = await setStorageItem(STORAGE_KEYS.SESSION_TOKEN, token)
        const userIdSaved = await setStorageItem(STORAGE_KEYS.USER_ID, userIdValue)

        if (tokenSaved && userIdSaved) {
            setSessionToken(token)
            setUserId(userIdValue)
            console.log('✅ 認証情報保存完了')
            return true
        } else {
            console.error('❌ 認証情報保存失敗')
            return false
        }
    }

    // 認証情報の削除
    const clearAuthInfo = async (): Promise<void> => {
        console.log('🗑️ 認証情報を削除中...')

        await removeStorageItem(STORAGE_KEYS.SESSION_TOKEN)
        await removeStorageItem(STORAGE_KEYS.USER_ID)

        setSessionToken(null)
        setUserId(null)
        setUser(null)
        console.log('✅ 認証情報削除完了')
    }

    // 認証情報の読み込み
    const loadAuthInfo = async (): Promise<{ token: string | null; userId: string | null }> => {
        console.log('📱 認証情報を読み込み中...')

        try {
            // AsyncStorageの状態を詳細チェック
            const allKeys = await AsyncStorage.getAllKeys()
            console.log('🔍 AsyncStorage全キー:', allKeys)

            const token = await getStorageItem(STORAGE_KEYS.SESSION_TOKEN)
            const userIdValue = await getStorageItem(STORAGE_KEYS.USER_ID)

            // 詳細ログ
            console.log('📋 認証情報読み込み詳細:', {
                tokenKey: STORAGE_KEYS.SESSION_TOKEN,
                userIdKey: STORAGE_KEYS.USER_ID,
                tokenFound: !!token,
                tokenLength: token?.length || 0,
                userIdFound: !!userIdValue,
                userIdValue: userIdValue || 'なし',
                allAuthKeys: allKeys.filter((key) => key.includes('session') || key.includes('user')),
            })

            setSessionToken(token)
            setUserId(userIdValue)

            console.log(`📱 認証情報読み込み完了: token=${token ? '有' : '無'}, userId=${userIdValue ? '有' : '無'}`)
            return { token, userId: userIdValue }
        } catch (error) {
            console.error('❌ 認証情報読み込みエラー:', error)
            return { token: null, userId: null }
        }
    }

    // ユーザー情報の取得（自動ログイン時は適切なエンドポイントを使用）
    const fetchUserInfo = async (token: string, isAutoLogin: boolean = false): Promise<User | null> => {
        let endpoints: string[]

        if (isAutoLogin) {
            // 自動ログイン時はユーザー情報取得専用エンドポイントを使用
            endpoints = ['/api/auth/verify', '/api/user/me', '/api/user/profile', '/api/user']
        } else {
            // 手動での情報取得時は複数のエンドポイントを試行
            endpoints = ['/api/auth/verify', '/api/user/me', '/api/user/profile', '/api/user']
        }

        await addDebugLog('API', 'fetchUserInfo_start', {
            apiBaseUrl: API_BASE_URL,
            tokenLength: token.length,
            tokenPrefix: token.substring(0, 20),
            endpointsToTry: endpoints,
            isAutoLogin,
        })

        for (const endpoint of endpoints) {
            try {
                const fullUrl = `${API_BASE_URL}${endpoint}`
                console.log(`🔍 ユーザー情報取得試行: ${endpoint} (自動ログイン: ${isAutoLogin})`)
                console.log(`🌐 完全なURL: ${fullUrl}`)
                console.log(`🔐 使用トークン: ${token.substring(0, 20)}...`)

                await addDebugLog('API', 'request_start', {
                    endpoint,
                    fullUrl,
                    method: 'GET',
                    tokenPrefix: token.substring(0, 20),
                    isAutoLogin,
                })

                const response = await fetch(fullUrl, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                })

                console.log(`📊 API応答: ${endpoint} - Status: ${response.status}`)

                await addDebugLog('API', 'response_received', {
                    endpoint,
                    fullUrl,
                    status: response.status,
                    statusText: response.statusText,
                    headers: Object.fromEntries(response.headers.entries()),
                    isAutoLogin,
                })

                if (response.ok) {
                    const data = await response.json()
                    console.log(`✅ ユーザー情報取得成功: ${endpoint}`, data)

                    await addDebugLog('API', 'response_success', {
                        endpoint,
                        fullUrl,
                        data,
                        hasUserData: !!(data.data && data.data.user),
                        hasDirectUser: !!data.user,
                        hasDirectUserFields: !!(data.user_id && data.user_name),
                        isAutoLogin,
                    })

                    // レスポンス形式の確認: data.data.user または data.user または data 直接
                    let userInfo: any = null

                    if (data.data && data.data.user) {
                        // 形式1: { data: { user: {...} } }
                        userInfo = data.data.user
                        console.log('✅ レスポンス形式1: data.data.user')
                    } else if (data.user) {
                        // 形式2: { user: {...} }
                        userInfo = data.user
                        console.log('✅ レスポンス形式2: data.user')
                    } else if (data.user_id && data.user_name) {
                        // 形式3: 直接ユーザー情報 { user_id, user_name, ... }
                        userInfo = data
                        console.log('✅ レスポンス形式3: 直接ユーザー情報')
                    }

                    if (userInfo && userInfo.user_id) {
                        return {
                            user_id: userInfo.user_id,
                            user_name: userInfo.user_name,
                            user_icon: userInfo.user_icon,
                            email: userInfo.email,
                        }
                    } else {
                        console.warn(`⚠️ 予期しないレスポンス形式: ${endpoint}`, data)
                        console.warn(
                            '🔍 期待される形式: { data: { user: {...} } } または { user: {...} } または直接ユーザー情報'
                        )
                        await addDebugLog('API', 'response_format_unexpected', {
                            endpoint,
                            fullUrl,
                            data,
                            isAutoLogin,
                            reason: 'user_info_not_found_in_expected_structure',
                            checkedStructures: [
                                { type: 'data.data.user', found: !!(data.data && data.data.user) },
                                { type: 'data.user', found: !!data.user },
                                { type: 'direct_user_fields', found: !!(data.user_id && data.user_name) },
                            ],
                        })
                    }
                } else {
                    console.log(`❌ ユーザー情報取得失敗: ${endpoint} - ${response.status}`)

                    // レスポンスの詳細を確認
                    try {
                        const errorText = await response.text()
                        console.log(`📋 エラーレスポンス内容:`, errorText)

                        await addDebugLog('API', 'response_error', {
                            endpoint,
                            fullUrl,
                            status: response.status,
                            statusText: response.statusText,
                            errorText,
                            isAutoLogin,
                        })

                        if (response.status === 401) {
                            console.log('🔒 認証エラー: トークンが無効または期限切れです')
                            // 401の場合は他のエンドポイントも試さず早期リターン
                            return null
                        }
                    } catch (textError) {
                        console.error('❌ エラーレスポンス読み取り失敗:', textError)
                        await addDebugLog('API', 'response_read_error', {
                            endpoint,
                            fullUrl,
                            textError: textError instanceof Error ? textError.message : String(textError),
                            isAutoLogin,
                        })
                    }
                }
            } catch (error) {
                console.error(`❌ ユーザー情報取得エラー: ${endpoint}`, error)
                await addDebugLog('API', 'request_error', {
                    endpoint,
                    fullUrl: `${API_BASE_URL}${endpoint}`,
                    error:
                        error instanceof Error ?
                            {
                                name: error.name,
                                message: error.message,
                                stack: error.stack,
                            }
                        :   { message: String(error) },
                    isAutoLogin,
                })
            }
        }

        console.log('❌ 全エンドポイントでユーザー情報取得失敗')
        return null
    }

    // ユーザーデータの取得（フィットネスデータ）
    const fetchUserData = async (token: string): Promise<UserData | null> => {
        try {
            const fullUrl = `${API_BASE_URL}/api/data/user`
            console.log('🔍 ユーザーデータ取得試行:', fullUrl)
            console.log('🚶‍♂️ 歩数データを含むフィットネスデータを取得中...')

            await addDebugLog('Data', 'fetchUserData_start', {
                apiBaseUrl: API_BASE_URL,
                endpoint: '/api/data/user',
                tokenLength: token.length,
                purpose: 'フィットネスデータ（歩数含む）の取得',
            })

            const response = await fetch(fullUrl, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            })

            console.log('📊 ユーザーデータAPI応答:', response.status)

            await addDebugLog('Data', 'fetchUserData_response', {
                status: response.status,
                statusText: response.statusText,
            })

            if (response.ok) {
                const data = await response.json()
                console.log('✅ ユーザーデータ取得成功:', data)

                await addDebugLog('Data', 'fetchUserData_success', {
                    hasData: !!data.data,
                    userId: data.data?.user_id,
                    todaySteps: data.data?.today?.steps,
                    todayContributions: data.data?.today?.contributions,
                    recentExerciseCount: data.data?.recent_exercise?.length || 0,
                    recentContributionsCount: data.data?.recent_contributions?.length || 0,
                })

                if (data.success && data.data) {
                    console.log(`🚶‍♂️ 取得した歩数データ: 今日 ${data.data.today.steps} 歩`)
                    console.log(`💻 取得したコントリビューション: 今日 ${data.data.today.contributions} 回`)
                    return data.data
                } else {
                    console.warn('⚠️ ユーザーデータレスポンス形式が予期しない:', data)
                    return null
                }
            } else {
                const errorText = await response.text()
                console.log('❌ ユーザーデータ取得失敗:', response.status, errorText)

                await addDebugLog('Data', 'fetchUserData_error', {
                    status: response.status,
                    statusText: response.statusText,
                    errorText,
                })

                return null
            }
        } catch (error) {
            console.error('❌ ユーザーデータ取得エラー:', error)
            await addDebugLog('Data', 'fetchUserData_exception', {
                error: error instanceof Error ? error.message : String(error),
            })
            return null
        }
    }

    // ユーザー統計の取得
    const fetchUserStats = async (token: string): Promise<UserStats | null> => {
        try {
            const fullUrl = `${API_BASE_URL}/api/data/stats`
            console.log('🔍 ユーザー統計取得試行:', fullUrl)

            await addDebugLog('Data', 'fetchUserStats_start', {
                apiBaseUrl: API_BASE_URL,
                endpoint: '/api/data/stats',
                tokenLength: token.length,
            })

            const response = await fetch(fullUrl, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            })

            console.log('📊 ユーザー統計API応答:', response.status)

            if (response.ok) {
                const data = await response.json()
                console.log('✅ ユーザー統計取得成功:', data)

                await addDebugLog('Data', 'fetchUserStats_success', {
                    hasData: !!data.data,
                    weeklySteps: data.data?.weekly?.total_steps,
                    monthlySteps: data.data?.monthly?.total_steps,
                })

                if (data.success && data.data) {
                    return data.data
                } else {
                    console.warn('⚠️ ユーザー統計レスポンス形式が予期しない:', data)
                    return null
                }
            } else {
                const errorText = await response.text()
                console.log('❌ ユーザー統計取得失敗:', response.status, errorText)

                await addDebugLog('Data', 'fetchUserStats_error', {
                    status: response.status,
                    statusText: response.statusText,
                    errorText,
                })

                return null
            }
        } catch (error) {
            console.error('❌ ユーザー統計取得エラー:', error)
            await addDebugLog('Data', 'fetchUserStats_exception', {
                error: error instanceof Error ? error.message : String(error),
            })
            return null
        }
    }

    // データ同期
    const syncUserData = async (token: string): Promise<SyncResult | null> => {
        try {
            const fullUrl = `${API_BASE_URL}/api/data/sync`
            console.log('🔄 データ同期開始:', fullUrl)

            await addDebugLog('Data', 'syncUserData_start', {
                apiBaseUrl: API_BASE_URL,
                endpoint: '/api/data/sync',
                tokenLength: token.length,
            })

            const response = await fetch(fullUrl, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            })

            console.log('📊 データ同期API応答:', response.status)

            if (response.ok) {
                const data = await response.json()
                console.log('✅ データ同期成功:', data)

                await addDebugLog('Data', 'syncUserData_success', {
                    hasData: !!data.data,
                    exerciseStatus: data.data?.exercise_data?.status,
                    contributionStatus: data.data?.contribution_data?.status,
                })

                if (data.success && data.data) {
                    return data.data
                } else {
                    console.warn('⚠️ データ同期レスポンス形式が予期しない:', data)
                    return null
                }
            } else {
                const errorText = await response.text()
                console.log('❌ データ同期失敗:', response.status, errorText)

                await addDebugLog('Data', 'syncUserData_error', {
                    status: response.status,
                    statusText: response.statusText,
                    errorText,
                })

                return null
            }
        } catch (error) {
            console.error('❌ データ同期エラー:', error)
            await addDebugLog('Data', 'syncUserData_exception', {
                error: error instanceof Error ? error.message : String(error),
            })
            return null
        }
    }

    // OAuth URLの取得（ログイン用）
    const getOAuthUrlForLogin = async (provider: 'google' | 'github'): Promise<string | null> => {
        try {
            // ログイン専用エンドポイント（state: login_xxx形式）
            const response = await fetch(`${API_BASE_URL}/api/auth/login/${provider}`)

            if (response.ok) {
                const data = await response.json()
                console.log(`📋 ${provider} ログインURL取得レスポンス:`, data)

                if (data.success) {
                    let oauthUrl = null

                    if (provider === 'google' && data.google_oauth_url) {
                        oauthUrl = data.google_oauth_url
                    } else if (provider === 'github' && data.github_oauth_url) {
                        oauthUrl = data.github_oauth_url
                    }

                    if (oauthUrl) {
                        console.log(`✅ ${provider} ログインURL取得成功:`, oauthUrl)
                        console.log(`🔍 Intent: ${data.intent}, State: ${data.state}`)
                        return oauthUrl
                    } else {
                        console.error(`❌ ${provider} ログインURLが見つかりません:`, data)
                        return null
                    }
                } else {
                    console.error('ログインURL取得失敗: success=false', data)
                    return null
                }
            } else {
                console.error(`ログインURL取得失敗: ${response.status}`)
                const errorText = await response.text()
                console.error('エラーレスポンス:', errorText)
                return null
            }
        } catch (error) {
            console.error('ログインURL取得エラー:', error)
            return null
        }
    }

    // 新規登録用のOAuth URL取得
    const getOAuthUrlForRegister = async (provider: 'google' | 'github'): Promise<string | null> => {
        try {
            // 新規登録用のエンドポイント（state: register_xxx形式）
            const response = await fetch(`${API_BASE_URL}/api/auth/${provider}`)

            if (response.ok) {
                const data = await response.json()
                console.log(`📋 ${provider} 新規登録URL取得レスポンス:`, data)

                if (data.success) {
                    let oauthUrl = null

                    if (provider === 'google' && data.google_oauth_url) {
                        oauthUrl = data.google_oauth_url
                    } else if (provider === 'github' && data.github_oauth_url) {
                        oauthUrl = data.github_oauth_url
                    }

                    if (oauthUrl) {
                        console.log(`✅ ${provider} 新規登録URL取得成功:`, oauthUrl)
                        console.log(`🔍 Intent: ${data.intent}, State: ${data.state}`)
                        return oauthUrl
                    } else {
                        console.error(`❌ ${provider} 新規登録URLが見つかりません:`, data)
                        return null
                    }
                } else {
                    console.error('新規登録URL取得失敗: success=false', data)
                    return null
                }
            } else {
                console.error(`新規登録URL取得失敗: ${response.status}`)
                const errorText = await response.text()
                console.error('エラーレスポンス:', errorText)
                return null
            }
        } catch (error) {
            console.error('新規登録URL取得エラー:', error)
            return null
        }
    }

    // OAuth認証の処理（ログイン）
    const handleOAuthLogin = async (provider: 'google' | 'github') => {
        try {
            setIsLoading(true)
            const authUrl = await getOAuthUrlForLogin(provider)

            if (!authUrl) {
                Alert.alert('エラー', 'ログインURLの取得に失敗しました')
                return
            }

            setOauthProvider(provider)
            setOauthUrl(authUrl)
            setOauthModalVisible(true)
        } catch (error) {
            console.error('OAuth認証エラー:', error)
            Alert.alert('エラー', 'OAuth認証に失敗しました')
        } finally {
            setIsLoading(false)
        }
    }

    // OAuth認証の処理（新規登録）
    const handleOAuthRegister = async (provider: 'google' | 'github') => {
        try {
            setIsLoading(true)
            const authUrl = await getOAuthUrlForRegister(provider)

            if (!authUrl) {
                Alert.alert('エラー', '新規登録URLの取得に失敗しました')
                return
            }

            setOauthProvider(provider)
            setOauthUrl(authUrl)
            setOauthModalVisible(true)
        } catch (error) {
            console.error('OAuth新規登録エラー:', error)
            Alert.alert('エラー', 'OAuth新規登録に失敗しました')
        } finally {
            setIsLoading(false)
        }
    }

    // WebViewのナビゲーション処理
    const handleWebViewNavigationStateChange = (navState: any) => {
        const { url } = navState
        console.log('WebView URL:', url)

        // OAuth コールバック検出（fithub://oauth のスキーマ）
        const callbackScheme = 'fithub://oauth'
        if (url.startsWith(callbackScheme)) {
            console.log('✅ OAuth コールバック検出:', url)
            setOauthModalVisible(false)

            try {
                const urlParts = url.split('?')
                if (urlParts.length > 1) {
                    const urlParams = new URLSearchParams(urlParts[1])
                    const sessionToken = urlParams.get('session_token')
                    const userId = urlParams.get('user_id')
                    const userDataParam = urlParams.get('user_data')

                    console.log('🔍 コールバックパラメータ:', {
                        sessionToken: sessionToken ? '有' : '無',
                        userId: userId || '無',
                        userData: userDataParam ? '有' : '無',
                    })

                    if (sessionToken && userId) {
                        console.log('✅ OAuth認証成功')
                        saveAuthInfo(sessionToken, userId).then((success) => {
                            if (success) {
                                // ユーザー情報を取得
                                fetchUserInfo(sessionToken, false).then((userInfo) => {
                                    if (userInfo) {
                                        setUser(userInfo)
                                        Alert.alert('ログイン成功', `ようこそ ${userInfo.user_name} さん！`)
                                        // ダッシュボードデータを読み込み
                                        loadDashboardData()
                                    }
                                })
                            }
                        })
                    } else {
                        console.error('❌ OAuth認証失敗: パラメータが不足')
                        Alert.alert('エラー', '認証に失敗しました')
                    }
                } else {
                    console.error('❌ OAuth認証失敗: URLパラメータが見つかりません')
                    Alert.alert('エラー', '認証に失敗しました')
                }
            } catch (error) {
                console.error('❌ URL解析エラー:', error)
                Alert.alert('エラー', 'URLの解析に失敗しました')
            }
        }

        // サーバーのコールバックURL処理（fithub.nguyenduchuynh.com）
        if (
            url.includes('fithub.nguyenduchuynh.com/api/auth/google/callback') ||
            url.includes('fithub.nguyenduchuynh.com/api/auth/github/callback')
        ) {
            console.log('🔄 サーバーコールバック検出:', url)
            setOauthModalVisible(false)

            try {
                const urlObj = new URL(url)
                const sessionToken = urlObj.searchParams.get('session_token')
                const userId = urlObj.searchParams.get('user_id')
                const success = urlObj.searchParams.get('success')

                console.log('🔍 サーバーコールバックパラメータ:', {
                    success: success,
                    sessionToken: sessionToken ? '有' : '無',
                    userId: userId || '無',
                })

                if (success === 'true' && sessionToken && userId) {
                    console.log('✅ OAuth認証成功 (サーバー)')
                    saveAuthInfo(sessionToken, userId).then((authSuccess) => {
                        if (authSuccess) {
                            fetchUserInfo(sessionToken, false).then((userInfo) => {
                                if (userInfo) {
                                    setUser(userInfo)
                                    Alert.alert('ログイン成功', `ようこそ ${userInfo.user_name} さん！`)
                                    // ダッシュボードデータを読み込み
                                    loadDashboardData()
                                }
                            })
                        }
                    })
                } else {
                    console.error('❌ OAuth認証失敗: パラメータが不足 (サーバー)')
                    Alert.alert('エラー', '認証に失敗しました')
                }
            } catch (error) {
                console.error('❌ URL解析エラー (サーバー):', error)
                Alert.alert('エラー', 'URLの解析に失敗しました')
            }
        }

        // localhost URLの処理（開発環境用）
        if (url.includes('localhost:3001') || url.includes('localhost:3000')) {
            console.log('🔄 localhost コールバック検出:', url)
            setOauthModalVisible(false)

            try {
                const urlObj = new URL(url)

                // 全てのパラメータを取得
                const allParams = Array.from(urlObj.searchParams.entries())
                console.log('🔍 全URLパラメータ:', allParams)

                const sessionToken = urlObj.searchParams.get('session_token')
                const userDataParam = urlObj.searchParams.get('user_data')
                const oauthDataParam = urlObj.searchParams.get('oauth_data')
                const success = urlObj.searchParams.get('success')
                const errorCode = urlObj.searchParams.get('error_code')
                const suggestedAction = urlObj.searchParams.get('suggested_action')
                const error = urlObj.searchParams.get('error')

                // 新規登録フロー: Google完了→GitHub連携
                const googleSuccess = urlObj.searchParams.get('google_success')
                const tempSessionToken = urlObj.searchParams.get('temp_session_token')
                const githubOAuthUrl = urlObj.searchParams.get('github_oauth_url')
                const googleDataParam = urlObj.searchParams.get('google_data')

                console.log('🔍 localhost コールバックパラメータ詳細:', {
                    url: url,
                    success: success,
                    error: error,
                    sessionToken: sessionToken ? `有 (${sessionToken.length}文字)` : '無',
                    sessionTokenValue: sessionToken ? `${sessionToken.substring(0, 20)}...` : 'なし',
                    userData: userDataParam ? '有' : '無',
                    userDataValue: userDataParam,
                    oauthData: oauthDataParam ? '有' : '無',
                    oauthDataValue: oauthDataParam,
                    errorCode: errorCode,
                    suggestedAction: suggestedAction,
                    googleSuccess: googleSuccess,
                    tempSessionToken: tempSessionToken ? '有' : '無',
                    githubOAuthUrl: githubOAuthUrl ? '有' : '無',
                    googleData: googleDataParam ? '有' : '無',
                    allParameterCount: allParams.length,
                    allParameterKeys: allParams.map(([key, value]) => key),
                })

                // 新規登録フロー: Google認証完了、GitHub連携が必要
                if (googleSuccess === 'true' && tempSessionToken && githubOAuthUrl) {
                    try {
                        const decodedGitHubUrl = decodeURIComponent(githubOAuthUrl)
                        console.log('🔄 Google認証完了、GitHub連携を開始:', decodedGitHubUrl)

                        Alert.alert(
                            'Google認証完了',
                            'Googleアカウントの認証が完了しました。続いてGitHubアカウントとの連携を行います。',
                            [
                                {
                                    text: 'GitHub連携を続行',
                                    onPress: () => {
                                        // GitHub OAuth URLに直接遷移
                                        setOauthProvider('github')
                                        setOauthUrl(decodedGitHubUrl)
                                        setOauthModalVisible(true)
                                    },
                                },
                                { text: 'キャンセル', style: 'cancel' },
                            ]
                        )
                        return
                    } catch (parseError) {
                        console.error('❌ GitHub URL解析エラー:', parseError)
                        Alert.alert('エラー', 'GitHub連携URLの解析に失敗しました')
                        return
                    }
                }

                // 通常のログイン/登録完了フロー - 成功判定を緩和
                if (sessionToken && (success === 'true' || !error)) {
                    console.log('✅ 成功条件を満たしています')

                    // ユーザーデータの処理
                    if (userDataParam) {
                        try {
                            // URLエンコードされたJSONデータをデコードしてパース
                            const decodedUserData = decodeURIComponent(userDataParam)
                            console.log('🔍 デコード後のユーザーデータ:', decodedUserData)
                            const userData = JSON.parse(decodedUserData)

                            console.log('✅ ユーザーデータパース成功:', userData)

                            if (userData.user_id) {
                                console.log('✅ OAuth認証成功 (localhost)')
                                saveAuthInfo(sessionToken, userData.user_id).then((authSuccess) => {
                                    if (authSuccess) {
                                        // ユーザー情報を直接設定
                                        const userInfo: User = {
                                            user_id: userData.user_id,
                                            user_name: userData.user_name,
                                            user_icon: userData.user_icon,
                                            email: userData.email,
                                        }
                                        setUser(userInfo)
                                        Alert.alert('ログイン成功', `ようこそ ${userData.user_name} さん！`)
                                        // ダッシュボードデータを読み込み
                                        loadDashboardData()
                                    }
                                })
                                return // 正常終了
                            } else {
                                console.error('❌ user_idが見つかりません:', userData)
                                Alert.alert('エラー', 'ユーザーIDの取得に失敗しました')
                                return
                            }
                        } catch (parseError) {
                            console.error('❌ ユーザーデータパースエラー:', parseError)
                            console.error('❌ 生データ:', userDataParam)
                        }
                    }

                    // userDataがない場合、トークンだけでAPIから取得を試行
                    if (!userDataParam) {
                        console.log('📋 ユーザーデータなし、APIから取得試行')
                        saveAuthInfo(sessionToken, 'unknown').then((authSuccess) => {
                            if (authSuccess) {
                                fetchUserInfo(sessionToken, false).then((userInfo) => {
                                    if (userInfo) {
                                        setUser(userInfo)
                                        // userIdを正しい値で更新
                                        saveAuthInfo(sessionToken, userInfo.user_id)
                                        Alert.alert('ログイン成功', `ようこそ ${userInfo.user_name} さん！`)
                                        // ダッシュボードデータを読み込み
                                        loadDashboardData()
                                    } else {
                                        Alert.alert('エラー', 'ユーザー情報の取得に失敗しました')
                                    }
                                })
                            }
                        })
                        return // 正常終了
                    }
                } else if (success === 'false' || error === 'true' || errorCode) {
                    // エラー処理：バックエンドのAuthController仕様に対応
                    console.error('❌ OAuth認証失敗 (localhost):', {
                        success,
                        error,
                        errorCode,
                        suggestedAction,
                        hasSessionToken: !!sessionToken,
                        hasUserData: !!userDataParam,
                    })

                    if (errorCode === 'ACCOUNT_NOT_FOUND' && suggestedAction === 'register') {
                        Alert.alert(
                            'アカウントが見つかりません',
                            'このOAuthアカウントは登録されていません。新規登録しますか？',
                            [
                                { text: 'キャンセル', style: 'cancel' },
                                {
                                    text: '新規登録',
                                    onPress: () => handleOAuthRegister(oauthProvider),
                                },
                            ]
                        )
                    } else if (errorCode === 'OAUTH_ERROR') {
                        Alert.alert('OAuth認証エラー', 'OAuth認証中にエラーが発生しました。')
                    } else if (errorCode === 'TOKEN_GENERATION_ERROR') {
                        Alert.alert('トークン生成エラー', 'セッショントークンの生成に失敗しました。')
                    } else if (errorCode === 'GITHUB_ACCOUNT_ALREADY_LINKED') {
                        Alert.alert(
                            'アカウント連携エラー',
                            'このGitHubアカウントは既に他のユーザーと連携されています。'
                        )
                    } else if (errorCode === 'GOOGLE_OAUTH_DATA_MISSING') {
                        Alert.alert(
                            'セッション期限切れ',
                            'Googleの認証情報が見つかりません。最初からやり直してください。'
                        )
                    } else if (errorCode === 'UNIQUE_CONSTRAINT_VIOLATION') {
                        Alert.alert(
                            'アカウント重複エラー',
                            'このアカウント情報は既に登録されています。ログインをお試しください。'
                        )
                    } else if (errorCode === 'DUPLICATE_ACCOUNT') {
                        Alert.alert('重複アカウント', 'このアカウントは既に別の方法で登録されています。')
                    } else if (errorCode === 'EMAIL_ALREADY_EXISTS') {
                        Alert.alert('メールアドレス重複', 'このメールアドレスは既に使用されています。')
                    } else if (errorCode === 'OAUTH_ACCOUNT_ALREADY_LINKED') {
                        Alert.alert('アカウント連携済み', 'このOAuthアカウントは既に他のユーザーと連携されています。')
                    } else {
                        const message = urlObj.searchParams.get('message')
                        Alert.alert('認証エラー', message || `認証に失敗しました。エラーコード: ${errorCode}`)
                    }
                } else {
                    console.error('❌ OAuth認証失敗: 条件を満たさない (localhost)', {
                        success,
                        error,
                        errorCode,
                        hasSessionToken: !!sessionToken,
                        hasUserData: !!userDataParam,
                        googleSuccess,
                        hasTempToken: !!tempSessionToken,
                        hasGitHubUrl: !!githubOAuthUrl,
                        判定結果: {
                            successTrue: success === 'true',
                            errorFalse: !error,
                            hasToken: !!sessionToken,
                            総合判定: !!(sessionToken && (success === 'true' || !error)),
                        },
                    })

                    // より寛容な警告メッセージ
                    if (sessionToken) {
                        Alert.alert(
                            '警告',
                            'セッショントークンは取得されましたが、認証状態が不明です。手動でユーザー情報を取得してみてください。'
                        )
                    } else {
                        Alert.alert('エラー', '認証に失敗しました')
                    }
                }
            } catch (error) {
                console.error('❌ URL解析エラー (localhost):', error)
                Alert.alert('エラー', 'URLの解析に失敗しました')
            }
        }
    }

    // 自動ログイン
    const autoLogin = async () => {
        try {
            setIsLoading(true)
            console.log('🚀 アプリ起動: 自動ログイン開始')
            console.log('🕐 現在時刻:', new Date().toLocaleString())

            await addDebugLog('Auth', 'autoLogin_start', {
                timestamp: Date.now(),
                currentTime: new Date().toISOString(),
                platform: Platform.OS,
                appState: AppState.currentState,
            })

            const { token, userId } = await loadAuthInfo()
            console.log('📊 AsyncStorage読み込み結果:', {
                hasToken: !!token,
                tokenLength: token?.length || 0,
                tokenPreview: token ? `${token.substring(0, 10)}...${token.substring(token.length - 10)}` : 'なし',
                hasUserId: !!userId,
                userId: userId || 'なし',
            })

            await addDebugLog('Auth', 'loadAuthInfo_result', {
                hasToken: !!token,
                tokenLength: token?.length || 0,
                hasUserId: !!userId,
                userId: userId || null,
            })

            if (token && userId) {
                console.log('🔐 自動ログイン試行中...')
                console.log(`📋 保存されている認証情報: token=${token.substring(0, 20)}..., userId=${userId}`)

                // JWT詳細分析（期限チェック前）
                const payload = parseJwtPayload(token)
                if (payload) {
                    const currentTime = Math.floor(Date.now() / 1000)
                    const timeUntilExpiry = payload.exp - currentTime
                    const expiredCheck = currentTime >= payload.exp

                    const jwtAnalysis = {
                        iat: payload.iat,
                        exp: payload.exp,
                        currentTime: currentTime,
                        issuedAt: new Date(payload.iat * 1000).toLocaleString(),
                        expiresAt: new Date(payload.exp * 1000).toLocaleString(),
                        timeUntilExpiry: timeUntilExpiry,
                        timeUntilExpiryMinutes: Math.floor(timeUntilExpiry / 60),
                        expired: expiredCheck,
                        user_id: payload.user_id || 'なし',
                        user_name: payload.user_name || 'なし',
                    }

                    console.log('🔍 JWT詳細分析（自動ログイン時）:', jwtAnalysis)
                    await addDebugLog('JWT', 'analysis', jwtAnalysis)
                } else {
                    console.error('❌ JWT解析失敗 - トークンが破損している可能性')
                    await addDebugLog('JWT', 'parse_failed', { tokenLength: token.length })
                }

                // JWT期限チェック
                const jwtExpired = isJwtExpired(token)
                console.log('🔍 JWT期限チェック結果:', jwtExpired)
                await addDebugLog('JWT', 'expiry_check', { expired: jwtExpired })

                if (jwtExpired) {
                    console.log('⚠️ 自動ログイン: JWT期限切れ検出 - スキップ')
                    console.log('💾 認証情報は保持し、期限切れUIを表示します')
                    setSessionToken(token)
                    setUserId(userId)
                    setUser(null)
                    setIsLoading(false)
                    await addDebugLog('Auth', 'autoLogin_jwt_expired', { action: 'keep_auth_show_expired_ui' })
                    return
                }

                console.log('✅ JWT有効 - ユーザー情報取得を開始')
                await addDebugLog('Auth', 'fetchUserInfo_start', { tokenValid: true })
                const userInfo = await fetchUserInfo(token, true) // isAutoLogin: true

                if (userInfo) {
                    setUser(userInfo)
                    console.log('✅ 自動ログイン成功')
                    console.log(`👤 ログインユーザー: ${userInfo.user_name} (${userInfo.email})`)
                    await addDebugLog('Auth', 'autoLogin_success', {
                        user_id: userInfo.user_id,
                        user_name: userInfo.user_name,
                        email: userInfo.email,
                    })

                    // ダッシュボードデータを自動読み込み（歩数データ含む）
                    console.log('🔄 自動ログイン成功 - ダッシュボードデータを自動取得開始')
                    await loadDashboardData()
                } else {
                    console.log('❌ 自動ログイン失敗: ユーザー情報取得不可')
                    console.log('🔄 認証情報は保持し、手動再認証を促します')

                    // API呼び出し失敗の詳細分析
                    console.log('🔍 API呼び出し失敗の可能性:')
                    console.log('- ネットワーク接続問題')
                    console.log('- サーバー側でのJWT検証失敗')
                    console.log('- API仕様変更')
                    console.log('- JWT期限切れ（クライアント時刻ずれ）')

                    await addDebugLog('Auth', 'autoLogin_fetchUserInfo_failed', {
                        action: 'keep_auth_prompt_manual',
                        possibleCauses: [
                            'network_issue',
                            'server_jwt_validation_failed',
                            'api_spec_changed',
                            'jwt_expired_clock_skew',
                        ],
                    })
                }
            } else {
                console.log('📱 認証情報なし - ログイン画面を表示')
                console.log('🔍 詳細:', {
                    tokenExists: !!token,
                    userIdExists: !!userId,
                    reason:
                        !token ? 'トークンなし'
                        : !userId ? 'ユーザーIDなし'
                        : '不明',
                })

                await addDebugLog('Auth', 'autoLogin_no_auth_info', {
                    tokenExists: !!token,
                    userIdExists: !!userId,
                    reason:
                        !token ? 'no_token'
                        : !userId ? 'no_userId'
                        : 'unknown',
                })
            }
        } catch (error) {
            console.error('❌ 自動ログインエラー:', error)
            console.error('❌ エラー詳細:', {
                name: error instanceof Error ? error.name : 'unknown',
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
            })

            await addDebugLog('Auth', 'autoLogin_error', {
                error:
                    error instanceof Error ?
                        {
                            name: error.name,
                            message: error.message,
                            stack: error.stack,
                        }
                    :   { message: String(error) },
            })

            // エラーの場合のみ認証情報をクリア
            await clearAuthInfo()
        } finally {
            setIsLoading(false)
            console.log('🏁 自動ログイン処理完了')
            await addDebugLog('Auth', 'autoLogin_complete', {
                hasUser: !!user,
                hasSessionToken: !!sessionToken,
                hasUserId: !!userId,
            })
        }
    }

    // 初期化
    useEffect(() => {
        // デバッグログを読み込み
        loadDebugLogs()

        // AppStateの変化を監視
        const handleAppStateChange = async (nextAppState: AppStateStatus) => {
            const currentTime = Date.now()
            const timeSinceLastForeground = currentTime - lastForegroundTime.current

            await addDebugLog('AppState', 'change', {
                from: appStateRef.current,
                to: nextAppState,
                timeSinceLastForeground,
                currentTime: new Date(currentTime).toISOString(),
            })

            if (appStateRef.current === 'background' && nextAppState === 'active') {
                // バックグラウンドからフォアグラウンドに復帰
                console.log('🔄 アプリがフォアグラウンドに復帰')
                lastForegroundTime.current = currentTime

                // セッション状態を確認
                const authInfo = await loadAuthInfo()
                await addDebugLog('AppState', 'foreground_resume', {
                    hasSessionToken: !!authInfo.token,
                    hasUserId: !!authInfo.userId,
                    sessionTokenLength: authInfo.token?.length || 0,
                    jwtExpired: authInfo.token ? isJwtExpired(authInfo.token) : null,
                })

                // 必要に応じて自動ログインを試行
                if (authInfo.token && authInfo.userId && !user) {
                    console.log('🔄 フォアグラウンド復帰時に自動ログインを試行')
                    // JWT期限チェック
                    if (!isJwtExpired(authInfo.token)) {
                        console.log('✅ JWT有効 - フォアグラウンド復帰時にユーザー情報とデータを自動取得')
                        const userInfo = await fetchUserInfo(authInfo.token, true)
                        if (userInfo) {
                            setUser(userInfo)
                            console.log('✅ フォアグラウンド復帰時の自動ログイン成功')
                            // 歩数データも自動更新
                            await loadDashboardData()
                        } else {
                            console.log('❌ フォアグラウンド復帰時の自動ログイン失敗')
                        }
                    } else {
                        console.log('⚠️ フォアグラウンド復帰時: JWT期限切れ')
                    }
                }
            }

            appStateRef.current = nextAppState
        }

        const subscription = AppState.addEventListener('change', handleAppStateChange)
        autoLogin()

        return () => {
            subscription.remove()
        }
    }, [])

    // ログアウト
    const handleLogout = async () => {
        await clearAuthInfo()
        // データもクリア
        setUserData(null)
        setUserStats(null)
        setLastSyncTime(null)
        Alert.alert('ログアウト', 'ログアウトしました')
    }

    // 手動ユーザー情報取得
    const handleManualUserFetch = async () => {
        if (!sessionToken) {
            Alert.alert('エラー', 'セッショントークンがありません')
            return
        }

        // JWT期限チェック
        if (isJwtExpired(sessionToken)) {
            console.log('🔄 JWT期限切れ検出 - 自動再認証を開始')
            Alert.alert('セッション期限切れ', 'セッションの有効期限が切れています。再度ログインしますか？', [
                { text: 'キャンセル', style: 'cancel' },
                {
                    text: 'ログイン',
                    onPress: async () => {
                        await clearAuthInfo()
                        // 最後に使用したプロバイダでログインを試行
                        Alert.alert('ログイン方法を選択', 'どのアカウントでログインしますか？', [
                            {
                                text: 'Google',
                                onPress: () => handleOAuthLogin('google'),
                            },
                            {
                                text: 'GitHub',
                                onPress: () => handleOAuthLogin('github'),
                            },
                            { text: 'キャンセル', style: 'cancel' },
                        ])
                    },
                },
            ])
            return
        }

        setIsLoading(true)
        try {
            const userInfo = await fetchUserInfo(sessionToken, false) // 手動取得
            if (userInfo) {
                setUser(userInfo)
                Alert.alert('成功', 'ユーザー情報を取得しました')
                // ダッシュボードデータも再読み込み
                await loadDashboardData()
            } else {
                // JWT期限切れの可能性 - 自動再認証を試行
                console.log('🔄 ユーザー情報取得失敗 - 自動再認証を開始')
                Alert.alert('セッション期限切れ', 'セッションの有効期限が切れています。再度ログインしますか？', [
                    { text: 'キャンセル', style: 'cancel' },
                    {
                        text: 'ログイン',
                        onPress: async () => {
                            await clearAuthInfo()
                            // 最後に使用したプロバイダでログインを試行
                            Alert.alert('ログイン方法を選択', 'どのアカウントでログインしますか？', [
                                {
                                    text: 'Google',
                                    onPress: () => handleOAuthLogin('google'),
                                },
                                {
                                    text: 'GitHub',
                                    onPress: () => handleOAuthLogin('github'),
                                },
                                { text: 'キャンセル', style: 'cancel' },
                            ])
                        },
                    },
                ])
            }
        } catch (error) {
            console.error('手動ユーザー情報取得エラー:', error)
            Alert.alert('エラー', 'ユーザー情報の取得に失敗しました')
        } finally {
            setIsLoading(false)
        }
    }

    // ダッシュボードデータを読み込む
    const loadDashboardData = async () => {
        if (!sessionToken) {
            console.log('⚠️ セッショントークンがないため、データ読み込みをスキップ')
            return
        }

        try {
            console.log('📊 ダッシュボードデータ読み込み開始')
            console.log('🚶‍♂️ 歩数データを含む全データを自動取得中...')
            setIsLoading(true)

            // ユーザーデータ（歩数含む）と統計を並行取得
            const [userDataResult, userStatsResult] = await Promise.all([
                fetchUserData(sessionToken),
                fetchUserStats(sessionToken),
            ])

            if (userDataResult) {
                setUserData(userDataResult)
                console.log('✅ ユーザーデータ設定完了（歩数データ含む）')
                console.log(`📊 今日の歩数: ${userDataResult.today.steps} 歩`)
                console.log(`💻 今日のコントリビューション: ${userDataResult.today.contributions} 回`)
            }

            if (userStatsResult) {
                setUserStats(userStatsResult)
                console.log('✅ ユーザー統計設定完了')
                console.log(`📈 今週の歩数: ${userStatsResult.weekly.total_steps} 歩`)
                console.log(`📈 今月の歩数: ${userStatsResult.monthly.total_steps} 歩`)
            }

            if (!userDataResult && !userStatsResult) {
                console.log('⚠️ 両方のデータ取得に失敗')
                Alert.alert('データ取得エラー', 'フィットネスデータの取得に失敗しました。再試行してください。')
            } else {
                console.log('🎉 ダッシュボードデータ自動読み込み完了')
            }
        } catch (error) {
            console.error('❌ ダッシュボードデータ読み込みエラー:', error)
            Alert.alert('エラー', 'データの読み込み中にエラーが発生しました')
        } finally {
            setIsLoading(false)
        }
    }

    // 手動データ同期
    const handleManualSync = async () => {
        if (!sessionToken) {
            Alert.alert('エラー', 'セッショントークンがありません')
            return
        }

        try {
            setIsSyncing(true)
            console.log('🔄 手動データ同期開始')

            const syncResult = await syncUserData(sessionToken)

            if (syncResult) {
                setLastSyncTime(new Date(syncResult.synced_at))
                Alert.alert(
                    '同期完了',
                    `データ同期が完了しました！\n\n` +
                        `歩数: ${syncResult.exercise_data.steps} (${syncResult.exercise_data.status})\n` +
                        `コントリビューション: ${syncResult.contribution_data.contributions} (${syncResult.contribution_data.status})`
                )

                // データを再読み込み
                await loadDashboardData()
            } else {
                Alert.alert('同期失敗', 'データ同期に失敗しました。ネットワーク接続を確認してください。')
            }
        } catch (error) {
            console.error('❌ 手動同期エラー:', error)
            Alert.alert('エラー', 'データ同期中にエラーが発生しました')
        } finally {
            setIsSyncing(false)
        }
    }

    // データを表示用にフォーマット
    const formatNumber = (num: number): string => {
        return num.toLocaleString('ja-JP')
    }

    const formatDate = (dateString: string): string => {
        try {
            const date = new Date(dateString)
            return date.toLocaleString('ja-JP', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
            })
        } catch {
            return dateString
        }
    }

    // ストレージ確認機能
    const checkStorage = async () => {
        try {
            console.log('🔍 AsyncStorage確認開始')

            // 全キーを取得
            const allKeys = await AsyncStorage.getAllKeys()
            console.log('📋 AsyncStorage全キー:', allKeys)

            // 認証関連のキーを取得
            const sessionToken = await getStorageItem(STORAGE_KEYS.SESSION_TOKEN)
            const userId = await getStorageItem(STORAGE_KEYS.USER_ID)

            // JWT詳細分析
            let jwtInfo = ''
            if (sessionToken) {
                const payload = parseJwtPayload(sessionToken)
                if (payload) {
                    const currentTime = Math.floor(Date.now() / 1000)
                    const timeUntilExpiry = payload.exp - currentTime
                    const expired = isJwtExpired(sessionToken)

                    // トークンの生存期間を計算
                    const totalLifetime = payload.exp - payload.iat
                    const totalLifetimeDays = Math.floor(totalLifetime / (24 * 60 * 60))
                    const totalLifetimeHours = Math.floor((totalLifetime % (24 * 60 * 60)) / 3600)

                    // 経過時間を計算
                    const timeSinceIssued = currentTime - payload.iat
                    const timeSinceIssuedDays = Math.floor(timeSinceIssued / (24 * 60 * 60))
                    const timeSinceIssuedHours = Math.floor((timeSinceIssued % (24 * 60 * 60)) / 3600)

                    // 残り時間またはオーバー時間を計算
                    const absTimeLeft = Math.abs(timeUntilExpiry)
                    const leftDays = Math.floor(absTimeLeft / (24 * 60 * 60))
                    const leftHours = Math.floor((absTimeLeft % (24 * 60 * 60)) / 3600)
                    const leftMinutes = Math.floor((absTimeLeft % 3600) / 60)

                    jwtInfo = `

📊 JWT詳細分析:
• 発行時刻: ${new Date(payload.iat * 1000).toLocaleString()}
• 有効期限: ${new Date(payload.exp * 1000).toLocaleString()}
• 現在時刻: ${new Date(currentTime * 1000).toLocaleString()}

🕐 時間情報:
• トークン生存期間: ${totalLifetimeDays}日 ${totalLifetimeHours}時間
• 発行からの経過: ${timeSinceIssuedDays}日 ${timeSinceIssuedHours}時間
• ${expired ? 'オーバー時間' : '残り時間'}: ${leftDays}日 ${leftHours}時間 ${leftMinutes}分

📍 UNIX時刻:
• 発行時刻(iat): ${payload.iat}
• 有効期限(exp): ${payload.exp}
• 現在時刻: ${currentTime}
• 差分: ${timeUntilExpiry} 秒

👤 ユーザー情報:
• ユーザーID: ${payload.user_id || 'なし'}
• ユーザー名: ${payload.user_name || 'なし'}

🔍 判定結果:
• 状態: ${expired ? '❌ 期限切れ' : '✅ 有効'}
• 理由: ${expired ? `現在時刻(${currentTime}) >= 期限(${payload.exp})` : `現在時刻(${currentTime}) < 期限(${payload.exp})`}`
                } else {
                    jwtInfo = `

❌ JWT解析エラー - ペイロードの解析に失敗しました`
                }
            }

            // 認証関連キーのフィルタ
            const authKeys = allKeys.filter(
                (key) =>
                    key.includes('session') || key.includes('user') || key.includes('token') || key.includes('auth')
            )

            const storageInfo = `
🏪 AsyncStorage状態確認

📱 認証情報:
• セッショントークン: ${sessionToken ? `有 (${sessionToken.length}文字)` : '無'}
• ユーザーID: ${userId || '無'}

🔑 関連キー (${authKeys.length}個):
${authKeys.map((key) => `• ${key}`).join('\n')}

🗂️ 全キー数: ${allKeys.length}個

📊 現在の状態:
• ログイン状態: ${user ? `✅ ${user.user_name}` : '❌ 未ログイン'}
• トークン有効性: ${sessionToken && !isJwtExpired(sessionToken) ? '✅ 有効' : '❌ 無効または期限切れ'}${jwtInfo}`

            Alert.alert('📱 ストレージ確認', storageInfo, [
                {
                    text: 'サーバー時刻確認',
                    onPress: async () => {
                        try {
                            console.log('🕐 サーバー時刻確認開始')
                            const response = await fetch(`${API_BASE_URL}/health`, {
                                method: 'GET',
                            })

                            if (response.ok) {
                                const serverDate = response.headers.get('date')
                                const clientTime = new Date()
                                const serverTime = serverDate ? new Date(serverDate) : null

                                const clientUnix = Math.floor(clientTime.getTime() / 1000)
                                const serverUnix = serverTime ? Math.floor(serverTime.getTime() / 1000) : null
                                const timeDiff = serverUnix ? clientUnix - serverUnix : null

                                const timeInfo = `
🕐 時刻同期確認

⏰ クライアント時刻:
• 時刻: ${clientTime.toLocaleString()}
• UNIX: ${clientUnix}

🌐 サーバー時刻:
• 時刻: ${serverTime ? serverTime.toLocaleString() : '不明'}
• UNIX: ${serverUnix || '不明'}

📏 時刻差分:
• 差分: ${timeDiff !== null ? `${timeDiff}秒` : '不明'}
• 判定: ${
                                    timeDiff !== null ?
                                        Math.abs(timeDiff) > 60 ?
                                            '❌ 大きなずれあり'
                                        :   '✅ 正常範囲'
                                    :   '❓ 不明'
                                }

💡 注意:
差分が±30秒以上ある場合、
JWT期限判定に影響する可能性があります。`

                                Alert.alert('🕐 時刻同期確認', timeInfo)
                            } else {
                                Alert.alert('エラー', `サーバー接続失敗: ${response.status}`)
                            }
                        } catch (error) {
                            const errorMsg = error instanceof Error ? error.message : String(error)
                            Alert.alert('エラー', `時刻確認エラー: ${errorMsg}`)
                        }
                    },
                },
                {
                    text: '📋 詳細ログ',
                    onPress: () => {
                        console.log('🔍 ストレージ詳細情報:', {
                            allKeys,
                            authKeys,
                            sessionToken: sessionToken ? `${sessionToken.substring(0, 20)}...` : null,
                            userId,
                            tokenLength: sessionToken?.length || 0,
                            userState: user ? `logged_in_as_${user.user_name}` : 'not_logged_in',
                            jwtExpired: sessionToken ? isJwtExpired(sessionToken) : 'no_token',
                            fullToken: sessionToken, // 完全なトークンをログに出力（デバッグ用）
                        })
                    },
                },
                { text: 'OK', style: 'default' },
            ])
        } catch (error) {
            console.error('❌ ストレージ確認エラー:', error)
            Alert.alert('エラー', 'ストレージの確認中にエラーが発生しました')
        }
    }

    // 全ストレージ削除機能
    const clearAllStorage = async () => {
        Alert.alert(
            '⚠️ 全ストレージ削除',
            'AsyncStorage内の全てのデータを削除します。この操作は取り消せません。本当に実行しますか？',
            [
                { text: 'キャンセル', style: 'cancel' },
                {
                    text: '削除実行',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            console.log('🗑️ 全ストレージ削除開始')

                            // 削除前の状態を記録
                            const beforeKeys = await AsyncStorage.getAllKeys()
                            console.log('📋 削除前のキー一覧:', beforeKeys)

                            // 全データを削除
                            await AsyncStorage.clear()

                            // 削除後の状態を確認
                            const afterKeys = await AsyncStorage.getAllKeys()
                            console.log('📋 削除後のキー一覧:', afterKeys)

                            // 状態をクリア
                            setSessionToken(null)
                            setUserId(null)
                            setUser(null)

                            const deletedCount = beforeKeys.length
                            const remainingCount = afterKeys.length

                            console.log('✅ 全ストレージ削除完了:', {
                                deletedCount,
                                remainingCount,
                                success: remainingCount === 0,
                            })

                            Alert.alert(
                                '削除完了',
                                `${deletedCount}個のキーを削除しました。\n残りキー数: ${remainingCount}個`,
                                [
                                    {
                                        text: '詳細ログ',
                                        onPress: () => {
                                            console.log('🔍 削除詳細:', {
                                                beforeKeys,
                                                afterKeys,
                                                deletedKeys: beforeKeys.filter((key) => !afterKeys.includes(key)),
                                                remainingKeys: afterKeys,
                                            })
                                        },
                                    },
                                    { text: 'OK', style: 'default' },
                                ]
                            )
                        } catch (error) {
                            console.error('❌ 全ストレージ削除エラー:', error)
                            Alert.alert('エラー', '全ストレージ削除中にエラーが発生しました')
                        }
                    },
                },
            ]
        )
    }

    // 永続性テスト
    const testPersistence = async () => {
        const testKey = 'test_persistence'
        const testValue = `test_${Date.now()}`

        console.log('🧪 永続性テスト開始')
        const saved = await setStorageItem(testKey, testValue)

        if (saved) {
            setTimeout(async () => {
                const retrieved = await getStorageItem(testKey)
                if (retrieved === testValue) {
                    Alert.alert('テスト成功', `永続性テスト成功: ${testValue}`)
                } else {
                    Alert.alert('テスト失敗', `永続性テスト失敗: 期待値 ${testValue}, 取得値 ${retrieved}`)
                }
                await removeStorageItem(testKey)
            }, 1000)
        } else {
            Alert.alert('テスト失敗', '永続性テスト失敗: 保存に失敗')
        }
    }

    // 設定情報の確認
    const showConfig = () => {
        const redirectUri = process.env.EXPO_PUBLIC_REDIRECT_URI || 'fithub://oauth'
        const envApiUrl = process.env.EXPO_PUBLIC_API_BASE_URL
        const defaultApiUrl = 'http://10.200.4.2:3000'

        Alert.alert(
            '🔧 設定情報',
            `API Base URL: ${API_BASE_URL}

環境変数: ${envApiUrl || '未設定'}
デフォルト: ${defaultApiUrl}
実際の使用: ${API_BASE_URL}

Redirect URI: ${redirectUri}

WebClient ID: ${process.env.EXPO_PUBLIC_WEBCLIENTID?.substring(0, 20)}...

プラットフォーム: ${Platform.OS}`,
            [
                {
                    text: '📊 API URLテスト',
                    onPress: async () => {
                        try {
                            console.log('🧪 API接続テスト開始:', API_BASE_URL)
                            await addDebugLog('API', 'connection_test', {
                                apiBaseUrl: API_BASE_URL,
                                envApiUrl,
                                defaultApiUrl,
                                platform: Platform.OS,
                            })

                            const response = await fetch(`${API_BASE_URL}/health`, {
                                method: 'GET',
                            })

                            const result = `Status: ${response.status}\nURL: ${API_BASE_URL}/health`
                            Alert.alert('API接続テスト', result)
                        } catch (error) {
                            const errorMsg = error instanceof Error ? error.message : String(error)
                            Alert.alert('API接続エラー', `URL: ${API_BASE_URL}\nエラー: ${errorMsg}`)
                        }
                    },
                },
                {
                    text: '📋 詳細ログ',
                    onPress: () => {
                        console.log('📋 設定情報詳細:', {
                            API_BASE_URL,
                            REDIRECT_URI: redirectUri,
                            WEBCLIENTID: process.env.EXPO_PUBLIC_WEBCLIENTID,
                            NODE_ENV: process.env.NODE_ENV,
                            EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
                            envApiUrl,
                            defaultApiUrl,
                            platform: Platform.OS,
                            userAgent:
                                'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
                        })
                    },
                },
                { text: 'OK', style: 'default' },
            ]
        )
    }

    // ローディング表示
    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>読み込み中...</Text>
                </View>
            </SafeAreaView>
        )
    }

    // ログイン済みの場合
    if (user) {
        return (
            <SafeAreaView style={styles.container}>
                <ScrollView style={styles.scrollView}>
                    <View style={styles.userInfoContainer}>
                        <Text style={styles.title}>🏃‍♂️ Fithub ダッシュボード</Text>
                        <Text style={styles.userInfo}>👤 {user.user_name}</Text>
                        <Text style={styles.userSubInfo}>{user.email}</Text>
                    </View>

                    {/* 今日のデータ */}
                    {userData && (
                        <View style={styles.todayContainer}>
                            <Text style={styles.sectionTitle}>📊 今日のデータ ({userData.today.date})</Text>
                            <View style={styles.todayStats}>
                                <View style={styles.statItem}>
                                    <Text style={styles.statNumber}>{formatNumber(userData.today.steps)}</Text>
                                    <Text style={styles.statLabel}>歩数</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Text style={styles.statNumber}>{userData.today.contributions}</Text>
                                    <Text style={styles.statLabel}>コントリビューション</Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* 週間・月間統計 */}
                    {userStats && (
                        <View style={styles.statsContainer}>
                            <Text style={styles.sectionTitle}>📈 統計データ</Text>

                            <View style={styles.statsRow}>
                                <View style={styles.statsColumn}>
                                    <Text style={styles.statsTitle}>📅 今週</Text>
                                    <Text style={styles.statsItem}>
                                        歩数: {formatNumber(userStats.weekly.total_steps)}
                                    </Text>
                                    <Text style={styles.statsItem}>
                                        コントリビューション: {userStats.weekly.total_contributions}
                                    </Text>
                                    <Text style={styles.statsItem}>
                                        アクティブ日数: {userStats.weekly.active_days}日
                                    </Text>
                                </View>

                                <View style={styles.statsColumn}>
                                    <Text style={styles.statsTitle}>📊 今月</Text>
                                    <Text style={styles.statsItem}>
                                        歩数: {formatNumber(userStats.monthly.total_steps)}
                                    </Text>
                                    <Text style={styles.statsItem}>
                                        コントリビューション: {userStats.monthly.total_contributions}
                                    </Text>
                                    <Text style={styles.statsItem}>
                                        アクティブ日数: {userStats.monthly.active_days}日
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* 最近の運動データ */}
                    {userData && userData.recent_exercise.length > 0 && (
                        <View style={styles.recentContainer}>
                            <Text style={styles.sectionTitle}>🚶‍♂️ 最近の歩数</Text>
                            {userData.recent_exercise.slice(0, 5).map((exercise, index) => (
                                <View
                                    key={index}
                                    style={styles.recentItem}
                                >
                                    <Text style={styles.recentDate}>
                                        {new Date(exercise.day).toLocaleDateString('ja-JP')}
                                    </Text>
                                    <Text style={styles.recentValue}>
                                        {formatNumber(exercise.exercise_quantity)} 歩
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* 最近のコントリビューション */}
                    {userData && userData.recent_contributions.length > 0 && (
                        <View style={styles.recentContainer}>
                            <Text style={styles.sectionTitle}>💻 最近のコントリビューション</Text>
                            {userData.recent_contributions.slice(0, 5).map((contribution, index) => (
                                <View
                                    key={index}
                                    style={styles.recentItem}
                                >
                                    <Text style={styles.recentDate}>
                                        {new Date(contribution.day).toLocaleDateString('ja-JP')}
                                    </Text>
                                    <Text style={styles.recentValue}>{contribution.count} 回</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* 最終更新時刻 */}
                    {userData && (
                        <View style={styles.updateContainer}>
                            <Text style={styles.updateText}>最終更新: {formatDate(userData.last_updated)}</Text>
                            {lastSyncTime && (
                                <Text style={styles.updateText}>
                                    最終同期: {formatDate(lastSyncTime.toISOString())}
                                </Text>
                            )}
                        </View>
                    )}

                    {/* データが読み込まれていない場合の表示 */}
                    {!userData && !userStats && !isLoading && (
                        <View style={styles.noDataContainer}>
                            <Text style={styles.noDataText}>📭 データがまだ読み込まれていません</Text>
                            <Text style={styles.noDataSubText}>
                                手動でデータを同期するか、データ読み込みボタンを押してください。
                            </Text>
                        </View>
                    )}

                    <View style={styles.buttonContainer}>
                        <Button
                            title={isSyncing ? '🔄 同期中...' : '🔄 データ同期'}
                            onPress={handleManualSync}
                            disabled={isSyncing || isLoading}
                            color='#28a745'
                        />

                        <Button
                            title={isLoading ? '📊 読み込み中...' : '📊 データ再読み込み'}
                            onPress={loadDashboardData}
                            disabled={isLoading || isSyncing}
                            color='#007bff'
                        />

                        <Button
                            title='👤 ユーザー情報再取得'
                            onPress={handleManualUserFetch}
                            disabled={isLoading}
                        />

                        <Button
                            title='📱 ストレージを確認'
                            onPress={checkStorage}
                            color='#6c757d'
                        />

                        <Button
                            title='🗑️ 全ストレージ削除'
                            onPress={clearAllStorage}
                            color='#dc3545'
                        />

                        <Button
                            title='🚪 ログアウト'
                            onPress={handleLogout}
                            color='#ff6b6b'
                        />
                    </View>
                </ScrollView>
            </SafeAreaView>
        )
    }

    // JWT期限切れの場合（sessionTokenはあるがuserがnull）
    if (sessionToken && !user) {
        return (
            <SafeAreaView style={styles.container}>
                <ScrollView style={styles.scrollView}>
                    <View style={styles.tokenExpiredContainer}>
                        <Text style={styles.title}>⚠️ セッション期限切れ</Text>
                        <Text style={styles.expiredMessage}>
                            セッショントークンが保存されていますが、{'\n'}
                            有効期限が切れている可能性があります。{'\n'}
                            再度ログインしてください。
                        </Text>

                        <View style={styles.buttonContainer}>
                            <Button
                                title='🔄 ユーザー情報を再取得'
                                onPress={handleManualUserFetch}
                                disabled={isLoading}
                                color='#28a745'
                            />
                            <Button
                                title='🔍 Googleでログイン'
                                onPress={() => handleOAuthLogin('google')}
                                disabled={isLoading}
                            />
                            <Button
                                title='🔍 GitHubでログイン'
                                onPress={() => handleOAuthLogin('github')}
                                disabled={isLoading}
                            />
                            <Button
                                title='🗑️ 認証情報をクリア'
                                onPress={async () => {
                                    await clearAuthInfo()
                                    Alert.alert('完了', '認証情報をクリアしました')
                                }}
                                color='#dc3545'
                            />
                            <Button
                                title='🗑️ 全ストレージ削除'
                                onPress={clearAllStorage}
                                color='#dc3545'
                            />
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        )
    }

    // ログインしていない場合
    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.loginContainer}>
                    <Text style={styles.title}>ログイン</Text>
                    <Text style={styles.subtitle}>既存のアカウントでログイン</Text>

                    <View style={styles.buttonContainer}>
                        <Button
                            title='Googleでログイン'
                            onPress={() => handleOAuthLogin('google')}
                            disabled={isLoading}
                        />
                        <Button
                            title='GitHubでログイン'
                            onPress={() => handleOAuthLogin('github')}
                            disabled={isLoading}
                        />
                    </View>

                    <Text style={styles.separator}>または</Text>

                    <Text style={styles.title}>新規登録</Text>
                    <Text style={styles.subtitle}>新しいアカウントを作成</Text>

                    <View style={styles.buttonContainer}>
                        <Button
                            title='Googleで新規登録'
                            onPress={() => handleOAuthRegister('google')}
                            disabled={isLoading}
                            color='#34a853'
                        />
                        <Button
                            title='GitHubで新規登録'
                            onPress={() => handleOAuthRegister('github')}
                            disabled={isLoading}
                            color='#333'
                        />
                    </View>

                    <View style={styles.buttonContainer}>
                        {sessionToken && (
                            <Button
                                title='ユーザー情報再取得'
                                onPress={handleManualUserFetch}
                            />
                        )}
                    </View>

                    <View style={styles.center}>
                        <Button
                            title='ストレージを確認'
                            onPress={checkStorage}
                        />
                        <View style={styles.space} />
                        <Button
                            title='🔧 設定確認'
                            onPress={showConfig}
                            color='#6f42c1'
                        />
                        <View style={styles.space} />
                        <Button
                            title='� デバッグログ表示'
                            onPress={() => setShowDebugLogs(true)}
                            color='#17a2b8'
                        />
                        <View style={styles.space} />
                        <Button
                            title='�🗑️ 全ストレージ削除'
                            onPress={clearAllStorage}
                            color='#dc3545'
                        />
                    </View>
                </View>
            </ScrollView>

            {/* OAuth WebView Modal */}
            <Modal
                visible={oauthModalVisible}
                animationType='slide'
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            {oauthProvider === 'google' ? 'Google' : 'GitHub'}でログイン
                        </Text>
                        <Button
                            title='キャンセル'
                            onPress={() => setOauthModalVisible(false)}
                        />
                    </View>
                    <WebView
                        ref={webViewRef}
                        source={{ uri: oauthUrl }}
                        onNavigationStateChange={handleWebViewNavigationStateChange}
                        userAgent='Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        startInLoadingState={true}
                        scalesPageToFit={true}
                        allowsInlineMediaPlayback={true}
                        mediaPlaybackRequiresUserAction={false}
                        mixedContentMode='compatibility'
                        thirdPartyCookiesEnabled={true}
                        sharedCookiesEnabled={true}
                        style={styles.webView}
                    />
                </SafeAreaView>
            </Modal>

            {/* Debug Logs Modal */}
            <Modal
                visible={showDebugLogs}
                animationType='slide'
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>📊 デバッグログ ({debugLogs.length}件)</Text>
                        <Button
                            title='閉じる'
                            onPress={() => setShowDebugLogs(false)}
                        />
                    </View>
                    <ScrollView style={styles.debugLogsContainer}>
                        {debugLogs
                            .slice(-50)
                            .reverse()
                            .map((log, index) => (
                                <View
                                    key={index}
                                    style={styles.debugLogEntry}
                                >
                                    <Text style={styles.debugLogTimestamp}>
                                        {new Date(log.timestamp).toLocaleString()}
                                    </Text>
                                    <Text style={styles.debugLogType}>
                                        [{log.type}] {log.event}
                                    </Text>
                                    <Text style={styles.debugLogDetails}>{JSON.stringify(log.details, null, 2)}</Text>
                                </View>
                            ))}
                        {debugLogs.length === 0 && (
                            <View style={styles.debugLogEntry}>
                                <Text style={styles.debugLogDetails}>デバッグログがありません</Text>
                            </View>
                        )}
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollView: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 18,
        color: '#666',
    },
    loginContainer: {
        padding: 20,
    },
    userInfoContainer: {
        padding: 20,
        backgroundColor: '#fff',
        marginBottom: 10,
        borderRadius: 8,
        marginHorizontal: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 15,
    },
    separator: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginVertical: 20,
        color: '#888',
    },
    userInfo: {
        fontSize: 16,
        marginBottom: 10,
        color: '#333',
    },
    debugContainer: {
        padding: 15,
        backgroundColor: '#f0f0f0',
        marginBottom: 10,
        borderRadius: 8,
        marginHorizontal: 20,
    },
    debugTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    debugText: {
        fontSize: 14,
        marginBottom: 5,
        color: '#666',
    },
    storageContainer: {
        padding: 15,
        backgroundColor: '#e8f4f8',
        marginBottom: 10,
        borderRadius: 8,
        marginHorizontal: 20,
    },
    storageTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    storageText: {
        fontSize: 12,
        color: '#666',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    appStateContainer: {
        padding: 15,
        backgroundColor: '#fff8e1',
        marginBottom: 10,
        borderRadius: 8,
        marginHorizontal: 20,
    },
    appStateTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    appStateText: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    buttonContainer: {
        padding: 20,
        gap: 10,
    },
    tokenExpiredContainer: {
        padding: 20,
        backgroundColor: '#fff3cd',
        marginBottom: 10,
        borderRadius: 8,
        marginHorizontal: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#ffc107',
    },
    expiredMessage: {
        fontSize: 16,
        color: '#856404',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 24,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    webView: {
        flex: 1,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    space: {
        height: 10,
    },
    debugLogsContainer: {
        flex: 1,
        padding: 10,
    },
    debugLogEntry: {
        backgroundColor: '#f8f9fa',
        padding: 10,
        marginBottom: 10,
        borderRadius: 5,
        borderLeftWidth: 3,
        borderLeftColor: '#007bff',
    },
    debugLogTimestamp: {
        fontSize: 12,
        color: '#6c757d',
        marginBottom: 5,
    },
    debugLogType: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#343a40',
        marginBottom: 5,
    },
    debugLogDetails: {
        fontSize: 12,
        color: '#495057',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    // ダッシュボード用の新しいスタイル
    userSubInfo: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 5,
    },
    todayContainer: {
        backgroundColor: '#e3f2fd',
        margin: 20,
        marginBottom: 10,
        padding: 20,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#2196f3',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1976d2',
        marginBottom: 15,
        textAlign: 'center',
    },
    todayStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 10,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statNumber: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1976d2',
        marginBottom: 5,
    },
    statLabel: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    statsContainer: {
        backgroundColor: '#f3e5f5',
        margin: 20,
        marginBottom: 10,
        padding: 20,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#9c27b0',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    statsColumn: {
        flex: 1,
        paddingHorizontal: 10,
    },
    statsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#7b1fa2',
        marginBottom: 10,
        textAlign: 'center',
    },
    statsItem: {
        fontSize: 14,
        color: '#333',
        marginBottom: 5,
        textAlign: 'center',
    },
    recentContainer: {
        backgroundColor: '#e8f5e8',
        margin: 20,
        marginBottom: 10,
        padding: 20,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#4caf50',
    },
    recentItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    recentDate: {
        fontSize: 14,
        color: '#666',
        flex: 1,
    },
    recentValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2e7d32',
        textAlign: 'right',
    },
    updateContainer: {
        backgroundColor: '#fff3e0',
        margin: 20,
        marginBottom: 10,
        padding: 15,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#ff9800',
    },
    updateText: {
        fontSize: 12,
        color: '#e65100',
        textAlign: 'center',
        marginBottom: 3,
    },
    noDataContainer: {
        backgroundColor: '#fafafa',
        margin: 20,
        marginBottom: 10,
        padding: 30,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#e0e0e0',
        borderStyle: 'dashed',
        alignItems: 'center',
    },
    noDataText: {
        fontSize: 18,
        color: '#9e9e9e',
        textAlign: 'center',
        marginBottom: 10,
    },
    noDataSubText: {
        fontSize: 14,
        color: '#757575',
        textAlign: 'center',
        lineHeight: 20,
    },
})

export default ConfigScreen
