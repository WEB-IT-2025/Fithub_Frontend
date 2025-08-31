import React, { useRef } from 'react'

import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { faCheckCircle, faG, faPerson } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { Mission } from './Mission'

interface MissionItemProps {
    mission: Mission
    onReceive: (id: string) => void
    clearedId: string | null
    clearAnim: Animated.Value
    missionIcon?: IconDefinition
}

const MissionItem: React.FC<MissionItemProps> = ({ mission, onReceive, clearedId, clearAnim, missionIcon }) => {
    // Y軸回転用のアニメーション値（540° = 1.5回転）
    const rotateY = clearAnim.interpolate({
        inputRange: [0, 0.5],
        outputRange: ['0deg', '540deg'],
    })

    // 画像表示ロジック
    const renderMissionImage = () => {
        // プロパティで渡されたアイコンを優先
        if (missionIcon) {
            return (
                <View style={[styles.missionImage, { justifyContent: 'center', alignItems: 'center' }]}>
                    <FontAwesomeIcon
                        icon={missionIcon}
                        size={32}
                        color='#388e3c'
                    />
                </View>
            )
        }

        // フォールバック: 画像がない場合
        if (!mission.image) {
            return (
                <View style={[styles.missionImage, { justifyContent: 'center', alignItems: 'center' }]}>
                    <FontAwesomeIcon
                        icon={faPerson}
                        size={32}
                        color='#388e3c'
                    />
                </View>
            )
        }

        // 従来のロジック（文字列ベース）
        if (mission.image === 'faPerson') {
            return (
                <View style={[styles.missionImage, { justifyContent: 'center', alignItems: 'center' }]}>
                    <FontAwesomeIcon
                        icon={faPerson}
                        size={32}
                        color='#388e3c'
                    />
                </View>
            )
        }
        if (mission.image === 'faG') {
            return (
                <View style={[styles.missionImage, { justifyContent: 'center', alignItems: 'center' }]}>
                    <FontAwesomeIcon
                        icon={faG}
                        size={32}
                        color='#388e3c'
                    />
                </View>
            )
        }

        // URLの場合はImage
        return (
            <Image
                source={{ uri: mission.image }}
                style={styles.missionImage}
            />
        )
    }

    // ミッションがクリア可能かどうかを判定
    const isClaimable = () => {
        // progressPercentageが存在する場合はそれを優先
        if (mission.progressPercentage !== undefined) {
            return mission.progressPercentage >= 100
        }
        // フォールバック: 従来のロジック
        return mission.status === 'completed'
    }

    return (
        <View style={{ position: 'relative', marginBottom: 16 }}>
            <View style={[styles.missionItemShadow, { top: 1 }]} />
            <TouchableOpacity
                style={styles.missionItem}
                disabled={!isClaimable()}
                onPress={() => onReceive(mission.id)}
                activeOpacity={isClaimable() ? 0.7 : 1}
            >
                {/* 右上に達成数表示 */}
                <View style={{ position: 'absolute', top: 8, right: 12, zIndex: 2 }}>
                    <Text
                        style={{
                            fontSize: 13,
                            color: isClaimable() ? '#388e3c' : '#888',
                            fontWeight: 'bold',
                            backgroundColor: 'rgba(255,255,255,0.7)',
                            borderRadius: 8,
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                        }}
                    >
                        {mission.currentStatus !== undefined && mission.missionGoal !== undefined ?
                            `${mission.currentStatus}/${mission.missionGoal}`
                        : isClaimable() ?
                            '1/1'
                        :   '0/1'}
                    </Text>
                </View>

                {/* カードのメインコンテンツ */}
                <Animated.View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        width: '100%',
                        transform: [
                            { perspective: 1000 },
                            { rotateY: clearedId === mission.id ? rotateY : '0deg' },
                        ],
                    }}
                >
                    {/* 表面コンテンツ */}
                    {clearedId !== mission.id && (
                        <>
                            {renderMissionImage()}
                            <View style={styles.missionTextContainer}>
                                <Text style={styles.missionTitleCustom}>{mission.title}</Text>
                                <Text style={styles.missionDescCustom}>
                                    {mission.description}
                                    {mission.missionGoal !== undefined && ` (目標: ${mission.missionGoal})`}
                                </Text>
                                <View style={{ height: 8 }} />
                                <View style={styles.progressBarBackground}>
                                    <View
                                        style={[
                                            styles.progressBarFill,
                                            {
                                                width: (() => {
                                                    if (mission.currentStatus !== undefined && mission.missionGoal !== undefined) {
                                                        const progress = Math.min(
                                                            (mission.currentStatus / mission.missionGoal) * 100,
                                                            100
                                                        )
                                                        return `${progress}%`
                                                    } else {
                                                        return isClaimable() ? '100%' : '0%'
                                                    }
                                                })(),
                                            },
                                        ]}
                                    />
                                </View>
                            </View>
                        </>
                    )}

                    {/* 裏面コンテンツ（CLEAR表示） */}
                    {clearedId === mission.id && (
                        <View style={styles.clearContent}>
                            <FontAwesomeIcon 
                                icon={faCheckCircle} 
                                size={32} 
                                color='#fff' 
                            />
                            <Text style={styles.clearTitle}>CLEAR!</Text>
                        </View>
                    )}
                </Animated.View>
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
        padding: 10,
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
        width: 68,
        height: 68,
        borderRadius: 8,
        marginRight: 12,
        backgroundColor: '#b2d8b2',
    },
    missionTextContainer: {
        flex: 1,
    },
    missionTitleCustom: {
        fontSize: 16,
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
    clearContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 88, // ミッションカードの高さと同じに設定
        backgroundColor: '#4caf50',
        borderRadius: 10,
        transform: [{ rotateY: '180deg' }],
        marginLeft: 12, // アイコン領域の幅分オフセット
    },
    clearTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginLeft: 12,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
})

export default MissionItem
