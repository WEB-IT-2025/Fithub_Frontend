import React, { useCallback, useEffect, useState } from 'react'

import { faGithub, faTwitter } from '@fortawesome/free-brands-svg-icons'
import { faCalendar } from '@fortawesome/free-regular-svg-icons'
import { faCoffee, faDog, faPerson, faScroll, faUser } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFocusEffect } from '@react-navigation/native'
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

const WALK_GOAL = 5000 // 目標歩数

// ペット画像のマッピング関数
const getImageSource = (imageName: string) => {
    const imageMap: { [key: string]: any } = {
        'gifcat.gif': require('@/assets/images/gifcat.gif'),
        'pome.png': require('@/assets/images/pome.png'),
        'tora_cat.png': require('@/assets/images/tora_cat.png'),
        'mike_cat.png': require('@/assets/images/mike_cat.png'),
        'black_cat.png': require('@/assets/images/black_cat.png'),
        'vitiligo_cat.png': require('@/assets/images/vitiligo_cat.png'),
        'fithub_cat.png': require('@/assets/images/fithub_cat.png'),
        'bulldog.png': require('@/assets/images/bulldog.png'),
        'chihuahua.png': require('@/assets/images/chihuahua.png'),
        'shiba_dog.png': require('@/assets/images/shiba_dog.png'),
        'penguin.png': require('@/assets/images/penguin.png'),
        'gingin_penguin.png': require('@/assets/images/gingin_penguin.png'),
        'rabbit.png': require('@/assets/images/rabbit.png'),
        'panda.png': require('@/assets/images/panda.png'),
        'zebra.png': require('@/assets/images/zebra.png'),
        'slime.png': require('@/assets/images/slime.png'),
        'takopee.png': require('@/assets/images/takopee.png'),
        'toipo.png': require('@/assets/images/toipo.png'),
        'chinpan.png': require('@/assets/images/chinpan.png'),
    }
    return imageMap[imageName] || require('@/assets/images/gifcat.gif')
}

const HomeScreen = () => {
    const [modalVisible, setModalVisible] = useState(false)
    const [profileVisible, setProfileVisible] = useState(false)
    const [petChangeVisible, setPetChangeVisible] = useState(false) // ペット変更モーダル用
    const [profileKey, setProfileKey] = useState(0)
    const [steps, setSteps] = useState<number | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [petProfile, setPetProfile] = useState({
        main_pet_name: 'とりゃー',
        main_pet_user_name: 'ローディング中...',
        main_pet_image_url: 'gifcat.gif',
        main_pet_size: 50,
        main_pet_intimacy: 0,
    })

    // ペット情報取得関数を分離
    const fetchPetProfile = useCallback(async () => {
        console.log('ペット情報取得開始')
        try {
            const token = await AsyncStorage.getItem('session_token')
            if (!token) {
                console.log('トークンが見つかりません')
                return
            }
            console.log('トークン取得成功:', token.substring(0, 10) + '...')

            // JWTからユーザーIDを取得
            const parseJwtPayload = (token: string): any | null => {
                try {
                    const parts = token.split('.')
                    if (parts.length !== 3) return null
                    const payload = parts[1]
                    let base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
                    switch (base64.length % 4) {
                        case 2:
                            base64 += '=='
                            break
                        case 3:
                            base64 += '='
                            break
                    }
                    return JSON.parse(atob(base64))
                } catch {
                    return null
                }
            }

            const payload = parseJwtPayload(token)
            const userId = payload?.user_id
            if (!userId) {
                console.log('ユーザーIDが取得できません')
                return
            }

            const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.11.57:3000').replace(
                /\/+$/,
                ''
            )
            console.log('APIベースURL:', API_BASE_URL)

            const res = await fetch(`${API_BASE_URL}/api/pet/profile/${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            console.log('レスポンスステータス:', res.status)

            if (res.ok) {
                const data = await res.json()
                console.log('レスポンスデータ:', data)

                if (data.success && data.data) {
                    console.log('ペット情報更新:', data.data)
                    setPetProfile({
                        main_pet_name: data.data.main_pet_name || 'とりゃー',
                        main_pet_user_name: data.data.main_pet_user_name || 'ペット',
                        main_pet_image_url: data.data.main_pet_image_url || 'gifcat.gif',
                        main_pet_size: data.data.main_pet_size || 50,
                        main_pet_intimacy: data.data.main_pet_intimacy || 0,
                    })
                } else {
                    console.log('データ構造が不正:', data)
                    // デフォルト値にリセット
                    setPetProfile({
                        main_pet_name: 'とりゃー',
                        main_pet_user_name: 'データエラー',
                        main_pet_image_url: 'gifcat.gif',
                        main_pet_size: 50,
                        main_pet_intimacy: 0,
                    })
                }
            } else {
                const errorText = await res.text()
                console.log('APIエラー:', res.status, errorText)
                // デフォルト値にリセット
                setPetProfile({
                    main_pet_name: 'とりゃー',
                    main_pet_user_name: 'API接続エラー',
                    main_pet_image_url: 'gifcat.gif',
                    main_pet_size: 50,
                    main_pet_intimacy: 0,
                })
            }
        } catch (e) {
            console.log('ペット情報取得エラー:', e)
            // デフォルト値にリセット
            setPetProfile({
                main_pet_name: 'とりゃー',
                main_pet_user_name: '通信エラー',
                main_pet_image_url: 'gifcat.gif',
                main_pet_size: 50,
                main_pet_intimacy: 0,
            })
        }
    }, [])

    // 初回とフォーカス時にペット情報を取得
    useFocusEffect(
        useCallback(() => {
            fetchPetProfile()
        }, [fetchPetProfile])
    )

    // ペット変更モーダルを閉じる際の処理
    const handlePetChangeClose = useCallback(() => {
        setPetChangeVisible(false)
        // ペット変更後にデータを再取得
        setTimeout(() => {
            fetchPetProfile()
        }, 500) // 少し待ってから再取得
    }, [fetchPetProfile])

    // APIから今日の歩数データを取得
    useEffect(() => {
        const fetchSteps = async () => {
            setIsLoading(true)
            try {
                const token = await AsyncStorage.getItem('session_token')
                if (!token) return

                // JWTからユーザーIDを取得
                const parseJwtPayload = (token: string): any | null => {
                    try {
                        const parts = token.split('.')
                        if (parts.length !== 3) return null
                        const payload = parts[1]
                        let base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
                        switch (base64.length % 4) {
                            case 2:
                                base64 += '=='
                                break
                            case 3:
                                base64 += '='
                                break
                        }
                        return JSON.parse(atob(base64))
                    } catch {
                        return null
                    }
                }

                const payload = parseJwtPayload(token)
                const userId = payload?.user_id
                if (!userId) {
                    console.log('ユーザーIDが取得できません')
                    return
                }

                const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.11.57:3000').replace(
                    /\/+$/,
                    ''
                )

                const res = await fetch(`${API_BASE_URL}/api/data/hourly/${userId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                })

                if (res.ok) {
                    const data = await res.json()
                    console.log('時間別歩数データ:', data)

                    if (data.success && data.data && typeof data.data.total_steps === 'number') {
                        // APIレスポンスのtotal_stepsを取得
                        const totalSteps = data.data.total_steps
                        console.log('今日の総歩数:', totalSteps)
                        setSteps(totalSteps)
                    } else {
                        console.log('total_stepsが不正:', data)
                        setSteps(0)
                    }
                } else {
                    const errorText = await res.text()
                    console.log('時間別歩数APIエラー:', res.status, errorText)
                    setSteps(0)
                }
            } catch (e) {
                console.log('歩数取得エラー:', e)
                setSteps(0)
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
                            onPress={() => setPetChangeVisible(true)}
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
                        <Text style={styles.petName}>{petProfile.main_pet_user_name}</Text>
                        <Image
                            source={getImageSource(petProfile.main_pet_image_url)}
                            style={[
                                styles.petImage,
                                {
                                    width: Math.min(petProfile.main_pet_size * 2 + 1, 280), // サイズ調整：最小80、最大280（より激しい変化）
                                    height: Math.min(petProfile.main_pet_size * 2 + 1, 280),
                                },
                            ]}
                            resizeMode='contain'
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
                                            目標まであと
                                            {Math.max(0, 100 - (steps / WALK_GOAL) * 100).toFixed(1)}％
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
                    onRequestClose={handlePetChangeClose}
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
                            <PetChange onClose={handlePetChangeClose} />
                        </SafeAreaView>
                    :   <View
                            style={[styles.fullScreenModal, { marginTop: 0, paddingTop: StatusBar.currentHeight || 0 }]}
                        >
                            <PetChange onClose={handlePetChangeClose} />
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
