import React, { useState } from 'react'
import { StyleSheet, Text, View, TouchableOpacity, Modal, ImageBackground } from 'react-native'
import { faTwitter } from "@fortawesome/free-brands-svg-icons";
import { faCalendar } from "@fortawesome/free-regular-svg-icons";
import { faCoffee, faDog, faPerson, faScroll, faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import TabBar from '../components/TabBar'
import MissionBoard from '../components/missionboard'


const iconStyle = { color: '#1DA1F2', fontSize: 32 };
const image = require("../assets/images/home_bg.png");

const HomeScreen = () => {
    const [modalVisible, setModalVisible] = useState(false)

    return (
        <ImageBackground
            source={image} style={image}
            // style={{ flex: 1, width: '100%', height: '100%' }}
            resizeMode="cover"
        >
            <View style={styles.container}>
                <Text style={styles.title}>ホーム</Text>
                <View style={styles.buttonGroup}>
                    
                    <TouchableOpacity
                        style={styles.circleButton}
                        onPress={() => {/* プロフィール画面へ遷移など */}}
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

                {/* TabBarを最下部に固定 */}
                <View style={styles.tabBarContainer}>
                    <TabBar />
                </View>
            </View>
        </ImageBackground>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: 20,
        paddingBottom: 120, // ← TabBarの高さ分だけ下に余白を追加
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
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
    buttonGroup: {
        alignItems: 'flex-start',
        width: '100%',
        marginBottom: 20,
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
})

export default HomeScreen
