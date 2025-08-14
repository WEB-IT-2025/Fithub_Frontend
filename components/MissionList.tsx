import React, { useRef } from 'react'

import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { Animated, ScrollView, StyleSheet } from 'react-native'

import { Mission } from './Mission'
import MissionItem from './MissionItem'

interface ApiMission {
    mission_id: string
    mission_name: string
    mission_content: string
    mission_goal: number
    mission_category: 'daily' | 'weekly'
    mission_type: string
    mission_reward: string
    reward_content: number
    clear_status: number
    clear_time: string | null
    current_status: number
    progress_percentage: string
}

interface MissionListProps {
    missions: Mission[]
    clearedId: string | null
    clearAnim: Animated.Value
    onReceive: (id: string) => void
    getIconForMissionType?: (missionType: string) => IconDefinition
    apiMissions?: ApiMission[]
}

const MissionList: React.FC<MissionListProps> = ({
    missions,
    clearedId,
    clearAnim,
    onReceive,
    getIconForMissionType,
    apiMissions,
}) => {
    // APIミッションからミッションタイプを取得
    const getMissionTypeById = (missionId: string): string => {
        if (apiMissions) {
            const apiMission = apiMissions.find((mission) => mission.mission_id === missionId)
            return apiMission?.mission_type || 'default'
        }
        return 'default'
    }

    return (
        <ScrollView style={styles.missionList}>
            {missions.map((mission: Mission, idx: number) => (
                <MissionItem
                    key={idx}
                    mission={mission}
                    onReceive={onReceive}
                    clearedId={clearedId}
                    clearAnim={clearAnim}
                    missionIcon={
                        getIconForMissionType ? getIconForMissionType(getMissionTypeById(mission.id)) : undefined
                    }
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
