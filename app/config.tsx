import React, { useCallback, useEffect, useRef, useState } from 'react'

import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth'
import { GoogleSignin } from '@react-native-google-signin/google-signin'
import { Alert, Button, Modal, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import WebView from 'react-native-webview'

// GoogleSigninの設定（Firebase用のみ）
GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_WEBCLIENTID || '',
    offlineAccess: true,
    forceCodeForRefreshToken: true,
})

// ユーザー情報の型定義
interface User {
    user_id: string
    user_name: string
    user_icon: string
    email: string
    oauth_data?: UserOAuthData
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

// ユーザーのOAuth接続状態を表すインターフェース
interface UserOAuthData {
    google: {
        google_id: string
        connected: boolean
    }
    github: {
        github_id: number
        username: string
        connected: boolean
    }
}

// API レスポンスの型定義
interface VerifyFirebaseResponse {
    success: boolean
    is_new_user: boolean
    session_token?: string
    temp_session_token?: string
    google_oauth_url?: string
    github_oauth_url?: string // GitHub OAuth URL を追加
    next_step?: string
    user?: User
    message?: string
    error_code?: string
    firebase_data?: {
        firebase_uid: string
        user_name: string
        user_icon: string
        email: string
    }
    google_data?: any // Google OAuth データを追加
}

interface OAuthCallbackResponse {
    success: boolean
    message: string
    session_token?: string
    temp_session_token?: string
    github_oauth_url?: string
    next_step?: string
    user?: User
    oauth_data?: {
        access_token: string
        refresh_token: string
        expires_in: number
        user_info: {
            user_name: string
            email: string
            user_icon: string
        }
    }
    google_data?: any
    error_code?: string
}

const App = () => {
    // Firebase Auth関連
    const [user, setUser] = useState<User | null>(null)
    const [firebaseUser, setFirebaseUser] = useState<FirebaseAuthTypes.User | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(true)

    // OAuth関連
    const [userOAuthData, setUserOAuthData] = useState<UserOAuthData | null>(null)
    const [sessionToken, setSessionToken] = useState<string | null>(null)
    const [tempSessionToken, setTempSessionToken] = useState<string | null>(null)
    const [showWebView, setShowWebView] = useState<boolean>(false)
    const [oauthUrl, setOauthUrl] = useState<string>('')
    const [currentStep, setCurrentStep] = useState<'google' | 'github' | null>(null)
    const [isVerifying, setIsVerifying] = useState<boolean>(false) // 重複実行防止
    const isVerifyingRef = useRef<boolean>(false) // refで最新の状態を追跡

    // API Base URL - 末尾のスラッシュを削除して二重スラッシュを防ぐ
    const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || 'http://10.200.4.2:3000').replace(/\/+$/, '')

    // Redirect URI
    const REDIRECT_URI = process.env.EXPO_PUBLIC_REDIRECT_URI || 'fithub://oauth'

    // 注意: Google OAuth URLの生成は不要になりました
    // 新しいフローではFirebase認証時にGoogle Access Tokenも同時に取得します

    // Step 2: Firebase ID tokenとGoogle Access Tokenをバックエンドで検証
    const verifyFirebaseAuth = useCallback(
        async (idToken: string, googleAccessToken?: string) => {
            // 重複実行チェック（refを使用）
            if (isVerifyingRef.current) {
                console.log('🚫 verifyFirebaseAuth は既に実行中です。スキップします。')
                return
            }

            console.log('🚨 verifyFirebaseAuth関数が開始されました！')
            console.log('🔑 受信したIDトークンの長さ:', idToken.length)
            console.log('🔑 Google Access Token:', googleAccessToken ? 'あり' : 'なし')

            isVerifyingRef.current = true
            setIsVerifying(true)

            try {
                console.log('🌐 Firebase認証をバックエンドで検証中...')
                console.log('🏠 API Base URL:', API_BASE_URL)
                console.log('📡 リクエストURL:', `${API_BASE_URL}/api/auth/verify-firebase`)
                console.log('🎫 Firebase ID Token (最初の50文字):', idToken.substring(0, 50))

                const requestBody = JSON.stringify({
                    firebase_id_token: idToken,
                    google_access_token: googleAccessToken, // Google Access Tokenも同時に送信
                })
                console.log('📦 リクエストボディ:', requestBody.length + ' bytes')

                console.log('📤 fetchリクエストを送信中...')

                // タイムアウト設定（10秒）
                const controller = new AbortController()
                const timeoutId = setTimeout(() => {
                    console.log('⏰ リクエストタイムアウト (10秒)')
                    controller.abort()
                }, 10000)

                const response = await fetch(`${API_BASE_URL}/api/auth/verify-firebase`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: requestBody,
                    signal: controller.signal,
                })

                clearTimeout(timeoutId)

                console.log('📥 レスポンス受信:', {
                    status: response.status,
                    statusText: response.statusText,
                    ok: response.ok,
                    headers: Object.fromEntries(response.headers.entries()),
                })

                console.log('📝 レスポンスボディの解析を開始...')
                const responseText = await response.text()
                console.log('🔍 レスポンステキスト (最初の500文字):', responseText.substring(0, 500))

                let data: VerifyFirebaseResponse
                try {
                    data = JSON.parse(responseText)
                    console.log('✅ JSON解析成功:', data)
                } catch (parseError) {
                    console.error('❌ JSON解析エラー:', parseError)
                    console.error('📄 生のレスポンステキスト:', responseText)
                    throw new Error(`レスポンスのJSON解析に失敗: ${parseError}`)
                }
                if (data.success) {
                    if (data.is_new_user) {
                        // 新規ユーザー - GitHub OAuth開始（Google OAuth はスキップ）
                        console.log('新規ユーザー検出 - GitHub OAuth開始')
                        setTempSessionToken(data.temp_session_token || null)

                        if (data.github_oauth_url) {
                            // GitHub OAuth URLを使用
                            console.log('GitHub OAuth URL (バックエンド生成):', data.github_oauth_url)

                            setCurrentStep('github')
                            setOauthUrl(data.github_oauth_url)
                            setShowWebView(true)
                        } else {
                            throw new Error('GitHub OAuth URLが取得できませんでした')
                        }
                    } else {
                        // 既存ユーザー - ログイン完了
                        console.log('既存ユーザー - ログイン完了')
                        setUser(data.user || null)
                        setSessionToken(data.session_token || null)
                    }
                } else {
                    Alert.alert('認証エラー', data.message || 'Firebase認証の検証に失敗しました')
                }
            } catch (error) {
                console.error('🚨 Firebase認証検証でエラーが発生!')
                console.error('❌ エラータイプ:', typeof error)
                console.error('📋 エラー詳細:', {
                    message: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined,
                    name: error instanceof Error ? error.name : undefined,
                    toString: String(error),
                })

                // ネットワークエラーかどうかを判定
                if (error instanceof TypeError && error.message.includes('fetch')) {
                    console.error('🌐 ネットワークエラーを検出')
                    Alert.alert(
                        'ネットワークエラー',
                        `サーバーに接続できません。WiFi接続とサーバーの起動状態を確認してください。\n\nエラー: ${error.message}\n\nAPI URL: ${API_BASE_URL}`
                    )
                } else if (error instanceof Error && error.name === 'AbortError') {
                    console.error('⏰ タイムアウトエラーを検出')
                    Alert.alert(
                        'タイムアウトエラー',
                        `サーバーからの応答が10秒以内に返ってきませんでした。\n\nサーバーの起動状態を確認してください。\n\nAPI URL: ${API_BASE_URL}`
                    )
                } else if (error instanceof Error && error.message.includes('JSON')) {
                    console.error('📄 JSON解析エラーを検出')
                    Alert.alert(
                        'レスポンスエラー',
                        `サーバーからの応答が正しくありません。\n\nエラー: ${error.message}`
                    )
                } else {
                    console.error('❓ その他のエラーを検出')
                    Alert.alert(
                        'エラー',
                        `サーバーとの通信に失敗しました。\n\nエラー: ${error instanceof Error ? error.message : String(error)}\n\nAPI URL: ${API_BASE_URL}`
                    )
                }
            } finally {
                setIsLoading(false)
                setIsVerifying(false)
                isVerifyingRef.current = false
            }
        },
        [API_BASE_URL]
    )

    // Firebase認証状態の監視
    useEffect(() => {
        console.log('Firebase Auth状態監視開始...')

        const subscriber = auth().onAuthStateChanged(async (firebaseUser) => {
            console.log('🔄 Firebase Auth状態変更:', {
                uid: firebaseUser?.uid,
                email: firebaseUser?.email,
                displayName: firebaseUser?.displayName,
                isAnonymous: firebaseUser?.isAnonymous,
            })
            setFirebaseUser(firebaseUser)

            if (firebaseUser) {
                try {
                    console.log('📝 Firebase IDトークン取得開始...')
                    const token = await firebaseUser.getIdToken()
                    console.log('✅ Firebase IDトークン取得成功')

                    // Google Access Tokenを取得（Firebase認証でGoogleを使用した場合）
                    let googleAccessToken: string | undefined
                    try {
                        const googleUser = await GoogleSignin.getCurrentUser()
                        if (googleUser?.user) {
                            const tokens = await GoogleSignin.getTokens()
                            googleAccessToken = tokens.accessToken
                            console.log('✅ Google Access Token取得成功')
                        } else {
                            console.log('⚠️ Googleユーザーが見つからない')
                        }
                    } catch (error) {
                        console.log('⚠️ Google Access Token取得エラー:', error)
                        // ここでアクセストークンが取れなければサインアウトして再ログインを促す
                        await GoogleSignin.signOut()
                        await auth().signOut()
                        Alert.alert('再ログインが必要です', 'Googleアカウントで再度ログインしてください')
                        setIsLoading(false)
                        return
                    }

                    console.log('🚀 verifyFirebaseAuth関数を呼び出し中...')

                    // Firebase ID tokenとGoogle Access Tokenをバックエンドに送信
                    await verifyFirebaseAuth(token, googleAccessToken)
                } catch (error) {
                    console.error('❌ Firebase トークン取得エラー:', error)
                    setIsLoading(false)
                }
            } else {
                // ログアウト時のクリアアップ
                setUser(null)
                setUserOAuthData(null)
                setSessionToken(null)
                setTempSessionToken(null)
                setCurrentStep(null)
                setIsVerifying(false)
                isVerifyingRef.current = false
                setIsLoading(false)
            }
        })

        return subscriber
    }, []) // Firebase認証状態監視は一度だけ設定

    // Google認証（Firebase経由でGoogle Access Tokenも取得）
    const onGoogleSignIn = async () => {
        setIsLoading(true)
        try {
            console.log('🔑 Google認証開始...')

            await GoogleSignin.hasPlayServices()
            console.log('✅ Google Play Services確認完了')

            const userInfo = await GoogleSignin.signIn()
            console.log('✅ Googleサインイン成功:', {
                email: userInfo.data?.user.email,
                name: userInfo.data?.user.name,
                hasIdToken: !!userInfo.data?.idToken,
            })

            if (userInfo.data?.idToken) {
                console.log('🔐 Firebase認証を実行中...')
                const googleCredential = auth.GoogleAuthProvider.credential(userInfo.data.idToken)
                await auth().signInWithCredential(googleCredential)
                console.log('🎉 Firebase認証成功')
                console.log('⏳ onAuthStateChangedでverifyFirebaseAuthが自動実行されます...')
                // onAuthStateChangedでverifyFirebaseAuthが自動実行される
                // この時、Google Access Tokenも一緒に送信される
            } else {
                throw new Error('Google IDトークンが取得できませんでした')
            }
        } catch (error) {
            console.error('Google認証エラー:', error)
            Alert.alert('エラー', 'Google認証に失敗しました')
            setIsLoading(false)
        }
    }

    // WebViewのナビゲーション変更を監視（GitHub OAuth callback のみ検出）
    const handleNavigationChange = async (navState: any) => {
        console.log('ナビゲーション:', navState.url)

        // OAuth エラーの検出
        if (navState.url.includes('oauth/error')) {
            console.error('❌ OAuth エラーが発生:', navState.url)
            setShowWebView(false)

            if (navState.url.includes('invalid_request') && navState.url.includes('client_id')) {
                Alert.alert(
                    'GitHub OAuth 設定エラー',
                    'サーバー側のGitHub OAuth Client IDが正しく設定されていません。管理者に連絡してください。'
                )
            } else {
                Alert.alert('OAuth エラー', 'OAuth認証でエラーが発生しました。もう一度お試しください。')
            }
            return
        }

        // OAuth コールバックを検出
        const redirectPrefix = REDIRECT_URI.split('://')[0] + '://'
        if (navState.url.includes(redirectPrefix)) {
            console.log('OAuth コールバック検出:', navState.url)
            setShowWebView(false)

            try {
                const url = new URL(navState.url)
                const code = url.searchParams.get('code')
                const state = url.searchParams.get('state')

                if (code) {
                    console.log('認証コード取得:', code)

                    // 新しいフローではGitHub OAuthのみ処理
                    if (currentStep === 'github') {
                        await handleGitHubCallback(code, state)
                    } else {
                        console.error('❌ 予期しないOAuth step:', currentStep)
                        Alert.alert('エラー', '予期しない認証ステップです')
                    }
                } else {
                    Alert.alert('エラー', '認証コードが取得できませんでした')
                }
            } catch (error) {
                console.error('URL解析エラー:', error)
                Alert.alert('エラー', 'リダイレクトURLの解析に失敗しました')
            }
        }
    }

    // GitHub OAuth callback処理（最終ステップ）
    const handleGitHubCallback = async (code: string, state: string | null) => {
        try {
            setIsLoading(true)
            console.log('GitHub OAuth callback処理開始...')

            // Firebase認証を使用しない場合のAPI呼び出し
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            }

            // 現在のFirebaseユーザーがいる場合のみAuthorizationヘッダーを追加
            if (firebaseUser) {
                const idToken = await firebaseUser.getIdToken()
                headers.Authorization = `Bearer ${idToken}`
            }

            const response = await fetch(`${API_BASE_URL}/api/auth/github/callback?code=${code}&state=${state || ''}`, {
                method: 'GET',
                headers,
            })

            const data: OAuthCallbackResponse = await response.json()
            console.log('GitHub OAuth callbackレスポンス:', data)

            if (data.success) {
                console.log('GitHub OAuth成功:', data.message)

                if (data.user && data.session_token) {
                    // アカウント作成完了
                    setUser(data.user)
                    setSessionToken(data.session_token)
                    // OAuth完了時はユーザー情報からOAuth状態を設定
                    if (data.user.oauth_data) {
                        setUserOAuthData(data.user.oauth_data)
                    }
                    setTempSessionToken(null)
                    setCurrentStep(null)
                    Alert.alert('🎉 登録完了', 'アカウント作成が完了しました！')
                } else {
                    throw new Error('ユーザー情報またはセッショントークンが取得できませんでした')
                }
            } else {
                throw new Error(data.message || 'GitHub OAuth認証に失敗しました')
            }
        } catch (error) {
            console.error('GitHub OAuth callbackエラー:', error)
            Alert.alert(
                'エラー',
                `GitHub OAuth認証に失敗しました: ${error instanceof Error ? error.message : String(error)}`
            )
        } finally {
            setIsLoading(false)
        }
    }

    // サインアウト
    const onSignOut = async () => {
        try {
            await GoogleSignin.revokeAccess()
            await GoogleSignin.signOut()
            await auth().signOut()
            console.log('サインアウト成功')
            Alert.alert('サインアウト', 'ログアウトしました')
        } catch (error) {
            console.error('サインアウトエラー:', error)
        }
    }

    // 完全リセット（デバッグ用）
    const onCompleteReset = async () => {
        try {
            console.log('🧹 完全リセット開始...')

            // Google Signin の完全リセット
            try {
                await GoogleSignin.revokeAccess()
                console.log('✅ Google revokeAccess 完了')
            } catch (error) {
                console.log('⚠️ Google revokeAccess エラー（無視）:', error)
            }

            try {
                await GoogleSignin.signOut()
                console.log('✅ Google signOut 完了')
            } catch (error) {
                console.log('⚠️ Google signOut エラー（無視）:', error)
            }

            // Firebase Auth の完全リセット
            try {
                await auth().signOut()
                console.log('✅ Firebase signOut 完了')
            } catch (error) {
                console.log('⚠️ Firebase signOut エラー（無視）:', error)
            }

            // アプリ状態のリセット
            setUser(null)
            setFirebaseUser(null)
            setUserOAuthData(null)
            setSessionToken(null)
            setTempSessionToken(null)
            setCurrentStep(null)
            setShowWebView(false)
            setOauthUrl('')
            setIsVerifying(false)
            isVerifyingRef.current = false
            setIsLoading(false)

            console.log('🎉 完全リセット完了')
            Alert.alert('リセット完了', '全てのアカウント情報がクリアされました。\nアプリを再起動してください。')
        } catch (error) {
            console.error('リセットエラー:', error)
            Alert.alert('リセットエラー', 'リセット中にエラーが発生しました')
        }
    }

    // 接続テスト
    const testConnection = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/health`)
            if (response.ok) {
                Alert.alert('接続テスト成功 ✅', 'サーバーとの接続が確認できました')
            } else {
                Alert.alert('接続テスト失敗 ❌', `ステータス: ${response.status}`)
            }
        } catch (error) {
            console.error('接続テストエラー:', error)
            Alert.alert('接続テスト失敗', 'ネットワークエラーが発生しました')
        }
    }

    // 初期ローディング中の表示
    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.content}>
                    <Text style={styles.title}>FitHub</Text>
                    <Text>読み込み中...</Text>
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.content}>
                <Text style={styles.title}>FitHub</Text>

                {user ?
                    <>
                        {/* 認証済みユーザー表示 */}
                        <View style={styles.userInfo}>
                            <Text style={styles.welcomeText}>ようこそ {user.user_name} さん！</Text>
                            <Text style={styles.email}>{user.email}</Text>

                            {/* 認証状態表示 */}
                            <View style={styles.authStatus}>
                                <Text style={styles.authItem}>
                                    ✅ Google認証済み ({userOAuthData?.google?.google_id})
                                </Text>
                                <Text style={styles.authItem}>
                                    ✅ GitHub認証済み (@{userOAuthData?.github?.username})
                                </Text>
                            </View>

                            {/* セッション情報 */}
                            <View style={styles.debugInfo}>
                                <Text style={styles.debugTitle}>セッション情報:</Text>
                                <Text style={styles.debugText}>User ID: {user.user_id}</Text>
                                <Text style={styles.debugText}>Session Token: {sessionToken?.substring(0, 20)}...</Text>
                            </View>

                            <View style={styles.buttonContainer}>
                                <Button
                                    title='サインアウト'
                                    onPress={onSignOut}
                                    color='#dc3545'
                                />
                            </View>
                        </View>
                    </>
                :   <>
                        {/* 未認証ユーザー表示 */}
                        <View style={styles.authContainer}>
                            <Text style={styles.subtitle}>アカウント作成・ログイン</Text>
                            <Text style={styles.description}>Googleアカウントでログインしてください</Text>

                            <View style={styles.buttonContainer}>
                                <Button
                                    title='Googleでログイン'
                                    onPress={onGoogleSignIn}
                                    color='#4285f4'
                                />
                            </View>

                            {/* 認証ステップ表示 */}
                            {firebaseUser && (
                                <View style={styles.stepInfo}>
                                    <Text style={styles.stepTitle}>認証ステップ:</Text>
                                    <Text style={styles.stepText}>✅ Firebase認証完了 ({firebaseUser.email})</Text>
                                    {currentStep === 'github' && (
                                        <Text style={styles.stepText}>🔄 GitHub OAuth認証中...</Text>
                                    )}
                                </View>
                            )}
                        </View>
                    </>
                }

                {/* 接続テストボタン */}
                <View style={styles.buttonContainer}>
                    <Button
                        title='接続テスト'
                        onPress={testConnection}
                        color='#6c757d'
                    />
                </View>

                {/* 完全リセットボタン */}
                <View style={styles.buttonContainer}>
                    <Button
                        title='🧹 完全リセット（全アカウントサインアウト）'
                        onPress={onCompleteReset}
                        color='#dc3545'
                    />
                </View>

                {/* OAuth WebView モーダル */}
                <Modal
                    visible={showWebView}
                    animationType='slide'
                >
                    <SafeAreaView style={{ flex: 1 }}>
                        <View style={styles.webViewHeader}>
                            <Text style={styles.webViewTitle}>GitHub 認証</Text>
                            <Button
                                title='キャンセル'
                                onPress={() => setShowWebView(false)}
                                color='#dc3545'
                            />
                        </View>
                        <WebView
                            source={{ uri: oauthUrl }}
                            onNavigationStateChange={handleNavigationChange}
                            userAgent='Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36'
                            javaScriptEnabled={true}
                            domStorageEnabled={true}
                            startInLoadingState={true}
                            scalesPageToFit={true}
                            style={{ flex: 1 }}
                        />
                    </SafeAreaView>
                </Modal>
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 30,
        color: '#333',
    },
    subtitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    description: {
        fontSize: 16,
        marginBottom: 20,
        color: '#666',
        textAlign: 'center',
    },
    userInfo: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    welcomeText: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#333',
    },
    email: {
        fontSize: 16,
        color: '#666',
        marginBottom: 15,
    },
    authStatus: {
        marginBottom: 15,
    },
    authItem: {
        fontSize: 14,
        marginBottom: 5,
        color: '#333',
    },
    authContainer: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    stepInfo: {
        marginTop: 15,
        padding: 10,
        backgroundColor: '#f8f9fa',
        borderRadius: 5,
    },
    stepTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#333',
    },
    stepText: {
        fontSize: 12,
        marginBottom: 2,
        color: '#666',
    },
    debugInfo: {
        marginTop: 15,
        padding: 10,
        backgroundColor: '#f8f9fa',
        borderRadius: 5,
    },
    debugTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#333',
    },
    debugText: {
        fontSize: 12,
        marginBottom: 2,
        color: '#666',
        fontFamily: 'monospace',
    },
    buttonContainer: {
        marginTop: 15,
    },
    webViewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        backgroundColor: 'white',
    },
    webViewTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
})

export default App
