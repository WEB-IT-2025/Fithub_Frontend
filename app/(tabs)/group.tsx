import React from 'react'
import { View, Text, StyleSheet, ImageBackground, ScrollView, TouchableOpacity } from 'react-native'
import TabBar from '../components/TabBar'

const rooms = [
    { id: 1, name: 'ダイエット部' },
    { id: 2, name: '筋トレ部' },
    { id: 3, name: '同期' },
    { id: 4, name: '開発チーム' },
    { id: 5, name: 'ECC' },
    { id: 6, name: '女子会' },
]

const GroupScreen = () => {
    return (
        <ImageBackground
            source={require('@/assets/images/home_bg.png')}
            style={styles.background}
            resizeMode="cover"
        >
            <View style={styles.container}>
                <Text style={styles.title}>グループ選択</Text>
                <ScrollView contentContainerStyle={styles.roomList}>
                    {rooms.map(room => (
                        <TouchableOpacity key={room.id} style={styles.roomButton}>
                            <Text style={styles.roomButtonText}>{room.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
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
    },
    container: {
        flex: 1,
        paddingTop: 48,
        paddingHorizontal: 16,
        paddingBottom: 64,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#388e3c',
        textAlign: 'center',
        marginBottom: 24,
    },
    roomList: {
        paddingBottom: 24,
    },
    roomButton: {
        backgroundColor: '#ACEEBB',
        borderRadius: 12,
        paddingVertical: 20,
        paddingHorizontal: 24,
        marginBottom: 16,
        alignItems: 'center',
        shadowColor: '#98D3A5',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    roomButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#136229',
    },
    tabBarContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
    },
})

export default GroupScreen