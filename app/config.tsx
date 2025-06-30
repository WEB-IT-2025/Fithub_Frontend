import React, { useEffect, useState } from 'react';



import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Alert, Button, Modal, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import WebView from 'react-native-webview';





// GoogleSigninの設定
GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_WEBCLIENTID || '',
    offlineAccess: true,
    forceCodeForRefreshToken: true,
})

// GitHubユーザーの型定義
interface GitHubUser {
    id: number
    login: string
    avatar_url: string
    html_url: string
    name: string | null
    email: string | null
    bio: string | null
    public_repos: number
    followers: number
    following: number
}

// 認証情報の型定義を修正
interface AuthTokens {
    accessToken: string
    tokenType: string
    scope: string
}

const App = () => {
    // Firebase Auth関連
    const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null)
    const [firebaseToken, setFirebaseToken] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(true)

    // GitHub Auth関連（型を明示的に指定）
    const [githubUser, setGithubUser] = useState<GitHubUser | null>(null)
    const [githubTokens, setGithubTokens] = useState<AuthTokens | null>(null)
    const [showWebView, setShowWebView] = useState<boolean>(false)

    // 新しく追加: トークン詳細表示用のモーダル状態
    const [showTokenModal, setShowTokenModal] = useState<boolean>(false)

    // GitHub OAuth設定
    const GITHUB_CLIENT_ID = process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID || ''
    const REDIRECT_URI = process.env.EXPO_PUBLIC_REDIRECT_URI || ''
    // Firebase認証状態の監視（自動ログイン）
    useEffect(() => {
        console.log('Firebase Auth状態監視開始...')

        const subscriber = auth().onAuthStateChanged(async (firebaseUser) => {
            console.log('Auth状態変更:', firebaseUser ? 'ログイン済み' : 'ログアウト')

            setUser(firebaseUser)

            if (firebaseUser) {
                try {
                    // Firebase IDトークンを取得
                    const token = await firebaseUser.getIdToken()
                    setFirebaseToken(token)
                    console.log('Firebase ID Token取得成功')

                    // Google Access Tokenも取得
                    const googleTokens = await GoogleSignin.getTokens()
                    console.log('Google Access Token:', googleTokens.accessToken.substring(0, 20) + '...')
                } catch (error) {
                    console.error('Token取得エラー:', error)
                }
            } else {
                // ログアウト時はすべてのトークンをクリア
                setFirebaseToken(null)
                setGithubUser(null)
                setGithubTokens(null)
            }

            // 初期ローディング完了
            setIsLoading(false)
        })

        return subscriber
    }, [])

    // Google認証（最初のステップ）
    const onGoogleSignIn = async () => {
        try {
            setIsLoading(true)
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })

            const { data } = await GoogleSignin.signIn()
            const googleCredential = auth.GoogleAuthProvider.credential(data!.idToken)

            // Firebase認証（onAuthStateChangedが自動で呼ばれる）
            const result = await auth().signInWithCredential(googleCredential)
            console.log('Google認証成功:', result.user.displayName)

            Alert.alert(
                '✅ Google認証成功',
                `ようこそ ${result.user.displayName} さん！\n次にGitHub認証を行いますか？`,
                [
                    { text: '後で', style: 'cancel' },
                    { text: 'GitHub認証', onPress: () => onGitHubSignIn() },
                ]
            )
        } catch (error) {
            console.error('Google認証エラー:', error)
            Alert.alert('エラー', 'Google認証に失敗しました')
        } finally {
            setIsLoading(false)
        }
    }

    // GitHub認証（2番目のステップ）
    const onGitHubSignIn = () => {
        if (!user) {
            Alert.alert('エラー', '先にGoogle認証を行ってください')
            return
        }
        setShowWebView(true)
    }

    // WebViewのナビゲーション変更を監視
    const handleNavigationChange = async (navState: any) => {
        console.log('ナビゲーション:', navState.url)

        if (navState.url.includes('fithubfrontend://')) {
            console.log('リダイレクト検出:', navState.url)
            setShowWebView(false)

            Alert.alert('認証成功', 'GitHub認証しました')

            try {
                const url = new URL(navState.url)
                const code = url.searchParams.get('code')

                if (code) {
                    console.log('認証コード取得:', code)
                    await exchangeCodeForToken(code)
                } else {
                    Alert.alert('エラー', '認証コードが取得できませんでした')
                }
            } catch (error) {
                console.error('URL解析エラー:', error)
                Alert.alert('エラー', 'リダイレクトURLの解析に失敗しました')
            }
        }
    }

    // GitHub認証コードをアクセストークンに交換
    const exchangeCodeForToken = async (code: string) => {
        try {
            const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    client_id: GITHUB_CLIENT_ID,
                    client_secret: 'YOUR_CLIENT_SECRET', // 本番では使用しない
                    code: code,
                }),
            })

            const tokenData = await tokenResponse.json()

            if (tokenData.access_token) {
                // 型を明示的に指定してTokensオブジェクトを作成
                const tokens: AuthTokens = {
                    accessToken: tokenData.access_token,
                    tokenType: tokenData.token_type || 'bearer',
                    scope: tokenData.scope || '',
                }
                setGithubTokens(tokens)
                console.log('GitHubアクセストークン取得成功:', tokens.accessToken.substring(0, 20) + '...')
                await fetchGitHubUserInfo(tokenData.access_token)
            } else {
                throw new Error('アクセストークンの取得に失敗')
            }
        } catch (error) {
            console.error('トークン交換エラー:', error)
            Alert.alert('エラー', 'トークンの取得に失敗しました')
        }
    }

    // GitHubユーザー情報を取得
    const fetchGitHubUserInfo = async (accessToken: string) => {
        try {
            const userResponse = await fetch('https://api.github.com/user', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: 'application/vnd.github.v3+json',
                },
            })

            if (userResponse.ok) {
                const githubUserData: GitHubUser = await userResponse.json()
                setGithubUser(githubUserData)
                console.log('GitHubユーザー情報:', githubUserData)
                Alert.alert('🎉 GitHub認証完了', `GitHub: ${githubUserData.login} さん\nすべての認証が完了しました！`)
            } else {
                throw new Error('ユーザー情報の取得に失敗')
            }
        } catch (error) {
            console.error('ユーザー情報取得エラー:', error)
            Alert.alert('エラー', 'ユーザー情報の取得に失敗しました')
        }
    }

    // サインアウト（すべての認証をクリア）
    const onSignOut = async () => {
        try {
            await GoogleSignin.revokeAccess()
            await GoogleSignin.signOut()
            await auth().signOut() // onAuthStateChangedが自動で呼ばれる
            console.log('サインアウト成功')
            Alert.alert('サインアウト', 'すべてのアカウントからログアウトしました')
        } catch (error) {
            console.error('サインアウトエラー:', error)
        }
    }

    // 接続テスト
    const testConnection = async () => {
        try {
            const response = await fetch('https://api.github.com')
            if (response.ok) {
                Alert.alert('接続テスト', 'GitHub APIに正常に接続できます ✅')
            } else {
                Alert.alert('接続テスト', `接続エラー: ${response.status}`)
            }
        } catch (error) {
            console.error('接続テストエラー:', error)
            Alert.alert('接続テスト', 'ネットワークエラー ❌')
        }
    }

    // 簡単なトークン情報表示（既存の機能）
    const showTokenInfo = () => {
        const info: string[] = []

        if (firebaseToken) {
            info.push(`Firebase: ${firebaseToken.substring(0, 20)}...`)
        }

        if (githubTokens && githubTokens.accessToken) {
            info.push(`GitHub: ${githubTokens.accessToken.substring(0, 20)}...`)
            info.push(`スコープ: ${githubTokens.scope}`)
            info.push(`タイプ: ${githubTokens.tokenType}`)
        }

        if (info.length > 0) {
            Alert.alert('トークン情報', info.join('\n\n'))
        } else {
            Alert.alert('トークン情報', 'トークンがありません')
        }
    }

    // 新しく追加: GitHubアクセストークンの詳細表示
    const showGitHubTokenDetails = () => {
        if (!githubTokens) {
            Alert.alert('エラー', 'GitHubトークンが見つかりません')
            return
        }
        setShowTokenModal(true)
    }

    // 新しく追加: GitHubアクセストークンをテストする関数
    const testGitHubToken = async () => {
        if (!githubTokens) {
            Alert.alert('エラー', 'GitHubトークンが見つかりません')
            return
        }

        try {
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    Authorization: `Bearer ${githubTokens.accessToken}`,
                    Accept: 'application/vnd.github.v3+json',
                },
            })

            if (response.ok) {
                const userData = await response.json()
                Alert.alert(
                    'トークンテスト成功 ✅',
                    `トークンは有効です！\nユーザー名: ${userData.login}\nAPI制限: ${response.headers.get('X-RateLimit-Remaining')}/${response.headers.get('X-RateLimit-Limit')}`
                )
            } else {
                Alert.alert('トークンテスト失敗 ❌', `ステータス: ${response.status}`)
            }
        } catch (error) {
            console.error('トークンテストエラー:', error)
            Alert.alert('トークンテスト失敗', 'ネットワークエラーが発生しました')
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
            <View style={styles.content}>
                <Text style={styles.title}>FitHub</Text>

                {user ?
                    <>
                        {/* 認証済みユーザー表示 */}
                        <View style={styles.userInfo}>
                            <Text style={styles.welcomeText}>ようこそ {user.displayName || user.email} さん！</Text>

                            {/* 認証状態表示 */}
                            <View style={styles.authStatus}>
                                <Text style={styles.authItem}>✅ Google認証済み</Text>
                                <Text style={styles.authItem}>
                                    {githubUser ? '✅' : '❌'} GitHub認証{githubUser ? '済み' : ''}
                                </Text>
                            </View>

                            {/* GitHub情報表示 */}
                            {githubUser && (
                                <View style={styles.githubInfo}>
                                    <Text style={styles.githubText}>GitHub: {githubUser.login}</Text>
                                    <Text style={styles.githubText}>リポジトリ: {githubUser.public_repos}個</Text>
                                    <Text style={styles.githubText}>フォロワー: {githubUser.followers}人</Text>
                                </View>
                            )}

                            {/* GitHubアクセストークン表示エリア */}
                            {githubTokens && (
                                <View style={styles.tokenDisplay}>
                                    <Text style={styles.tokenTitle}>🔑 GitHubアクセストークン</Text>
                                    <Text style={styles.tokenText}>{githubTokens.accessToken.substring(0, 30)}...</Text>
                                    <Text style={styles.tokenText}>スコープ: {githubTokens.scope}</Text>
                                </View>
                            )}

                            <View style={styles.spacer} />

                            {/* ボタン群 */}
                            {!githubUser && (
                                <>
                                    <Button
                                        title='GitHub認証を追加'
                                        onPress={onGitHubSignIn}
                                    />
                                    <View style={styles.spacer} />
                                </>
                            )}

                            {/* 新しく追加: GitHubトークン関連のボタン */}
                            {githubTokens && (
                                <>
                                    <Button
                                        title='GitHubトークン詳細'
                                        onPress={showGitHubTokenDetails}
                                    />
                                    <View style={styles.spacer} />
                                    <Button
                                        title='GitHubトークンテスト'
                                        onPress={testGitHubToken}
                                    />
                                    <View style={styles.spacer} />
                                </>
                            )}

                            <Button
                                title='接続テスト'
                                onPress={testConnection}
                            />
                            <View style={styles.spacer} />
                            <Button
                                title='全トークン情報'
                                onPress={showTokenInfo}
                            />
                            <View style={styles.spacer} />
                            <Button
                                title='サインアウト'
                                onPress={onSignOut}
                            />
                        </View>
                    </>
                :   <>
                        {/* 未認証ユーザー表示 */}
                        <View style={styles.signInContainer}>
                            <Text style={styles.subtitle}>まずはGoogleアカウントでログインしてください</Text>
                            <Button
                                title={isLoading ? '認証中...' : 'Googleでサインイン'}
                                onPress={onGoogleSignIn}
                                disabled={isLoading}
                            />
                            <View style={styles.spacer} />
                            <Button
                                title='接続テスト'
                                onPress={testConnection}
                            />
                        </View>
                    </>
                }
            </View>

            {/* GitHub認証用WebView */}
            <Modal
                visible={showWebView}
                animationType='slide'
            >
                <SafeAreaView style={{ flex: 1 }}>
                    <View style={styles.webViewHeader}>
                        <Text style={styles.webViewTitle}>GitHub認証</Text>
                        <Button
                            title='キャンセル'
                            onPress={() => setShowWebView(false)}
                        />
                    </View>
                    <WebView
                        source={{
                            uri: `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=user:email%20repo`,
                        }}
                        onNavigationStateChange={handleNavigationChange}
                        startInLoadingState={true}
                    />
                </SafeAreaView>
            </Modal>

            {/* 新しく追加: GitHubトークン詳細表示モーダル */}
            <Modal
                visible={showTokenModal}
                animationType='slide'
                transparent={true}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ScrollView>
                            <Text style={styles.modalTitle}>GitHubアクセストークン詳細</Text>

                            {githubTokens && (
                                <>
                                    <View style={styles.tokenDetailSection}>
                                        <Text style={styles.tokenDetailLabel}>アクセストークン:</Text>
                                        <Text
                                            style={styles.tokenDetailValue}
                                            selectable={true}
                                        >
                                            {githubTokens.accessToken}
                                        </Text>
                                    </View>

                                    <View style={styles.tokenDetailSection}>
                                        <Text style={styles.tokenDetailLabel}>トークンタイプ:</Text>
                                        <Text style={styles.tokenDetailValue}>{githubTokens.tokenType}</Text>
                                    </View>

                                    <View style={styles.tokenDetailSection}>
                                        <Text style={styles.tokenDetailLabel}>スコープ:</Text>
                                        <Text style={styles.tokenDetailValue}>
                                            {githubTokens.scope || '設定されていません'}
                                        </Text>
                                    </View>

                                    <View style={styles.tokenDetailSection}>
                                        <Text style={styles.tokenDetailLabel}>使用例:</Text>
                                        <Text
                                            style={styles.codeExample}
                                            selectable={true}
                                        >
                                            {`curl -H "Authorization: Bearer ${githubTokens.accessToken}" https://api.github.com/user`}
                                        </Text>
                                    </View>
                                </>
                            )}
                        </ScrollView>

                        <View style={styles.modalButtons}>
                            <Button
                                title='閉じる'
                                onPress={() => setShowTokenModal(false)}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 30,
        color: '#333',
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 20,
        color: '#666',
        textAlign: 'center',
    },
    userInfo: {
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        padding: 20,
        borderRadius: 10,
        width: '100%',
    },
    welcomeText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333',
        textAlign: 'center',
    },
    authStatus: {
        marginBottom: 15,
        alignItems: 'center',
    },
    authItem: {
        fontSize: 14,
        marginBottom: 5,
        color: '#555',
    },
    githubInfo: {
        backgroundColor: '#e9ecef',
        padding: 10,
        borderRadius: 8,
        marginBottom: 10,
        alignItems: 'center',
    },
    githubText: {
        fontSize: 14,
        color: '#333',
        marginBottom: 2,
    },
    // 新しく追加: GitHubトークン表示用スタイル
    tokenDisplay: {
        backgroundColor: '#e8f5e8',
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
        alignItems: 'center',
        width: '100%',
    },
    tokenTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2d5a2d',
        marginBottom: 8,
    },
    tokenText: {
        fontSize: 12,
        color: '#2d5a2d',
        fontFamily: 'monospace',
        marginBottom: 2,
        textAlign: 'center',
    },
    signInContainer: {
        width: '100%',
        alignItems: 'center',
    },
    spacer: {
        height: 15,
    },
    webViewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#f0f0f0',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    webViewTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    // 新しく追加: モーダル用スタイル
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        maxHeight: '80%',
        width: '100%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#333',
    },
    tokenDetailSection: {
        marginBottom: 15,
    },
    tokenDetailLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#555',
        marginBottom: 5,
    },
    tokenDetailValue: {
        fontSize: 12,
        color: '#333',
        backgroundColor: '#f8f9fa',
        padding: 10,
        borderRadius: 5,
        fontFamily: 'monospace',
    },
    codeExample: {
        fontSize: 10,
        color: '#333',
        backgroundColor: '#f1f3f4',
        padding: 10,
        borderRadius: 5,
        fontFamily: 'monospace',
    },
    modalButtons: {
        marginTop: 20,
        flexDirection: 'row',
        justifyContent: 'center',
    },
})

export default App