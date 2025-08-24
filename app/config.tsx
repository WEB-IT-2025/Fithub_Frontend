import React, { useEffect, useRef, useState } from 'react'

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

// 基本型定義
interface User {
    user_id: string
    user_name: string
    user_icon: string
    email: string
}

interface UserData {
    user_id: string
    today: {
        date: string
        steps: number
        contributions: number
    }
    recent_exercise: Array<{
        day: string
        exercise_quantity: number
    }>
    recent_contributions: Array<{
        day: string
        count: string
    }>
    last_updated: string
}

interface UserStats {
    weekly: {
        total_steps: number
        total_contributions: number
        active_days: number
    }
    monthly: {
        total_steps: number
        total_contributions: number
        active_days: number
    }
}

interface SyncResult {
    synced_at: string
    exercise_data: {
        steps: number
        status: string
    }
    contribution_data: {
        contributions: number
        status: string
    }
}

// APIベースURLとストレージキー
const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || 'http://10.200.4.2:3000').replace(/\/+$/, '')
const STORAGE_KEYS = {
    SESSION_TOKEN: 'session_token',
    USER_ID: 'user_id',
}

// JWT解析ヘルパー
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

// JWT期限チェック
const isJwtExpired = (token: string | null): boolean => {
    if (!token) return true
    const payload = parseJwtPayload(token)
    if (!payload) return true
    return Math.floor(Date.now() / 1000) >= payload.exp
}

const ConfigScreen = () => {
    const [user, setUser] = useState<User | null>(null)
    const [sessionToken, setSessionToken] = useState<string | null>(null)
    const [userId, setUserId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [oauthModalVisible, setOauthModalVisible] = useState(false)
    const [oauthProvider, setOauthProvider] = useState<'google' | 'github'>('google')
    const [oauthUrl, setOauthUrl] = useState<string>('')
    const [userData, setUserData] = useState<UserData | null>(null)
    const [userStats, setUserStats] = useState<UserStats | null>(null)
    const [isSyncing, setIsSyncing] = useState(false)
    const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)

    const webViewRef = useRef<WebView>(null)
    const appStateRef = useRef<AppStateStatus>(AppState.currentState)
    const lastForegroundTime = useRef<number>(Date.now())

    // ダミーのaddDebugLog関数（デバッグログを削除）
    const addDebugLog = async (type: string, event: string, details: any) => {
        // デバッグログ機能を削除したため、何もしない
    }

    // ダミーのloadDebugLogs関数
    const loadDebugLogs = async () => {
        // デバッグログ機能を削除したため、何もしない
    }

    // ストレージヘルパー関数
    const getStorageItem = async (key: string): Promise<string | null> => {
        try {
            return await AsyncStorage.getItem(key)
        } catch {
            return null
        }
    }

    const setStorageItem = async (key: string, value: string): Promise<boolean> => {
        try {
            await AsyncStorage.setItem(key, value)
            return true
        } catch {
            return false
        }
    }

    const removeStorageItem = async (key: string): Promise<boolean> => {
        try {
            await AsyncStorage.removeItem(key)
            return true
        } catch {
            return false
        }
    }

    // 日本時間（JST）のヘルパー関数
    const getJSTTime = () => {
        const now = new Date()
        const jstTime = new Date(now.getTime() + 9 * 60 * 60 * 1000) // UTC+9
        return jstTime.toISOString().replace('Z', '+09:00')
    }

    // 認証情報の保存
    const saveAuthInfo = async (token: string, userIdValue: string): Promise<boolean> => {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, token)
            await AsyncStorage.setItem(STORAGE_KEYS.USER_ID, userIdValue)
            setSessionToken(token)
            setUserId(userIdValue)
            console.log('✅ 認証情報保存完了')
            return true
        } catch (error) {
            console.error('❌ 認証情報保存失敗:', error)
            return false
        }
    }

    // 認証情報の削除
    const clearAuthInfo = async (): Promise<void> => {
        try {
            await AsyncStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN)
            await AsyncStorage.removeItem(STORAGE_KEYS.USER_ID)
            setSessionToken(null)
            setUserId(null)
            setUser(null)
            setUserData(null)
            console.log('✅ 認証情報削除完了')
        } catch (error) {
            console.error('❌ 認証情報削除エラー:', error)
        }
    }

    // 認証情報の読み込み
    const loadAuthInfo = async (): Promise<{ token: string | null; userId: string | null }> => {
        try {
            const token = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_TOKEN)
            const userIdValue = await AsyncStorage.getItem(STORAGE_KEYS.USER_ID)
            setSessionToken(token)
            setUserId(userIdValue)
            return { token, userId: userIdValue }
        } catch (error) {
            console.error('❌ 認証情報読み込みエラー:', error)
            return { token: null, userId: null }
        }
    }

    // ユーザー情報の取得（JWTトークンからデコード + 必要に応じてAPI確認）
    const fetchUserInfo = async (token: string): Promise<User | null> => {
        try {
            console.log('🔍 ユーザー情報取得開始（JWTデコード方式）')
            console.log('Client time (JST):', getJSTTime())
            console.log('Client timestamp:', Math.floor(Date.now() / 1000))
            console.log('📋 トークン長:', token.length)
            console.log('📋 トークン全文:', token)

            // まず、JWTトークンからユーザー情報をデコード
            const payload = parseJwtPayload(token)
            if (payload && payload.user_id && payload.user_name) {
                console.log('✅ JWTからユーザー情報取得成功:', payload.user_name)

                // JWTペイロードからユーザー情報を構築
                const userInfo: User = {
                    user_id: payload.user_id,
                    user_name: payload.user_name,
                    user_icon: payload.user_icon || null,
                    email: payload.email || null,
                }

                console.log('📊 JWTデコード結果:', userInfo)
                return userInfo
            }

            // JWTデコードが失敗した場合、/api/data/userエンドポイントを試行（動作することが確認済み）
            console.log('🔄 JWTデコード失敗 - /api/data/userエンドポイントで確認')
            console.log('📋 API URL:', `${API_BASE_URL}/api/data/user`)

            const response = await fetch(`${API_BASE_URL}/api/data/user`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            })

            console.log('📡 ユーザーデータAPI応答:', response.status)
            console.log('📡 応答ヘッダー:', {
                'content-type': response.headers.get('content-type'),
                'content-length': response.headers.get('content-length'),
            })

            if (response.ok) {
                const data = await response.json()
                console.log('✅ ユーザーデータAPI成功 - レスポンス:', data)

                if (data.success && data.data && data.data.user_id) {
                    // /api/data/userのレスポンスからユーザー情報を抽出
                    const userInfo: User = {
                        user_id: data.data.user_id,
                        user_name: data.data.user_name || 'Unknown User',
                        user_icon: data.data.user_icon || null,
                        email: data.data.email || null,
                    }
                    console.log('✅ ユーザーデータAPIからユーザー情報取得成功:', userInfo.user_name)
                    return userInfo
                } else {
                    console.log('❌ ユーザーデータAPI: 有効なユーザー情報が見つかりません', data)
                }
            } else {
                const errorText = await response.text()
                console.log('❌ ユーザーデータAPI失敗:', {
                    status: response.status,
                    statusText: response.statusText,
                    errorText,
                })
            }
            return null
        } catch (error) {
            console.error('❌ ユーザー情報取得エラー:', error)
            return null
        }
    }

    // ユーザーデータの取得（歩数データ）- ネイティブfetch
    const fetchUserData = async (token: string): Promise<UserData | null> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/data/user`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            })

            if (response.ok) {
                const data = await response.json()
                if (data.success && data.data) {
                    console.log(`🚶‍♂️ 今日の歩数: ${data.data.today.steps} 歩`)
                    return data.data
                }
            }
            return null
        } catch (error) {
            console.error('❌ ユーザーデータ取得エラー:', error)
            return null
        }
    }

    // WebView API ハンドラーマップ（グローバル）
    const webViewApiHandlers = useRef(new Map<string, (message: any) => void>()).current

    // WebView経由でのAPI呼び出し（ブラウザ環境でのJWT発行対応）
    const fetchViaWebView = async (url: string, options: RequestInit = {}): Promise<any> => {
        return new Promise((resolve, reject) => {
            const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

            // WebViewに注入するJavaScript
            const script = `
                (function() {
                    console.log('🌐 WebView API呼び出し開始: ${url}');
                    
                    fetch('${url}', ${JSON.stringify(options)})
                        .then(response => {
                            console.log('📡 WebView API応答:', response.status);
                            return response.json().then(data => ({
                                status: response.status,
                                ok: response.ok,
                                data: data
                            }));
                        })
                        .then result => {
                            console.log('✅ WebView API成功:', result);
                            if (window.ReactNativeWebView) {
                                window.ReactNativeWebView.postMessage(JSON.stringify({
                                    type: 'API_RESPONSE',
                                    requestId: '${requestId}',
                                    success: true,
                                    result: result
                                }));
                            } else {
                                console.error('❌ ReactNativeWebView not available');
                            }
                        })
                        .catch(error => {
                            console.error('❌ WebView API失敗:', error);
                            if (window.ReactNativeWebView) {
                                window.ReactNativeWebView.postMessage(JSON.stringify({
                                    type: 'API_RESPONSE',
                                    requestId: '${requestId}',
                                    success: false,
                                    error: error.message
                                }));
                            } else {
                                console.error('❌ ReactNativeWebView not available for error reporting');
                            }
                        });
                })();
                true;
            `

            // WebViewが利用可能かチェック
            if (webViewRef.current) {
                // タイムアウト処理
                const timeoutId = setTimeout(() => {
                    webViewApiHandlers.delete(requestId)
                    reject(new Error('WebView API timeout'))
                }, 10000)

                // ハンドラーを登録
                webViewApiHandlers.set(requestId, (message: any) => {
                    clearTimeout(timeoutId)
                    webViewApiHandlers.delete(requestId)

                    if (message.success) {
                        resolve(message.result)
                    } else {
                        reject(new Error(message.error))
                    }
                })

                console.log('🚀 WebView JavaScript注入開始:', requestId)
                webViewRef.current.injectJavaScript(script)
            } else {
                reject(new Error('WebView not available'))
            }
        })
    }

    // WebViewメッセージハンドラー
    const handleWebViewMessage = (event: any) => {
        try {
            const message = JSON.parse(event.nativeEvent.data)
            console.log('📨 WebView メッセージ受信:', message)

            if (message.type === 'API_RESPONSE' && message.requestId) {
                const handler = webViewApiHandlers.get(message.requestId)
                if (handler) {
                    handler(message)
                    return
                }
            }

            // 既存のメッセージ処理も継続
            console.log('📨 通常のWebViewメッセージ処理:', message)
        } catch (error) {
            console.error('❌ WebView メッセージ解析エラー:', error)
        }
    }

    // WebView経由でのユーザーデータ取得
    const fetchUserDataViaWebView = async (token: string): Promise<UserData | null> => {
        try {
            console.log('🌐 WebView経由でユーザーデータ取得開始')

            const options = {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'User-Agent':
                        'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
                },
            }

            const result = await fetchViaWebView(`${API_BASE_URL}/api/data/user`, options)

            if (result.ok && result.data?.success && result.data?.data) {
                console.log('✅ WebView経由でユーザーデータ取得成功')
                console.log(`🚶‍♂️ 今日の歩数: ${result.data.data.today.steps} 歩 (WebView経由)`)
                return result.data.data
            } else {
                console.log('❌ WebView経由でユーザーデータ取得失敗:', result)
                return null
            }
        } catch (error) {
            console.error('❌ WebView経由ユーザーデータ取得エラー:', error)
            return null
        }
    }

    // フォールバック機能付きユーザーデータ取得（ネイティブ → WebView）
    const fetchUserDataWithFallback = async (token: string): Promise<UserData | null> => {
        console.log('📊 フォールバック機能付きユーザーデータ取得開始')

        // まずネイティブfetchを試行
        try {
            console.log('🔄 1. ネイティブfetchでユーザーデータ取得試行')
            const nativeResult = await fetchUserData(token)
            if (nativeResult) {
                console.log('✅ ネイティブfetch成功 - ユーザーデータ取得完了')
                return nativeResult
            }
        } catch (error) {
            console.log('❌ ネイティブfetch失敗:', error)
        }

        // ネイティブが失敗した場合、WebViewフォールバックを試行
        try {
            console.log('🔄 2. WebViewフォールバック試行（ブラウザ環境でのJWT対応）')
            const webViewResult = await fetchUserDataViaWebView(token)
            if (webViewResult) {
                console.log('✅ WebViewフォールバック成功 - ユーザーデータ取得完了')
                return webViewResult
            }
        } catch (error) {
            console.log('❌ WebViewフォールバック失敗:', error)
        }

        console.log('❌ 両方の方法でユーザーデータ取得に失敗')
        return null
    }

    // ユーザー情報取得（ネイティブfetchのみ）
    const fetchUserInfoWithFallback = async (token: string): Promise<User | null> => {
        console.log('🔐 ユーザー情報取得開始（ネイティブfetchのみ）')

        try {
            console.log('🔄 ネイティブfetchでユーザー情報取得試行')
            const result = await fetchUserInfo(token)
            if (result) {
                console.log('✅ ネイティブfetch成功 - ユーザー情報取得完了')
                
                // ユーザー情報取得成功時にユーザーIDを保存
                if (result.user_id) {
                    console.log('💾 fetchUserInfo成功 - ユーザーID保存:', result.user_id)
                    await setStorageItem(STORAGE_KEYS.USER_ID, result.user_id)
                    setUserId(result.user_id)
                }
                
                return result
            } else {
                console.log('❌ ユーザー情報取得失敗')
                return null
            }
        } catch (error) {
            console.log('❌ ネイティブfetch失敗:', error)
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
                    // sync成功時にユーザーIDも保存
                    const payload = parseJwtPayload(token)
                    if (payload && payload.user_id) {
                        console.log('💾 syncUserData成功 - ユーザーID保存:', payload.user_id)
                        await setStorageItem(STORAGE_KEYS.USER_ID, payload.user_id)
                        // setUserIdは呼び出し元で行う
                    }
                    
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
            // コールバックURLを追加（API仕様に従って）
            const callbackUrl = encodeURIComponent('fithub://oauth')
            
            // ログイン専用エンドポイント（state: login_xxx形式）
            const apiUrl = `${API_BASE_URL}/api/auth/login/${provider}?callback_url=${callbackUrl}`
            console.log(`🔍 ${provider} ログインAPI呼び出し:`, apiUrl)
            
            const response = await fetch(apiUrl)

            if (response.ok) {
                const data = await response.json()
                console.log(`📋 ${provider} ログインURL取得レスポンス:`, data)

                if (data.success) {
                    // 実際のAPIレスポンス形式に合わせて修正
                    const oauthUrl = data.google_oauth_url || data.github_oauth_url
                    
                    if (oauthUrl) {
                        console.log(`✅ ${provider} ログインURL取得成功:`, oauthUrl)
                        console.log(`🔍 State: ${data.state}`)
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
            // コールバックURLを追加（API仕様に従って）
            const callbackUrl = encodeURIComponent('fithub://oauth')
            
            // 新規登録用のエンドポイント（state: register_xxx形式）
            const apiUrl = `${API_BASE_URL}/api/auth/${provider}?callback_url=${callbackUrl}`
            console.log(`🔍 ${provider} 新規登録API呼び出し:`, apiUrl)
            
            const response = await fetch(apiUrl)

            if (response.ok) {
                const data = await response.json()
                console.log(`📋 ${provider} 新規登録URL取得レスポンス:`, data)

                if (data.success) {
                    // 実際のAPIレスポンス形式に合わせて修正
                    const oauthUrl = data.google_oauth_url || data.github_oauth_url
                    
                    if (oauthUrl) {
                        console.log(`✅ ${provider} 新規登録URL取得成功:`, oauthUrl)
                        console.log(`🔍 State: ${data.state}`)
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
            console.log('Client time (JST):', getJSTTime())
            console.log('Client timestamp:', Math.floor(Date.now() / 1000))
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
                                fetchUserInfoWithFallback(sessionToken).then((userInfo) => {
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
                            fetchUserInfoWithFallback(sessionToken).then((userInfo) => {
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
                                fetchUserInfoWithFallback(sessionToken).then((userInfo) => {
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
            console.log('Client time (JST):', getJSTTime())
            console.log('Client timestamp:', Math.floor(Date.now() / 1000))

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
                tokenFull: token || 'なし',
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
                const userInfo = await fetchUserInfoWithFallback(token) // 自動ログイン（ネイティブfetchのみ）

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
        console.log('🎯 Config画面初期化開始')
        console.log('Client time (JST):', getJSTTime())
        console.log('Client timestamp:', Math.floor(Date.now() / 1000))

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
                        console.log(
                            '✅ JWT有効 - フォアグラウンド復帰時にユーザー情報とデータを自動取得（ネイティブfetchのみ）'
                        )
                        const userInfo = await fetchUserInfoWithFallback(authInfo.token)
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
            const userInfo = await fetchUserInfoWithFallback(sessionToken) // 手動取得（ネイティブfetchのみ）
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
            console.log('🚶‍♂️ 歩数データを含む全データを自動取得中（歩数データはWebViewフォールバック付き）...')
            setIsLoading(true)

            // ユーザーデータ（歩数含む）と統計を並行取得 - 歩数データのみWebViewフォールバック付き
            const [userDataResult, userStatsResult] = await Promise.all([
                fetchUserDataWithFallback(sessionToken),
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
                
                // JWTからユーザーIDを抽出して保存
                const payload = parseJwtPayload(sessionToken)
                if (payload && payload.user_id) {
                    console.log('💾 sync成功 - ユーザーID保存:', payload.user_id)
                    await setStorageItem(STORAGE_KEYS.USER_ID, payload.user_id)
                    setUserId(payload.user_id)
                } else {
                    console.warn('⚠️ JWTからユーザーIDを取得できませんでした')
                }
                
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
                    <Text style={styles.title}>Fithub</Text>
                    <Text style={styles.subtitle}>アカウントでログイン</Text>

                    <View style={styles.buttonContainer}>
                        <Button
                            title='🔑 Googleでログイン'
                            onPress={() => handleOAuthLogin('google')}
                            disabled={isLoading}
                            color='#4285f4'
                        />
                        <Button
                            title='🔑 GitHubでログイン'
                            onPress={() => handleOAuthLogin('github')}
                            disabled={isLoading}
                            color='#333'
                        />
                    </View>

                    <Text style={styles.separatorText}>または</Text>

                    <Text style={styles.registerSubtitle}>新規アカウント作成</Text>
                    <View style={styles.buttonContainer}>
                        <Button
                            title='📝 Googleで新規登録'
                            onPress={() => handleOAuthRegister('google')}
                            disabled={isLoading}
                            color='#34a853'
                        />
                        <Button
                            title='📝 GitHubで新規登録'
                            onPress={() => handleOAuthRegister('github')}
                            disabled={isLoading}
                            color='#24292e'
                        />
                    </View>

                    {sessionToken && (
                        <View style={styles.buttonContainer}>
                            <Button
                                title='ユーザー情報再取得'
                                onPress={handleManualUserFetch}
                            />
                        </View>
                    )}
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
                        onMessage={handleWebViewMessage}
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
    separatorText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginVertical: 20,
        fontWeight: '500',
    },
    registerSubtitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 15,
        marginTop: 5,
    },
})

export default ConfigScreen
