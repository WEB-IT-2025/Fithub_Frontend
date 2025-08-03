import React, { useEffect, useRef, useState } from 'react'

import { Ionicons } from '@expo/vector-icons'
import {
    Animated,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native'

import missionsData from '../components/Mission'
import MissionList from '../components/MissionList'

type MissionType = 'daily' | 'weekly'

interface MissionBoardProps {
    onClose?: () => void
}

const MissionBoard: React.FC<MissionBoardProps> = ({ onClose }) => {
    const [missions, setMissions] = useState(missionsData)
    const [type, setType] = useState<MissionType>('daily')
    const [toggleWidth, setToggleWidth] = useState(0)
    const sliderAnim = useRef(new Animated.Value(0)).current
    const [clearedId, setClearedId] = useState<string | null>(null)
    const clearAnim = useRef(new Animated.Value(0)).current

    const sliderMargin = 8
    const sliderCount = 2
    const sliderWidth = toggleWidth > 0 ? (toggleWidth - sliderMargin * 2) / sliderCount : 0

    // スライダー位置を計算
    const getLeft = (t: MissionType) => {
        if (toggleWidth === 0) return sliderMargin
        if (t === 'daily') return sliderMargin
        return sliderMargin + sliderWidth
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
            Animated.delay(400),
        ]).start(() => {
            setClearedId(null)
            setMissions((prev) =>
                prev.map((m) => (m.id === id && m.status === 'completed' ? { ...m, board: 'hidden' } : m))
            )
        })
    }

    // すべて受け取る
    const handleReceiveAll = () => {
        setMissions((prev) =>
            prev.map((m) =>
                m.type === type && m.status === 'completed' && m.board === 'display' ? { ...m, board: 'hidden' } : m
            )
        )
    }

    return (
        <View style={{ flex: 1, backgroundColor: 'transparent' }}>
            <View style={styles.container}>
                {/* タイトル */}
                <Text style={styles.title}>ミッション</Text>
                {/* 水平線 */}
                <View style={styles.underline} />

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
                        onLayout={(e) => setToggleWidth(e.nativeEvent.layout.width)}
                    >
                        <View style={[styles.toggleBackgroundShadow, { top: 4, left: 0 }]} />
                        <View style={styles.toggleBackground}>
                            <Animated.View
                                style={[
                                    styles.toggleSlider,
                                    {
                                        left: sliderAnim,
                                        width: sliderWidth || '50%',
                                    },
                                ]}
                            />
                            <TouchableOpacity
                                style={styles.toggleTouchable}
                                onPress={() => setType('daily')}
                                activeOpacity={1}
                            >
                                <Text style={[styles.toggleText, type === 'daily' && styles.activeToggleText]}>
                                    デイリー
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.toggleTouchable}
                                onPress={() => setType('weekly')}
                                activeOpacity={1}
                            >
                                <Text style={[styles.toggleText, type === 'weekly' && styles.activeToggleText]}>
                                    ウィークリー
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* デイリー/ウィークリーラベル */}
                <Text style={styles.sectionLabel}>{type === 'daily' ? 'デイリー' : 'ウィークリー'}</Text>
                <View style={styles.Spacer} />

                {/* ミッションリスト */}
                <MissionList
                    missions={filteredMissions}
                    clearedId={clearedId}
                    clearAnim={clearAnim}
                    onReceive={handleReceive}
                />

                {/* 下部ボタン */}
                <View style={styles.bottomButtons}>
                    <View style={{ flex: 1 }} />
                    <TouchableOpacity
                        style={styles.receiveAllButton}
                        onPress={handleReceiveAll}
                    >
                        <Text style={styles.receiveAllText}>すべて受け取る</Text>
                    </TouchableOpacity>
                </View>

                {/* 閉じるボタン */}
                {onClose && (
                    <TouchableOpacity
                        style={styles.closeModalButtonAbsolute}
                        onPress={onClose}
                    >
                        <Text style={styles.closeModalButtonText}>✕</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent', // ← 背景なし
        borderRadius: 20,
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
        color: '#388e3c',
    },
    underline: {
        height: 1,
        backgroundColor: '#ccc',
        width: '150%',
        alignSelf: 'center',
        marginBottom: 10,
        opacity: 0.5,
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
    sectionLabel: {
        fontSize: 13,
        color: '#136229',
        textAlign: 'left',
        fontWeight: 'bold',
        marginBottom: 4,
        marginLeft: 8,
        opacity: 0.7,
    },
    Spacer: {
        height: 12,
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
    closeModalButtonAbsolute: {
        position: 'absolute',
        left: 16,
        bottom: '1%',
        backgroundColor: '#b2d8b2',
        width: 64,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    closeModalButtonText: {
        color: '#388e3c',
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
    },
})

export default MissionBoard
