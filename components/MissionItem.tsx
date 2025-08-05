import React, { useRef } from 'react'

import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
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
    // FontAwesomeアイコン用import（フォールバック用）
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { faPerson, faG } = require('@fortawesome/free-solid-svg-icons')

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
                {/* 左側に画像 or アイコン表示 */}
                {renderMissionImage()}
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
})

export default MissionItem
