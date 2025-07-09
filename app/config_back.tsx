import React, { useCallback, useEffect, useRef, useState } from 'react'

import AsyncStorage from '@react-native-async-storage/async-storage'
import {
    Alert,
    AppState,
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

// バックエンドのAPIベースURL
const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || 'http://10.200.4.2:3000').replace(/\/+$/, '')

// ストレージキー
const STORAGE_KEYS = {
    SESSION_TOKEN: 'session_token',
    USER_ID: 'user_id',
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
        console.log('🔍 JWT期限チェック:', {
            exp: payload.exp,
            current: currentTime,
            expired: currentTime >= payload.exp,
            timeLeft: payload.exp - currentTime,
        })

        return currentTime >= payload.exp
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
    const webViewRef = useRef<WebView>(null)

    // AsyncStorage操作のヘルパー関数
    const setStorageItem = async (key: string, value: string): Promise<boolean> => {
        try {
            await AsyncStorage.setItem(key, value)
            console.log(`✅ AsyncStorage保存成功: ${key} = ${value}`)

            // 保存直後に再取得して検証
            const retrieved = await AsyncStorage.getItem(key)
            if (retrieved === value) {
                console.log(`✅ AsyncStorage検証成功: ${key} = ${retrieved}`)
                return true
            } else {
                console.error(`❌ AsyncStorage検証失敗: ${key} - 保存値: ${value}, 取得値: ${retrieved}`)
                return false
            }
        } catch (error) {
            console.error(`❌ AsyncStorage保存エラー: ${key}`, error)
            return false
        }
    }

    const getStorageItem = async (key: string): Promise<string | null> => {
        try {
            const value = await AsyncStorage.getItem(key)
            console.log(`📱 AsyncStorage取得: ${key} = ${value}`)
            return value
        } catch (error) {
            console.error(`❌ AsyncStorage取得エラー: ${key}`, error)
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
                return true
            } else {
                console.error(`❌ AsyncStorage削除検証失敗: ${key} - 削除後取得値: ${retrieved}`)
                return false
            }
        } catch (error) {
            console.error(`❌ AsyncStorage削除エラー: ${key}`, error)
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

    // ユーザー情報の取得
    const fetchUserInfo = async (token: string): Promise<User | null> => {
        const endpoints = ['/api/user/me', '/api/user', '/api/user/profile']

        for (const endpoint of endpoints) {
            try {
                console.log(`🔍 ユーザー情報取得試行: ${endpoint}`)
                console.log(`🔐 使用トークン: ${token.substring(0, 20)}...`)

                const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                })

                console.log(`📊 API応答: ${endpoint} - Status: ${response.status}`)

                if (response.ok) {
                    const data = await response.json()
                    console.log(`✅ ユーザー情報取得成功: ${endpoint}`, data)

                    if (data.data && data.data.user) {
                        return {
                            user_id: data.data.user.user_id,
                            user_name: data.data.user.user_name,
                            user_icon: data.data.user.user_icon,
                            email: data.data.user.email,
                        }
                    } else {
                        console.warn(`⚠️ 予期しないレスポンス形式: ${endpoint}`, data)
                    }
                } else {
                    console.log(`❌ ユーザー情報取得失敗: ${endpoint} - ${response.status}`)

                    // レスポンスの詳細を確認
                    try {
                        const errorText = await response.text()
                        console.log(`📋 エラーレスポンス内容:`, errorText)

                        if (response.status === 401) {
                            console.log('🔒 認証エラー: トークンが無効または期限切れです')
                            // 401の場合は他のエンドポイントも試さず早期リターン
                            return null
                        }
                    } catch (textError) {
                        console.error('❌ エラーレスポンス読み取り失敗:', textError)
                    }
                }
            } catch (error) {
                console.error(`❌ ユーザー情報取得エラー: ${endpoint}`, error)
            }
        }

        console.log('❌ 全エンドポイントでユーザー情報取得失敗')
        return null
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
                                fetchUserInfo(sessionToken).then((userInfo) => {
                                    if (userInfo) {
                                        setUser(userInfo)
                                        Alert.alert('ログイン成功', `ようこそ ${userInfo.user_name} さん！`)
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
                            fetchUserInfo(sessionToken).then((userInfo) => {
                                if (userInfo) {
                                    setUser(userInfo)
                                    Alert.alert('ログイン成功', `ようこそ ${userInfo.user_name} さん！`)
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
                                fetchUserInfo(sessionToken).then((userInfo) => {
                                    if (userInfo) {
                                        setUser(userInfo)
                                        // userIdを正しい値で更新
                                        saveAuthInfo(sessionToken, userInfo.user_id)
                                        Alert.alert('ログイン成功', `ようこそ ${userInfo.user_name} さん！`)
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

            const { token, userId } = await loadAuthInfo()
            console.log('📊 AsyncStorage読み込み結果:', {
                hasToken: !!token,
                tokenLength: token?.length || 0,
                tokenPreview: token ? `${token.substring(0, 10)}...${token.substring(token.length - 10)}` : 'なし',
                hasUserId: !!userId,
                userId: userId || 'なし',
            })

            if (token && userId) {
                console.log('🔐 自動ログイン試行中...')
                console.log(`📋 保存されている認証情報: token=${token.substring(0, 20)}..., userId=${userId}`)

                // JWT期限チェック
                if (isJwtExpired(token)) {
                    console.log('⚠️ 自動ログイン: JWT期限切れ検出 - スキップ')
                    setSessionToken(token)
                    setUserId(userId)
                    setUser(null)
                    setIsLoading(false)
                    return
                }

                const userInfo = await fetchUserInfo(token)

                if (userInfo) {
                    setUser(userInfo)
                    console.log('✅ 自動ログイン成功')
                    console.log(`👤 ログインユーザー: ${userInfo.user_name} (${userInfo.email})`)
                } else {
                    console.log('❌ 自動ログイン失敗: ユーザー情報取得不可（JWT期限切れの可能性）')
                    console.log('🔄 認証情報は保持し、手動再認証を促します')

                    // JWTの詳細チェック
                    const payload = parseJwtPayload(token)
                    if (payload) {
                        const currentTime = Math.floor(Date.now() / 1000)
                        console.log('🔍 JWT詳細分析:', {
                            exp: payload.exp,
                            iat: payload.iat,
                            currentTime: currentTime,
                            expired: currentTime >= payload.exp,
                            timeUntilExpiry: payload.exp - currentTime,
                            user_id: payload.user_id || 'なし',
                            user_name: payload.user_name || 'なし',
                        })

                        // JWT期限チェック
                        if (isJwtExpired(token)) {
                            console.log('⚠️ 自動ログイン: JWT期限切れ検出')
                            // この状態では sessionToken && !user の条件でJWT期限切れUIが表示される
                        }
                    } else {
                        console.error('❌ JWT解析失敗')
                    }
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
            }
        } catch (error) {
            console.error('自動ログインエラー:', error)
            // エラーの場合のみ認証情報をクリア
            await clearAuthInfo()
        } finally {
            setIsLoading(false)
        }
    }

    // 初期化
    useEffect(() => {
        autoLogin()
    }, [])

    // ログアウト
    const handleLogout = async () => {
        await clearAuthInfo()
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
            const userInfo = await fetchUserInfo(sessionToken)
            if (userInfo) {
                setUser(userInfo)
                Alert.alert('成功', 'ユーザー情報を取得しました')
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

                    jwtInfo = `

📊 JWT詳細:
• 発行時刻: ${new Date(payload.iat * 1000).toLocaleString()}
• 有効期限: ${new Date(payload.exp * 1000).toLocaleString()}
• 残り時間: ${expired ? '期限切れ' : `${Math.floor(timeUntilExpiry / 60)}分${timeUntilExpiry % 60}秒`}
• ユーザーID: ${payload.user_id || 'なし'}
• ユーザー名: ${payload.user_name || 'なし'}
• 状態: ${expired ? '❌ 期限切れ' : '✅ 有効'}`
                } else {
                    jwtInfo = `

❌ JWT解析エラー`
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
        Alert.alert(
            '設定情報',
            `API Base URL: ${API_BASE_URL}\n\nRedirect URI: ${redirectUri}\n\nWebClient ID: ${process.env.EXPO_PUBLIC_WEBCLIENTID?.substring(0, 20)}...`,
            [
                {
                    text: 'コンソールログ確認',
                    onPress: () => {
                        console.log('📋 設定情報詳細:', {
                            API_BASE_URL,
                            REDIRECT_URI: redirectUri,
                            WEBCLIENTID: process.env.EXPO_PUBLIC_WEBCLIENTID,
                            NODE_ENV: process.env.NODE_ENV,
                            EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
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
                        <Text style={styles.title}>ユーザー情報</Text>
                        <Text style={styles.userInfo}>ID: {user.user_id}</Text>
                        <Text style={styles.userInfo}>名前: {user.user_name}</Text>
                        <Text style={styles.userInfo}>メール: {user.email}</Text>
                    </View>

                    <View style={styles.buttonContainer}>
                        <Button
                            title='ログアウト'
                            onPress={handleLogout}
                            color='#ff6b6b'
                        />
                        <Button
                            title='ユーザー情報再取得'
                            onPress={handleManualUserFetch}
                        />
                        <Button
                            title='ストレージを確認'
                            onPress={checkStorage}
                        />
                        <Button
                            title='全ストレージ削除'
                            onPress={clearAllStorage}
                            color='#dc3545'
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
                            title='🗑️ 全ストレージ削除'
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
})

export default ConfigScreen
