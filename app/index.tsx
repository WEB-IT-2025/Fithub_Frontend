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
    // Google Fitアプリが利用可能かチェックする関数
    const checkGoogleFitAvailability = async () => {
        const schemes =
            Platform.OS === 'ios' ?
                [
                    'FitApp://', // 主要スキーム
                    'com.google.fit://', // パッケージスキーム
                    'com.google.sso.840617513508-9vsd0m4sgsqh6hi3d7ml8db5vip48n9u://', // SSOスキーム
                    'googlefit://', // 従来のスキーム
                ]
            :   [
                    'FitApp://', // Android版でも同じスキームを試す
                    'com.google.fit://',
                    'googlefit://',
                    'android-app://com.google.android.apps.fitness',
                ]

        console.log(`Platform: ${Platform.OS}`)
        console.log('チェックするスキーム:', schemes)

        for (const scheme of schemes) {
            try {
                console.log(`チェック中: ${scheme}`)
                const canOpen = await Linking.canOpenURL(scheme)
                console.log(`${scheme} の結果: ${canOpen}`)

                if (canOpen) {
                    console.log(`✅ Google Fitは ${scheme} で利用可能`)
                    return { available: true, scheme }
                }
            } catch (error) {
                console.log(`❌ ${scheme} チェックエラー:`, error)
            }
        }

        console.log('❌ Google Fitアプリが見つかりません')
        return { available: false, scheme: null }
    }

    const openGoogleFitApp = async () => {
        console.log('🚀 Google Fitアプリを開こうとしています...')

        // まずアプリが利用可能かチェック
        const { available, scheme } = await checkGoogleFitAvailability()

        if (available && scheme) {
            try {
                console.log(`✅ ${scheme} で開きます`)
                Alert.alert('デバッグ', `${scheme} で開きます`)
                await Linking.openURL(scheme)
                console.log('✅ Google Fitアプリを開きました')
                return
            } catch (error) {
                console.log('❌ アプリ起動エラー:', error)
                Alert.alert('エラー', `アプリ起動エラー: ${error}`)
            }
        }

        // アプリが見つからない場合、直接URLを試してみる
        console.log('⚡ 直接URLスキームを試します...')
        const directSchemes = ['FitApp://', 'com.google.fit://', 'googlefit://']

        for (const directScheme of directSchemes) {
            try {
                console.log(`直接試行: ${directScheme}`)
                await Linking.openURL(directScheme)
                console.log(`✅ ${directScheme}で開けました！`)
                Alert.alert('成功', `${directScheme}で開けました！`)
                return
            } catch (error) {
                console.log(`❌ ${directScheme} 直接試行失敗:`, error)
            }
        }

        // 最終手段：強制的にアプリを開こうとする
        try {
            console.log('🔧 最終手段を試します...')
            // iPhoneの設定アプリでGoogle Fitの設定を開く
            const settingsUrl = 'app-settings:com.google.gfit'
            await Linking.openURL(settingsUrl)
            console.log('✅ 設定アプリを開きました')
            Alert.alert('情報', 'Google Fitの設定画面を開きました')
            return
        } catch (error) {
            console.log('❌ 設定アプリも開けませんでした:', error)
        }

        // 全て失敗した場合
        console.log('❌ 全ての方法が失敗しました。ストアを開きます')
        Alert.alert('情報', '全ての方法でアプリを開けませんでした。App Storeを開きます')

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
