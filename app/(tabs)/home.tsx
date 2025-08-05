import React, { useEffect, useState } from 'react'

import { faGithub, faTwitter } from '@fortawesome/free-brands-svg-icons'
import { faCalendar } from '@fortawesome/free-regular-svg-icons'
import { faCoffee, faDog, faPerson, faScroll, faUser } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { BlurView } from 'expo-blur'
import {
    Image,
    ImageBackground,
    Modal,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import TabBar from '../../components/TabBar'
import MissionBoard from '../missionboard'
import PetChange from '../petchange'
import Profile from '../profile'

// 追加

const iconStyle = { color: '#1DA1F2', fontSize: 32 }

const PET_NAME = 'とりゃー'
const WALK_GOAL = 5000 // 目標歩数

const HomeScreen = () => {
    const [modalVisible, setModalVisible] = useState(false)
    const [profileVisible, setProfileVisible] = useState(false)
    const [petChangeVisible, setPetChangeVisible] = useState(false)
    const [profileKey, setProfileKey] = useState(0)
    const [steps, setSteps] = useState<number | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    // APIから今日の歩数データを取得
    useEffect(() => {
        const fetchSteps = async () => {
            setIsLoading(true)
            try {
                const token = await AsyncStorage.getItem('session_token')
                if (!token) return
                const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || 'http://10.200.4.2:3000').replace(
                    /\/+$/,
                    ''
                )
                const res = await fetch(`${API_BASE_URL}/api/data/user`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                })
                if (res.ok) {
                    const data = await res.json()
                    if (data.success && data.data && data.data.today && typeof data.data.today.steps === 'number') {
                        setSteps(data.data.today.steps)
                    }
                }
            } catch (e) {
                // エラーは無視
            } finally {
                setIsLoading(false)
            }
        }
        fetchSteps()
    }, [])

    return (
        <ImageBackground
            source={require('@/assets/images/home_bg.png')}
            style={styles.background}
            resizeMode='cover'
        >
            <View style={styles.container}>
                <View style={styles.row}>
                    {/* 左側ボタン */}
                    <View style={styles.sideButtonGroup}>
                        <TouchableOpacity
                            style={styles.circleButton}
                            onPress={() => {
                                setProfileKey((prev) => prev + 1) // キーを更新して強制再レンダリング
                                setTimeout(() => {
                                    setProfileVisible(true) // プロフィールモーダルを0.5秒後に開く
                                }, 200)
                            }}
                        >
                            <FontAwesomeIcon
                                style={iconStyle}
                                icon={faUser}
                                size={30}
                                color='black'
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.circleButton}
                            onPress={() => {
                                setPetChangeVisible(true)
                            }}
                        >
                            <FontAwesomeIcon
                                style={iconStyle}
                                icon={faDog}
                                size={30}
                                color='black'
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.circleButton}
                            onPress={() => setModalVisible(true)}
                        >
                            <FontAwesomeIcon
                                style={iconStyle}
                                icon={faScroll}
                                size={30}
                                color='black'
                            />
                        </TouchableOpacity>
                    </View>

                    {/* 中央ペット情報 */}
                    <View style={styles.petInfo}>
                        <Text style={styles.petName}>{PET_NAME}</Text>
                        <Image
                            source={require('@/assets/images/gifcat.gif')}
                            style={styles.petImage}
                            resizeMode='cover'
                        />
                        <Text style={styles.label}>今日の歩数</Text>
                        <View style={[styles.progressBarBackground, { position: 'relative' }]}>
                            <View
                                style={[
                                    styles.progressBarFill,
                                    {
                                        width: `${steps !== null ? Math.min(steps / WALK_GOAL, 1) * 100 : 0}%`,
                                    },
                                ]}
                            />
                            {steps !== null && (
                                <View
                                    style={{
                                        position: 'absolute',
                                        left: 0,
                                        right: 0,
                                        top: 0,
                                        bottom: 0,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        zIndex: 2,
                                    }}
                                    pointerEvents='none'
                                >
                                    <Text
                                        style={{
                                            color: '#fff',
                                            fontWeight: 'bold',
                                            fontSize: 14,
                                            textAlign: 'center',
                                            includeFontPadding: false,
                                            textShadowColor: 'rgba(0,0,0,0.5)',
                                            textShadowOffset: { width: 0, height: 2 },
                                            textShadowRadius: 3,
                                            elevation: 4, // Android用の影
                                            shadowColor: '#000', // iOS用の影
                                            shadowOffset: { width: 0, height: 2 },
                                            shadowOpacity: 0.1,
                                            shadowRadius: 2,
                                        }}
                                        numberOfLines={1}
                                    >
                                        {steps.toLocaleString()}
                                    </Text>
                                </View>
                            )}
                        </View>
                        {isLoading ?
                            <Text style={styles.percentText}>読込中...</Text>
                        : steps !== null ?
                            steps >= WALK_GOAL ?
                                <Text style={styles.percentText}>目標達成！</Text>
                            :   <View style={styles.goalContainer}>
                                    <BlurView
                                        intensity={5}
                                        tint='light'
                                        style={styles.blurBackground}
                                    >
                                        <Text style={styles.goalText}>
                                            目標まであと{100 - Math.floor((steps / WALK_GOAL) * 100)}％
                                        </Text>
                                    </BlurView>
                                </View>

                        :   <Text style={styles.percentText}>データなし</Text>}
                    </View>

                    {/* 右側ボタン（クローン） */}
                    <View style={styles.sideButtonGroup}></View>
                </View>

                {/* ミッションボードモーダル */}
                <Modal
                    visible={modalVisible}
                    animationType='slide'
                    onRequestClose={() => setModalVisible(false)}
                    statusBarTranslucent={true}
                    presentationStyle='fullScreen'
                    hardwareAccelerated={true}
                >
                    <StatusBar
                        barStyle='dark-content'
                        backgroundColor='transparent'
                        translucent={true}
                        hidden={Platform.OS === 'android'}
                    />
                    {Platform.OS === 'ios' ?
                        <SafeAreaView style={styles.fullScreenModal}>
                            <MissionBoard onClose={() => setModalVisible(false)} />
                        </SafeAreaView>
                    :   <View
                            style={[styles.fullScreenModal, { marginTop: 0, paddingTop: StatusBar.currentHeight || 0 }]}
                        >
                            <MissionBoard onClose={() => setModalVisible(false)} />
                        </View>
                    }
                </Modal>

                {/* プロフィールモーダル */}
                <Modal
                    visible={profileVisible}
                    animationType='slide'
                    onRequestClose={() => setProfileVisible(false)}
                    statusBarTranslucent={true}
                    presentationStyle='fullScreen'
                    hardwareAccelerated={true}
                >
                    <StatusBar
                        barStyle='dark-content'
                        backgroundColor='transparent'
                        translucent={true}
                        hidden={Platform.OS === 'android'}
                    />
                    {Platform.OS === 'ios' ?
                        <SafeAreaView style={styles.fullScreenModal}>
                            <Profile
                                key={profileKey}
                                onClose={() => setProfileVisible(false)}
                            />
                        </SafeAreaView>
                    :   <View
                            style={[styles.fullScreenModal, { marginTop: 0, paddingTop: StatusBar.currentHeight || 0 }]}
                        >
                            <Profile
                                key={profileKey}
                                onClose={() => setProfileVisible(false)}
                            />
                        </View>
                    }
                </Modal>

                {/* ペット変更モーダル */}
                <Modal
                    visible={petChangeVisible}
                    animationType='slide'
                    onRequestClose={() => setPetChangeVisible(false)}
                    statusBarTranslucent={true}
                    presentationStyle='fullScreen'
                    hardwareAccelerated={true}
                >
                    <StatusBar
                        barStyle='dark-content'
                        backgroundColor='transparent'
                        translucent={true}
                        hidden={Platform.OS === 'android'}
                    />
                    {Platform.OS === 'ios' ?
                        <SafeAreaView style={styles.fullScreenModal}>
                            <PetChange onClose={() => setPetChangeVisible(false)} />
                        </SafeAreaView>
                    :   <View
                            style={[styles.fullScreenModal, { marginTop: 0, paddingTop: StatusBar.currentHeight || 0 }]}
                        >
                            <PetChange onClose={() => setPetChangeVisible(false)} />
                        </View>
                    }
                </Modal>

                {/* TabBarを最下部に固定 */}
                <View style={styles.tabBarContainer}>
                    <TabBar />
                </View>
            </View>
        </ImageBackground>
    )
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: 20,
        paddingBottom: 20,
    },
    missionButton: {
        backgroundColor: '#fff',
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        elevation: 2,
    },
    missionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    tabBarContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'transparent',
    },
    row: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    sideButtonGroup: {
        flex: 1,
        alignItems: 'flex-start',
    },
    petInfo: {
        flex: 3,
        alignItems: 'center',
        justifyContent: 'center',
    },
    circleButton: {
        backgroundColor: '#fff',
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        // ドロップシャドウ追加
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 4, // Android用の影を強化
    },
    petName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 16,
        backgroundColor: 'rgba(0,0,0,0.4)',
        color: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 4,
        borderRadius: 8,
        overflow: 'hidden',
    },
    petImage: {
        width: 170,
        height: 170,
        marginBottom: 36,
    },
    label: {
        fontSize: 18,
        color: '#fff',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 6,
    },
    progressBarBackground: {
        width: 180,
        height: 26,
        backgroundColor: '#e0e0e0',
        borderRadius: 25,
        overflow: 'hidden',
        marginBottom: 12,
        borderWidth: 2,
        borderColor: '#e0e0e0',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#4caf50',
    },
    percentText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: 'bold',
    },
    goalContainer: {
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 4,
    },
    blurBackground: {
        paddingHorizontal: 1,
        paddingVertical: 1,
        borderRadius: 1,
    },
    goalText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.7)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    fullScreenModal: {
        flex: 1,
        backgroundColor: '#fff',
        position: 'relative',
    },
})

export default HomeScreen
