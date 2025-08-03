import React, { useRef } from 'react'

import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { Mission } from './Mission'

interface MissionItemProps {
    mission: Mission
    onReceive: (id: string) => void
    clearedId: string | null
    clearAnim: Animated.Value
}

const MissionItem: React.FC<MissionItemProps> = ({ mission, onReceive, clearedId, clearAnim }) => {
    return (
        <View style={{ position: 'relative', marginBottom: 16 }}>
            <View style={[styles.missionItemShadow, { top: 1 }]} />
            <TouchableOpacity
                style={styles.missionItem}
                disabled={mission.status !== 'completed'}
                onPress={() => onReceive(mission.id)}
                activeOpacity={mission.status === 'completed' ? 0.7 : 1}
            >
                {/* 右上に達成数表示 */}
                <View style={{ position: 'absolute', top: 8, right: 12, zIndex: 2 }}>
                    <Text
                        style={{
                            fontSize: 13,
                            color: mission.status === 'completed' ? '#388e3c' : '#888',
                            fontWeight: 'bold',
                            backgroundColor: 'rgba(255,255,255,0.7)',
                            borderRadius: 8,
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                        }}
                    >
                        {mission.status === 'completed' ? '1/1' : '0/1'}
                    </Text>
                </View>
                {mission.image && <View style={styles.missionImage} />}
                <View style={styles.missionTextContainer}>
                    {/* タイトル */}
                    <Text style={styles.missionTitleCustom}>{mission.title}</Text>
                    {/* 説明 */}
                    <Text style={styles.missionDescCustom}>{mission.description}</Text>
                    {/* 1行空白 */}
                    <View style={{ height: 8 }} />
                    {/* プログレスバー */}
                    <View style={styles.progressBarBackground}>
                        <View
                            style={[
                                styles.progressBarFill,
                                {
                                    width: mission.status === 'completed' ? '100%' : '0%',
                                },
                            ]}
                        />
                    </View>
                </View>
                {clearedId === mission.id && (
                    <Animated.View
                        style={[
                            styles.clearAnim,
                            {
                                opacity: clearAnim,
                                transform: [
                                    {
                                        scale: clearAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0.7, 1.4],
                                        }),
                                    },
                                ],
                            },
                        ]}
                        pointerEvents='none'
                    >
                        <Text style={styles.clearText}>Clear!</Text>
                    </Animated.View>
                )}
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    missionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ACEEBB',
        borderRadius: 10,
        padding: 18,
        marginBottom: 10,
    },
    missionItemShadow: {
        position: 'absolute',
        width: '100%',
        height: '95%',
        backgroundColor: '#a5cfa5',
        borderRadius: 10,
        zIndex: 0,
    },
    missionImage: {
        width: 48,
        height: 48,
        borderRadius: 8,
        marginRight: 12,
        backgroundColor: '#b2d8b2',
    },
    missionTextContainer: {
        flex: 1,
    },
    missionTitleCustom: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
        textAlign: 'left',
        marginBottom: 2,
    },
    missionDescCustom: {
        fontSize: 15,
        color: '#222',
        textAlign: 'left',
    },
    progressBarBackground: {
        width: '100%',
        height: 8,
        backgroundColor: '#BEBEBE',
        borderRadius: 4,
        overflow: 'hidden',
        marginTop: 8,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#4caf50',
        borderRadius: 4,
    },
    clearAnim: {
        position: 'absolute',
        top: '40%',
        left: '50%',
        transform: [{ translateX: -40 }, { translateY: -20 }],
        zIndex: 10,
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: 12,
        paddingHorizontal: 24,
        paddingVertical: 8,
    },
    clearText: {
        fontSize: 24,
        color: '#4caf50',
        fontWeight: 'bold',
        textAlign: 'center',
        textShadowColor: '#fff',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 4,
    },
})

export default MissionItem
