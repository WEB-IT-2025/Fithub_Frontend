import React, { useEffect, useState } from 'react';



import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Button, SafeAreaView, Text } from 'react-native';





// GoogleSigninの設定
GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_WEBCLIENTID || '',
    // iosClientId: '<IOS_CLIENT_ID>',
    offlineAccess: true,
    forceCodeForRefreshToken: true,
})

// アプリ
const App = () => {
    const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null)
    const [accessToken, setAccessToken] = useState<string | null>(null)

    // 初期化
    useEffect(() => {
        // Authenticationリスナーの準備
        const subscriber = auth().onAuthStateChanged(onAuthStateChanged)
        return subscriber
    }, [])

    // サインイン・サインアウト時に呼ばれる
    const onAuthStateChanged = async (user: FirebaseAuthTypes.User | null) => {
        setUser(user)
        if (user) {
            // ユーザーがサインインしている場合、アクセストークンを取得
            try {
                const token = await user.getIdToken()
                setAccessToken(token)
                console.log('Firebase ID Token:', token)

                // Google Access Tokenも取得したい場合
                const googleToken = await GoogleSignin.getTokens()
                console.log('Google Access Token:', googleToken.accessToken)
            } catch (error) {
                console.error('Token取得エラー:', error)
            }
        } else {
            setAccessToken(null)
        }
    } // サインイン
    const onSignIn = async () => {
        try {
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })
            const { data } = await GoogleSignin.signIn()
            const googleCredential = auth.GoogleAuthProvider.credential(data!.idToken)

            // Firebase認証
            const result = await auth().signInWithCredential(googleCredential)

            // アクセストークンを即座に取得
            const token = await result.user.getIdToken()
            setAccessToken(token)
            console.log('ログイン成功 - Firebase ID Token:', token)

            return result
        } catch (error) {
            console.error(error)
        }
    }
    // サインアウト
    const onSignOut = async () => {
        try {
            await GoogleSignin.revokeAccess()
            await auth().signOut()
        } catch (error) {
            console.error(error)
        }
    }

    // UI
    return (
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            {user ?
                <>
                    <Text>{user?.displayName}</Text>
                    <Text style={{ fontSize: 12, margin: 10 }}>
                        Token: {accessToken ? accessToken.substring(0, 20) + '...' : 'なし'}
                    </Text>
                    <Button
                        title='SignOut'
                        onPress={onSignOut}
                    />
                </>
            :   <Button
                    title='SignIn'
                    onPress={onSignIn}
                />
            }
        </SafeAreaView>
    )
}

export default App