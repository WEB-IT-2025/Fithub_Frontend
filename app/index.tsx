import { useEffect } from 'react'

import { useRouter } from 'expo-router'
import { Link } from 'expo-router'
import { Alert, Linking, Platform, StyleSheet } from 'react-native'
import { TouchableOpacity, View } from 'react-native'
import tw from 'tailwind-react-native-classnames'

import { HelloWave } from '@/components/HelloWave'
import ParallaxScrollView from '@/components/ParallaxScrollView'
import { ThemedText } from '@/components/ThemedText'
import { ThemedView } from '@/components/ThemedView'
import Button from '@/components/common/Button'

export default function HomeScreen() {
    const openGoogleFitApp = async () => {
        // Google Fitを開くシンプルな処理のみ残す
        const schemes = [
            'FitApp://',
            'com.google.fit://',
            'googlefit://',
            ...(Platform.OS === 'android' ? ['android-app://com.google.android.apps.fitness'] : []),
        ]

        for (const scheme of schemes) {
            try {
                await Linking.openURL(scheme)
                return
            } catch (error) {
                // 何もしない
            }
        }

        // 全て失敗した場合はストアへ
        const storeUrl =
            Platform.OS === 'ios' ?
                'https://apps.apple.com/app/google-fit/id1433864494'
            :   'https://play.google.com/store/apps/details?id=com.google.android.apps.fitness'
        await Linking.openURL(storeUrl)
    }

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            {/* <Link href='/(auth)/login'>
                <ThemedText>ログイン画面へ</ThemedText>
            </Link> */}
            <Link
                href='/(tabs)/home'
                style={tw`m-4`}
            >
                <ThemedText>ホーム画面へ</ThemedText>
            </Link>
            {/* <Link
                href='/App'
                style={tw`m-4`}
            >
                <ThemedText>歩数画面</ThemedText>
            </Link> */}
            <Link
                href='/config'
                style={tw`m-4`}
            >
                <ThemedText>ggログイン画面</ThemedText>
            </Link>
            {/* Xアプリボタン削除済み */}
            <TouchableOpacity
                onPress={openGoogleFitApp}
                style={tw`m-4 p-3 bg-green-500 rounded`}
            >
                <ThemedText style={tw`text-white`}>Google Fitを開く</ThemedText>
            </TouchableOpacity>
        </View>
    )
}
