import React, { useEffect, useState } from 'react';



import { getApps, initializeApp } from 'firebase/app';
import { User, getAuth, onAuthStateChanged, signInAnonymously, signOut } from 'firebase/auth';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Platform } from 'react-native';





// Android用Firebase config
const androidFirebaseConfig = {
    apiKey: 'AIzaSyCebUbGNEyVkFnQM13Gj1yY5BSAbHYF5qU',
    authDomain: 'your-project.firebaseapp.com',
    projectId: 'fithub-8675d',
    storageBucket: 'your-project.appspot.com',
    messagingSenderId: 'your-sender-id',
    appId: 'your-android-app-id',
}

// Firebase初期化
const app = getApps().length === 0 ? initializeApp(androidFirebaseConfig) : getApps()[0]
const auth = getAuth(app)

export default function ConfigScreen() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user)
        })
        return unsubscribe
    }, [])

    const handleSignIn = async () => {
        setLoading(true)
        try {
            await signInAnonymously(auth)
            Alert.alert('成功', 'Firebase認証が完了しました')
        } catch (error) {
            Alert.alert('エラー', `認証に失敗しました: ${error}`)
        }
        setLoading(false)
    }

    const handleSignOut = async () => {
        try {
            await signOut(auth)
            Alert.alert('成功', 'ログアウトしました')
        } catch (error) {
            Alert.alert('エラー', `ログアウトに失敗しました: ${error}`)
        }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Firebase Config画面</Text>
            <Text style={styles.info}>プラットフォーム: {Platform.OS}</Text>

            {user ?
                <View style={styles.authSection}>
                    <Text style={styles.info}>認証済み</Text>
                    <Text style={styles.info}>UID: {user.uid}</Text>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleSignOut}
                    >
                        <Text style={styles.buttonText}>ログアウト</Text>
                    </TouchableOpacity>
                </View>
            :   <View style={styles.authSection}>
                    <Text style={styles.info}>未認証</Text>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleSignIn}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>{loading ? '認証中...' : 'Firebase認証'}</Text>
                    </TouchableOpacity>
                </View>
            }
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#000',
    },
    info: {
        fontSize: 16,
        marginBottom: 10,
        color: '#666',
    },
    authSection: {
        alignItems: 'center',
        marginTop: 20,
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 8,
        marginTop: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
})