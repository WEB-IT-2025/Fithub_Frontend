import React, { useEffect, useState } from 'react'

import { Platform, ScrollView, View } from 'react-native'
import { responsiveHeight } from 'react-native-responsive-dimensions'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import ProfileContent from '@/components/ProfileContent'

import styles from './style/profile.styles'

// プロフィール画面で使用するデータの型定義
interface UserData {
    today: {
        steps: number
        contributions: number
        date: string
    }
    recent_exercise?: Array<{
        day: string
        exercise_quantity: number
    }>
    recent_contributions?: Array<{
        day: string
        count: string
    }>
}

interface OtherProfileProps {
    userName: string
    userData: UserData
    onClose: () => void
}

const OtherProfile = ({ userName, userData, onClose }: OtherProfileProps) => {
    const insets = useSafeAreaInsets()
    const [isSafeAreaReady, setIsSafeAreaReady] = useState(false)

    // SafeAreaInsetsが確実に取得できるまで待つ
    useEffect(() => {
        const isInsetsReady = Platform.OS === 'ios' ? insets.top >= 20 : insets.top >= 0

        if (isInsetsReady) {
            const timer = setTimeout(() => {
                setIsSafeAreaReady(true)
            }, 300)
            return () => clearTimeout(timer)
        }
    }, [insets])

    // SafeAreaInsetsが準備できるまでローディング表示
    if (!isSafeAreaReady) {
        return <View style={{ flex: 1, backgroundColor: '#fff' }} />
    }

    return (
        <ScrollView
            style={[styles.container, { paddingTop: responsiveHeight(0.5) }]}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: responsiveHeight(10) }}
        >
            <ProfileContent
                userName={userName}
                userData={userData}
                onClose={onClose}
                showTitle={false}
                isOwnProfile={false}
            />
        </ScrollView>
    )
}

export default OtherProfile
