import { useEffect } from 'react'

import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { Link } from 'expo-router'
import { Platform, StyleSheet } from 'react-native'
import { View } from 'react-native'
import tw from 'tailwind-react-native-classnames'

import { HelloWave } from '@/components/HelloWave'
import ParallaxScrollView from '@/components/ParallaxScrollView'
import { ThemedText } from '@/components/ThemedText'
import { ThemedView } from '@/components/ThemedView'
import Button from '@/components/common/Button'

// ...existing code...
export default function HomeScreen() {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Link href='/(auth)/login'>
                <ThemedText>ログイン画面へ</ThemedText>
            </Link>
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
        </View>
    )
}
// ...existing code...
