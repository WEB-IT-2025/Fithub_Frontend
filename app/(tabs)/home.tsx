import React, { useState } from 'react'

import { faGithub, faTwitter } from '@fortawesome/free-brands-svg-icons'
import { faCalendar } from '@fortawesome/free-regular-svg-icons'
import { faCoffee, faDog, faPerson, faScroll, faUser } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
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
import Profile from '../profile'
import PetChange from '../petchange'

// 追加

const iconStyle = { color: '#1DA1F2', fontSize: 32 }

const PET_NAME = 'くろた'
const WALK_PERCENT = 0.6

const HomeScreen = () => {
    const [modalVisible, setModalVisible] = useState(false)
    const [profileVisible, setProfileVisible] = useState(false) // 追加
    const [petChangeVisible, setPetChangeVisible] = useState(false) // ペット変更モーダル用
    const [profileKey, setProfileKey] = useState(0) // Profileコンポーネントの強制再レンダリング用

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
                        <Text style={styles.petName}>{PET_NAME}</Text>
                        <Image
                            source={require('@/assets/images/cat1.png')}
                            style={styles.petImage}
                            resizeMode='cover'
                        />
                        <Text style={styles.label}>今日の歩数</Text>
                        <View style={styles.progressBarBackground}>
                            <View style={[styles.progressBarFill, { width: `${WALK_PERCENT * 100}%` }]} />
                        </View>
                        <Text style={styles.percentText}>5000歩まであと40％</Text>
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
                            <MissionBoard />
                            <TouchableOpacity
                                style={styles.closeModalButtonAbsolute}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.closeModalButtonText}>✕</Text>
                            </TouchableOpacity>
                        </SafeAreaView>
                    :   <View
                            style={[styles.fullScreenModal, { marginTop: 0, paddingTop: StatusBar.currentHeight || 0 }]}
                        >
                            <MissionBoard />
                            <TouchableOpacity
                                style={styles.closeModalButtonAbsolute}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.closeModalButtonText}>✕</Text>
                            </TouchableOpacity>
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
                            <Profile key={profileKey} />
                            <TouchableOpacity
                                style={styles.closeModalButtonAbsolute}
                                onPress={() => setProfileVisible(false)}
                            >
                                <Text style={styles.closeModalButtonText}>✕</Text>
                            </TouchableOpacity>
                        </SafeAreaView>
                    :   <View
                            style={[styles.fullScreenModal, { marginTop: 0, paddingTop: StatusBar.currentHeight || 0 }]}
                        >
                            <Profile key={profileKey} />
                            <TouchableOpacity
                                style={styles.closeModalButtonAbsolute}
                                onPress={() => setProfileVisible(false)}
                            >
                                <Text style={styles.closeModalButtonText}>✕</Text>
                            </TouchableOpacity>
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
                            <PetChange />
                            <TouchableOpacity
                                style={styles.closeModalButtonAbsolute}
                                onPress={() => setPetChangeVisible(false)}
                            >
                                <Text style={styles.closeModalButtonText}>✕</Text>
                            </TouchableOpacity>
                        </SafeAreaView>
                    :   <View
                            style={[styles.fullScreenModal, { marginTop: 0, paddingTop: StatusBar.currentHeight || 0 }]}
                        >
                            <PetChange />
                            <TouchableOpacity
                                style={styles.closeModalButtonAbsolute}
                                onPress={() => setPetChangeVisible(false)}
                            >
                                <Text style={styles.closeModalButtonText}>✕</Text>
                            </TouchableOpacity>
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
    closeModalButtonAbsolute: {
        position: 'absolute',
        left: 16,
        bottom: 30,
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
    },
    progressBarBackground: {
        width: 180,
        height: 20,
        backgroundColor: '#e0e0e0',
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 12,
        borderWidth: 2,
        borderColor: '#fff',
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
    fullScreenModal: {
        flex: 1,
        backgroundColor: '#ffffff',
        position: 'relative',
    },
})

export default HomeScreen
