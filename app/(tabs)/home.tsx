import React, { useState } from 'react'
import { StyleSheet, Text, View, TouchableOpacity, Modal } from 'react-native'
import TabBar from '../components/TabBar'
import MissionBoard from '../components/missionboard'
import Profile from '../components/common/profile' // 追加
import { useRouter } from 'expo-router'

const HomeScreen = () => {
    const [modalVisible, setModalVisible] = useState(false)
    const [profileVisible, setProfileVisible] = useState(false) // 追加
    const router = useRouter()

    return (
        <View style={styles.container}>
            <Text style={styles.title}>ホーム</Text>
            <TouchableOpacity
                style={styles.missionButton}
                onPress={() => setModalVisible(true)}
            >
                <Text style={styles.missionButtonText}>ミッションボード</Text>
            </TouchableOpacity>

            {/* プロフィール画面への遷移ボタンを追加 */}
            <TouchableOpacity
                style={[styles.missionButton, { backgroundColor: '#388e3c' }]}
                onPress={() => setProfileVisible(true)}
            >
                <Text style={styles.missionButtonText}>プロフィール</Text>
            </TouchableOpacity>

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
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    missionButton: {
        backgroundColor: '#4caf50',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        marginBottom: 20,
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
})

export default HomeScreen
