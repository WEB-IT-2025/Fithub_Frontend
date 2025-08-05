import React, { useEffect, useRef, useState } from 'react';



import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Animated, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';



import missionsData, { Mission } from '../components/Mission';
import MissionList from '../components/MissionList';





type MissionType = 'daily' | 'weekly'

// API レスポンスの型定義
interface ApiMission {
    mission_id: string
    mission_name: string
    mission_content: string
    mission_goal: number
    mission_category: 'daily' | 'weekly'
    mission_type: string
    mission_reward: string
    reward_content: number
    clear_status: number // 0: 未完了, 1: 完了
    clear_time: string | null
    current_status: number
    progress_percentage: string
}

interface MissionBoardProps {
    onClose?: () => void
}

const MissionBoard: React.FC<MissionBoardProps> = ({ onClose }) => {
    const [missions, setMissions] = useState(missionsData)
    const [apiMissions, setApiMissions] = useState<ApiMission[]>([])
    const [type, setType] = useState<MissionType>('daily')
    const [toggleWidth, setToggleWidth] = useState(0)
    const sliderAnim = useRef(new Animated.Value(0)).current
    const [clearedId, setClearedId] = useState<string | null>(null)
    const clearAnim = useRef(new Animated.Value(0)).current
    const [loading, setLoading] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)
    const [sessionToken, setSessionToken] = useState<string | null>(null)

    const sliderMargin = 8
    const sliderCount = 2
    const sliderWidth = toggleWidth > 0 ? (toggleWidth - sliderMargin * 2) / sliderCount : 0

    // ユーザーIDとトークンを取得
    useEffect(() => {
        const getAuthInfo = async () => {
            try {
                const storedUserId = await AsyncStorage.getItem('user_id')
                const storedToken = await AsyncStorage.getItem('session_token')
                setUserId(storedUserId)
                setSessionToken(storedToken)
                console.log('🔍 ミッションボード: ユーザーID取得完了:', storedUserId)
                console.log('🔍 ミッションボード: トークン取得完了:', storedToken ? '有り' : '無し')
            } catch (error) {
                console.error('❌ ミッションボード: 認証情報取得エラー:', error)
            }
        }
        getAuthInfo()
    }, [])

    // APIからミッションデータを取得
    const fetchMissions = async (category: MissionType, cleared: boolean) => {
        if (!userId || !sessionToken) {
            console.log('⚠️ ユーザーIDまたはトークンがないため、API呼び出しをスキップ')
            return
        }

        try {
            setLoading(true)
            const apiUrl = `${process.env.EXPO_PUBLIC_API_TEST_URL}/api/mission/details?user_id=${userId}&category=${category}&cleared=${cleared}`
            console.log('🚀 ミッションAPI呼び出し:', apiUrl)
            console.log('🔑 認証トークン使用:', sessionToken ? '有り' : '無し')

            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${sessionToken}`,
                },
            })

            if (response.ok) {
                const data = await response.json()
                console.log('✅ ミッションAPI成功:', data)

                // APIレスポンスが配列の場合（successプロパティなし）
                if (Array.isArray(data)) {
                    setApiMissions(data)
                    console.log(`📋 ${category}ミッション取得完了: ${data.length}件`)
                } else if (data.success && Array.isArray(data.data)) {
                    // 従来の形式（successプロパティあり）
                    setApiMissions(data.data)
                    console.log(`📋 ${category}ミッション取得完了: ${data.data.length}件`)
                } else {
                    console.warn('⚠️ ミッションAPIレスポンス形式が予期しない:', data)
                    setApiMissions([])
                }
            } else {
                const errorText = await response.text()
                console.error('❌ ミッションAPI失敗:', response.status, errorText)
                setApiMissions([])
            }
        } catch (error) {
            console.error('❌ ミッションAPI呼び出しエラー:', error)
            setApiMissions([])
        } finally {
            setLoading(false)
        }
    }

    // ユーザーIDとトークンが取得できたら初期データを読み込み
    useEffect(() => {
        if (userId && sessionToken) {
            // 未完了ミッションのみ取得
            fetchMissions(type, false)
        }
    }, [userId, sessionToken, type])

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

    // APIミッションをローカル形式に変換
    const convertApiMissionsToLocal = (apiMissions: ApiMission[]): Mission[] => {
        return apiMissions.map((mission) => ({
            id: mission.mission_id,
            title: mission.mission_name,
            description: `${mission.mission_content} (目標: ${mission.mission_goal})`,
            type: mission.mission_category,
            status: mission.clear_status === 1 ? ('completed' as const) : ('not achieved' as const),
            board: 'display' as const,
            image: getImageForMissionType(mission.mission_type),
        }))
    }

    // ミッションタイプに応じた画像URLを取得
    const getImageForMissionType = (missionType: string): string | null => {
        switch (missionType) {
            case 'step':
                return 'https://example.com/step-icon.png'
            case 'contribution':
                return 'https://example.com/contribution-icon.png'
            default:
                return 'https://example.com/default-mission-icon.png'
        }
    }

    // ミッションをフィルタリング（APIデータを優先、フォールバックとしてローカルデータを使用）
    const getFilteredMissions = () => {
        if (apiMissions.length > 0) {
            const convertedMissions = convertApiMissionsToLocal(apiMissions)
            return convertedMissions.filter((m: any) => m.type === type && m.board === 'display')
        } else {
            return missions.filter((m: any) => m.type === type && m.board === 'display')
        }
    }

    const filteredMissions = getFilteredMissions()

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
                                onPress={() => {
                                    setType('daily')
                                    if (userId && sessionToken) fetchMissions('daily', true)
                                }}
                                activeOpacity={1}
                            >
                                <Text style={[styles.toggleText, type === 'daily' && styles.activeToggleText]}>
                                    デイリー
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.toggleTouchable}
                                onPress={() => {
                                    setType('weekly')
                                    if (userId && sessionToken) fetchMissions('weekly', true)
                                }}
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
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionLabel}>{type === 'daily' ? 'デイリー' : 'ウィークリー'}</Text>
                    {loading && <Text style={styles.loadingText}>読み込み中...</Text>}
                    {apiMissions.length > 0 && (
                        <Text style={styles.dataSourceText}>API連携済み ({apiMissions.length}件)</Text>
                    )}
                </View>
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
        backgroundColor: 'transparent',
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
        backgroundColor: '#98D3A5',
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
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
        marginLeft: 8,
        marginRight: 8,
    },
    loadingText: {
        fontSize: 11,
        color: '#666',
        fontStyle: 'italic',
    },
    dataSourceText: {
        fontSize: 10,
        color: '#4caf50',
        fontWeight: 'bold',
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