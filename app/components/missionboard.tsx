import React, { useState, useRef, useEffect } from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, Animated, useWindowDimensions } from 'react-native'
import { Ionicons } from '@expo/vector-icons';
import missionsData from './mission'

type MissionType = 'daily' | 'weekly'

const MissionBoard = () => {
    const [missions, setMissions] = useState(missionsData)
    const [type, setType] = useState<MissionType>('daily')
    const [toggleWidth, setToggleWidth] = useState(0)
    const sliderAnim = useRef(new Animated.Value(0)).current
    const [clearedId, setClearedId] = useState<string | null>(null)
    const clearAnim = useRef(new Animated.Value(0)).current

    // スライダー位置を計算
    const getLeft = (t: MissionType) => {
        if (toggleWidth === 0) return 0
        return t === 'daily' ? 0 : toggleWidth / 2
    }

    useEffect(() => {
        Animated.timing(sliderAnim, {
            toValue: getLeft(type),
            duration: 200,
            useNativeDriver: false,
        }).start()
    }, [type, toggleWidth])

    // ミッションをフィルタリング
    const filteredMissions = missions.filter((m: any) => m.type === type && m.board === 'display')

    // 個別ミッション受け取り
    const handleReceive = (id: string) => {
        setClearedId(id)
        clearAnim.setValue(0)
        Animated.sequence([
            Animated.timing(clearAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.delay(400)
        ]).start(() => {
            setClearedId(null)
            setMissions(prev =>
                prev.map(m =>
                    m.id === id && m.status === 'completed'
                        ? { ...m, board: 'hidden' }
                        : m
                )
            )
        })
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
                <View
                    style={{
                        position: 'relative',
                        width: '100%',
                        maxWidth: 400,
                        alignSelf: 'center',
                        marginBottom: 16,
                    }}
                    onLayout={e => setToggleWidth(e.nativeEvent.layout.width)}
                >
                    {/* 擬似影：真下に少しだけズラす */}
                    <View style={[styles.toggleBackgroundShadow, { top: 4, left: 0 }]} />
                    <View style={styles.toggleBackground}>
                        <Animated.View
                            style={[
                                styles.toggleSlider,
                                {
                                    left: sliderAnim,
                                    width: toggleWidth / 2 || '50%',
                                },
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
            </View>

            {/*空白 */}
            <View style={{ height: 48 }} />

            {/* ミッションリスト */}
            <ScrollView style={styles.missionList}>
                {filteredMissions.map((mission: any, idx: number) => (
                    <View key={idx} style={{ position: 'relative', marginBottom: 16 }}>
                        {/* 擬似影：真下に少しだけズラす */}
                        <View
                            style={[
                                styles.missionItemShadow,
                                { top: 1} // ← 真下に4pxだけズラす
                            ]}
                        />
                        <TouchableOpacity
                            style={styles.missionItem}
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
                            {/* Clear!アニメーション */}
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
                                                        outputRange: [0.7, 1.4]
                                                    })
                                                }
                                            ]
                                        }
                                    ]}
                                    pointerEvents="none"
                                >
                                    <Text style={styles.clearText}>Clear!</Text>
                                </Animated.View>
                            )}
                        </TouchableOpacity>
                    </View>
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
        width: '100%',
    },
    toggleBackground: {
        width: '100%',
        maxWidth: 400,
        height: 44,
        backgroundColor: '#ACEEBB',
        borderRadius: 22,
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
    },
    toggleBackgroundShadow: {
        position: 'absolute',
        width: '100%',
        height: 44,
        backgroundColor: '#98D3A5', // 指定の色
        borderRadius: 22,
        zIndex: 0,
    },
    toggleSlider: {
        position: 'absolute',
        top: 4,
        height: 36,
        backgroundColor: '#136229',
        borderRadius: 18,
        zIndex: 1,
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
        backgroundColor: '#ACEEBB',
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
        // // ドロップシャドウ
        // shadowColor: '#388e3c', // 少し濃い緑
        // shadowOffset: { width: 0, height: 4 },
        // shadowOpacity: 0.18,
        // shadowRadius: 8,
        // elevation: 5,
    },
    missionItemShadow: {
        position: 'absolute',
        width: '100%',
        height: '95%',
        backgroundColor: '#a5cfa5', // missionItemより濃い緑
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
        paddingVertical: 18,
        paddingHorizontal: 32,
    },
    closeText: {
        color: '#388e3c',
        fontSize: 18,
        fontWeight: 'bold',
    },
    receiveAllButton: {
        backgroundColor: '#4caf50',
        borderRadius: 8,
        paddingVertical: 18,
        paddingHorizontal: 32,
    },
    receiveAllText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
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

export default MissionBoard