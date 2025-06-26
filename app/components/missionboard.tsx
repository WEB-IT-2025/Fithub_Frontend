import React, { useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image } from 'react-native'
import missionsData from './mission'

type MissionType = 'daily' | 'weekly'

const MissionBoard = () => {
    const [missions, setMissions] = useState(missionsData)
    const [type, setType] = useState<MissionType>('daily')

    // ミッションをフィルタリング
    const filteredMissions = missions.filter((m: any) => m.type === type && m.board === 'display')

    // 個別ミッション受け取り
    const handleReceive = (id: string) => {
        setMissions(prev =>
            prev.map(m =>
                m.id === id && m.status === 'completed'
                    ? { ...m, board: 'hidden' }
                    : m
            )
        )
    }

    // すべて受け取る
    const handleReceiveAll = () => {
        setMissions(prev =>
            prev.map(m =>
                m.type === type && m.status === 'completed' && m.board === 'display'
                    ? { ...m, board: 'hidden' }
                    : m
            )
        )
    }

    return (
        <View style={styles.container}>
            {/* 最上部の空白 */}
            <View style={{ height: 48 }} />
            {/* トグルボタン */}
            <View style={styles.toggleContainer}>
                <View style={styles.toggleBackground}>
                    <View
                        style={[
                            styles.toggleSlider,
                            type === 'daily'
                                ? { left: 4 }
                                : { left: '50%' }
                        ]}
                    />
                    <TouchableOpacity
                        style={styles.toggleTouchable}
                        onPress={() => setType('daily')}
                        activeOpacity={1}
                    >
                        <Text style={[
                            styles.toggleText,
                            type === 'daily' && styles.activeToggleText
                        ]}>デイリー</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.toggleTouchable}
                        onPress={() => setType('weekly')}
                        activeOpacity={1}
                    >
                        <Text style={[
                            styles.toggleText,
                            type === 'weekly' && styles.activeToggleText
                        ]}>ウィークリー</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/*空白 */}
            <View style={{ height: 48 }} />

            {/* ミッションリスト */}
            <ScrollView style={styles.missionList}>
                {filteredMissions.map((mission: any, idx: number) => (
                    <TouchableOpacity
                        key={idx}
                        style={[
                            styles.missionItem,
                            mission.status === 'not achieved' && { opacity: 0.5 }
                        ]}
                        disabled={mission.status !== 'completed'}
                        onPress={() => handleReceive(mission.id)}
                        activeOpacity={mission.status === 'completed' ? 0.7 : 1}
                    >
                        {/* ミッション画像 */}
                        {mission.image && (
                            <Image
                                source={
                                    mission.image.startsWith('http')
                                        // ? { uri: mission.image }
                                        // : require(`${mission.image}`)
                                }
                                style={styles.missionImage}
                                resizeMode="cover"
                            />
                        )}
                        <View style={styles.missionTextContainer}>
                            <Text style={styles.missionTitle}>{mission.title}</Text>
                            <Text style={styles.missionDesc}>{mission.description}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* 下部ボタン */}
            <View style={styles.bottomButtons}>
                <View style={{ flex: 1 }} />
                <TouchableOpacity style={styles.receiveAllButton} onPress={handleReceiveAll}>
                    <Text style={styles.receiveAllText}>すべて受け取る</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#e6f5e6', // 緑基調
        borderRadius: 20,
        padding: 16,
    },
    toggleContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    toggleBackground: {
        width: 240,
        height: 44,
        backgroundColor: '#b2d8b2',
        borderRadius: 22,
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    toggleSlider: {
        position: 'absolute',
        top: 4,
        width: 112,
        height: 36,
        backgroundColor: '#4caf50',
        borderRadius: 18,
        zIndex: 1,
        transitionProperty: 'left',
        transitionDuration: '200ms',
    },
    toggleTouchable: {
        flex: 1,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    toggleText: {
        color: '#388e3c',
        fontWeight: 'bold',
        fontSize: 16,
    },
    activeToggleText: {
        color: '#fff',
    },
    missionList: {
        flex: 1,
        marginBottom: 16,
    },
    missionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#d0f5d8',
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
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
    missionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#388e3c',
    },
    missionDesc: {
        fontSize: 14,
        color: '#388e3c',
        marginTop: 4,
    },
    bottomButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    closeButton: {
        backgroundColor: '#b2d8b2',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 24,
    },
    closeText: {
        color: '#388e3c',
        fontSize: 18,
        fontWeight: 'bold',
    },
    receiveAllButton: {
        backgroundColor: '#4caf50',
        borderRadius: 8,
        paddingVertical: 24,
        paddingHorizontal: 32,
    },
    receiveAllText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
})

export default MissionBoard