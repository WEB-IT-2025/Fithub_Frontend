import React from 'react'

import { View } from 'react-native'
import { responsiveHeight } from 'react-native-responsive-dimensions'

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

interface ProfileProps {
    userName?: string
    userData?: UserData | null
    onClose?: () => void
}

const Profile = ({ userName, userData, onClose }: ProfileProps) => {
    return (
        <View style={[styles.container, { paddingTop: responsiveHeight(0.5) }]}>
            <ProfileContent
                userName={userName}
                userData={userData}
                onClose={onClose}
                showTitle={true}
                isOwnProfile={true}
            />
        </View>
    )
}

export default Profile
