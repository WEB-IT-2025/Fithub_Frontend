import React, { useState } from 'react'
import { StyleSheet, Text, View, TouchableOpacity, Modal, ImageBackground, Image } from 'react-native'
import { faGithub, faTwitter } from "@fortawesome/free-brands-svg-icons";
import { faCalendar } from "@fortawesome/free-regular-svg-icons";
import { faCoffee, faDog, faPerson, faScroll, faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import TabBar from '../components/TabBar'
import MissionBoard from '../components/missionboard'
import Profile from '../components/profile' // 追加


const iconStyle = { color: '#1DA1F2', fontSize: 32 };

const PET_NAME = 'くろた'
const WALK_PERCENT = 0.6

const HomeScreen = () => {
    const [modalVisible, setModalVisible] = useState(false)
    const [profileVisible, setProfileVisible] = useState(false) // 追加

    return (
        <ImageBackground
            source={require('@/assets/images/home_bg.png')}
            style={styles.background}
            resizeMode="cover"
        >
            <View style={styles.container}>
                <View style={styles.row}>
                    {/* 左側ボタン */}
                    <View style={styles.sideButtonGroup}>
                        <TouchableOpacity
                            style={styles.circleButton}
                            onPress={() => setProfileVisible(true)} // プロフィールモーダルを開く
                        >
                            <FontAwesomeIcon style={iconStyle} icon={faUser} size={30}  color='black'/>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.circleButton}
                            onPress={() => {/* ペット画面へ遷移など */}}
                        >
                            <FontAwesomeIcon style={iconStyle} icon={faDog} size={30} color='black' />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.circleButton}
                            onPress={() => setModalVisible(true)}
                        >
                            <FontAwesomeIcon style={iconStyle} icon={faScroll} size={30} color='black' />
                        </TouchableOpacity>
                    </View>

                    {/* 中央ペット情報 */}
                    <View style={styles.petInfo}>
                        <Text style={styles.petName}>{PET_NAME}</Text>
                        <Image
                            source={require('@/assets/images/cat_test.png')}
                            style={styles.petImage}
                            resizeMode="cover"
                        />
                        <Text style={styles.label}>今日の歩数</Text>
                        <View style={styles.progressBarBackground}>
                            <View style={[styles.progressBarFill, { width: `${WALK_PERCENT * 100}%` }]} />
                        </View>
                        <Text style={styles.percentText}>5000歩まであと40％</Text>
                    </View>

                    {/* 右側ボタン（クローン） */}
                    <View style={styles.sideButtonGroup}>
                        
                        
                    </View>
                </View>

                {/* ミッションボードモーダル */}
                <Modal
                    visible={modalVisible}
                    animationType="slide"
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <View style={{ width: '90%', height: '90%', position: 'relative' }}>
                            <MissionBoard />
                            <TouchableOpacity
                                style={styles.closeModalButtonAbsolute}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.closeModalButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* プロフィールモーダル */}
                <Modal
                    visible={profileVisible}
                    animationType="slide"
                    onRequestClose={() => setProfileVisible(false)}
                >
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <View style={{ width: '90%', height: '90%', position: 'relative' }}>
                            <Profile />
                            <TouchableOpacity
                                style={styles.closeModalButtonAbsolute}
                                onPress={() => setProfileVisible(false)}
                            >
                                <Text style={styles.closeModalButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
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
        bottom: 16,
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
        elevation: 2,
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
})

export default HomeScreen
