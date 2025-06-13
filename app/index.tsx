import { useEffect } from 'react'

import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { Link } from 'expo-router'
import { Platform, StyleSheet } from 'react-native'
import tw from 'tailwind-react-native-classnames'

import { HelloWave } from '@/components/HelloWave'
import ParallaxScrollView from '@/components/ParallaxScrollView'
import { ThemedText } from '@/components/ThemedText'
import { ThemedView } from '@/components/ThemedView'
import Button from '@/components/common/Button'

export default function HomeScreen() {
    // const router = useRouter()

    // useEffect(() => {
    //     router.replace('/login')
    // }, [router])

    // style={tw`p-4 bg-blue-500`}
    return (
        <ParallaxScrollView
            headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
            headerImage={
                <Image
                    source={require('@/assets/images/partial-react-logo.png')}
                    style={styles.reactLogo}
                />
            }
        >
            <Link href='/(auth)/login'>
                <ThemedText>ログイン画面へ</ThemedText>
            </Link>{' '}
            <Link href='/(tabs)/home'>
                <ThemedText>ホーム画面へ</ThemedText>
            </Link>{' '}
        </ParallaxScrollView>
    )
}

const styles = StyleSheet.create({
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    stepContainer: {
        gap: 8,
        marginBottom: 8,
    },
    reactLogo: {
        height: 178,
        width: 290,
        bottom: 0,
        left: 0,
        position: 'absolute',
    },
})
