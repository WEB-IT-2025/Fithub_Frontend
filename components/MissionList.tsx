import React, { useRef } from 'react'

import { Animated, ScrollView, StyleSheet } from 'react-native'

import { Mission } from './Mission'
import MissionItem from './MissionItem'

interface MissionListProps {
    missions: Mission[]
    clearedId: string | null
    clearAnim: Animated.Value
    onReceive: (id: string) => void
}

const MissionList: React.FC<MissionListProps> = ({ missions, clearedId, clearAnim, onReceive }) => {
    return (
        <ScrollView style={styles.missionList}>
            {missions.map((mission: Mission, idx: number) => (
                <MissionItem
                    key={idx}
                    mission={mission}
                    onReceive={onReceive}
                    clearedId={clearedId}
                    clearAnim={clearAnim}
                />
            ))}
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    missionList: {
        flex: 1,
        marginBottom: 16,
    },
})

export default MissionList
