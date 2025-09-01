import React from 'react'

import { View } from 'react-native'
import { responsiveHeight } from 'react-native-responsive-dimensions'
import { SafeAreaView } from 'react-native-safe-area-context'

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
    userId?: string // ユーザーIDを追加
    userData: UserData
    onClose: () => void
}

const OtherProfile = ({ userName, userId, userData, onClose }: OtherProfileProps) => {
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={[styles.container, { paddingTop: responsiveHeight(0.5) }]}>
                <ProfileContent
                    userName={userName}
                    userId={userId}
                    userData={userData}
                    onClose={onClose}
                    showTitle={false}
                    isOwnProfile={false}
                />
            </View>
        </SafeAreaView>
    )
}

export default OtherProfile
