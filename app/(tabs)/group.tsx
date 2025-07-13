import React, { useEffect, useRef, useState } from 'react'

import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { Animated, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

import TabBar from '../components/TabBar'

const rooms = [
    {
        id: 1,
        name: 'ダイエット部',
        type: 'home',
        image: require('@/assets/images/cat_test.png'),
        createdDate: '2024/01/15',
        memberCount: 5,
        maxMembers: 10,
    },
    {
        id: 2,
        name: '筋トレ部',
        type: 'home',
        image: require('@/assets/images/cat_test.png'),
        createdDate: '2024/02/03',
        memberCount: 5,
        maxMembers: 10,
    },
    {
        id: 3,
        name: '同期',
        type: 'home',
        image: require('@/assets/images/cat_test.png'),
        createdDate: '2024/01/20',
        memberCount: 5,
        maxMembers: 10,
    },
    {
        id: 4,
        name: '開発チーム',
        type: 'search',
        image: require('@/assets/images/cat_test.png'),
        createdDate: '2024/03/10',
        memberCount: 5,
        maxMembers: 10,
    },
    {
        id: 5,
        name: 'ECC',
        type: 'search',
        image: require('@/assets/images/cat_test.png'),
        createdDate: '2024/02/28',
        memberCount: 5,
        maxMembers: 10,
    },
    {
        id: 6,
        name: '女子会',
        type: 'search',
        image: require('@/assets/images/cat_test.png'),
        createdDate: '2024/03/05',
        memberCount: 10,
        maxMembers: 10,
    },
]

type TabType = 'home' | 'search'

const GroupScreen = () => {
    const router = useRouter()
    const [type, setType] = useState<TabType>('home')
    const [toggleWidth, setToggleWidth] = useState(0)
    const [searchText, setSearchText] = useState('')
    const sliderAnim = useRef(new Animated.Value(0)).current

    const sliderMargin = 8
    const sliderCount = 2
    const sliderWidth = toggleWidth > 0 ? (toggleWidth - sliderMargin * 2) / sliderCount : 0

    // スライダー位置を計算
    const getLeft = (t: TabType) => {
        if (toggleWidth === 0) return sliderMargin
        if (t === 'home') return sliderMargin
        return sliderMargin + sliderWidth
    }

    useEffect(() => {
        Animated.timing(sliderAnim, {
            toValue: getLeft(type),
            duration: 200,
            useNativeDriver: false,
        }).start()
    }, [type, toggleWidth])

    // グループをフィルタリング
    const filteredRooms = rooms.filter((room) => room.type === type)

    return (
        <View style={styles.background}>
            <View style={styles.container}>
                {/* タイトル */}
                <Text style={styles.title}>グループ</Text>
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
                                onPress={() => setType('home')}
                                activeOpacity={1}
                            >
                                <Text style={[styles.toggleText, type === 'home' && styles.activeToggleText]}>
                                    ホーム
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.toggleTouchable}
                                onPress={() => setType('search')}
                                activeOpacity={1}
                            >
                                <Text style={[styles.toggleText, type === 'search' && styles.activeToggleText]}>
                                    探す
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* セクションラベル */}
                <Text style={styles.sectionLabel}>{type === 'home' ? 'ホーム' : '探す'}</Text>
                <View style={styles.spacer} />

                {/* グループリスト */}
                <ScrollView style={styles.groupList}>
                    {filteredRooms.map((room, idx) => (
                        <View
                            key={idx}
                            style={{ position: 'relative', marginBottom: 16 }}
                        >
                            <View style={[styles.groupItemShadow, { top: 1 }]} />
                            <TouchableOpacity
                                style={styles.groupItem}
                                onPress={() =>
                                    router.push({ pathname: '/rooms/[roomId]', params: { roomId: String(room.id) } })
                                }
                            >
                                {/* 右下に作成日表示 */}
                                <View style={{ position: 'absolute', bottom: 8, right: 12, zIndex: 2 }}>
                                    <Text
                                        style={{
                                            fontSize: 12,
                                            color: '#666',
                                            fontWeight: 'normal',
                                        }}
                                    >
                                        {room.createdDate}
                                    </Text>
                                </View>

                                {/* ルーム画像 */}
                                <Image
                                    source={room.image}
                                    style={styles.groupImage}
                                    resizeMode='cover'
                                />

                                <View style={styles.groupTextContainer}>
                                    {/* ルーム名 */}
                                    <Text style={styles.groupName}>{room.name}</Text>
                                    {/* 参加人数 */}
                                    <Text style={styles.groupMemberCount}>
                                        参加人数：{room.memberCount} / {room.maxMembers}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>

                {/* 下部検索バーと＋ボタン */}
                <View style={styles.bottomSection}>
                    <View style={styles.searchContainer}>
                        <TextInput
                            style={styles.searchInput}
                            placeholder='グループを検索...'
                            placeholderTextColor='#888'
                            value={searchText}
                            onChangeText={setSearchText}
                        />
                    </View>
                    <TouchableOpacity style={styles.addButton}>
                        <Ionicons
                            name='add'
                            size={24}
                            color='#000'
                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.tabBarContainer}>
                    <TabBar />
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        backgroundColor: '#fff', // 背景を白に変更
    },
    container: {
        flex: 1,
        backgroundColor: 'transparent',
        borderRadius: 20,
        paddingTop: 48,
        paddingHorizontal: 16,
        paddingBottom: 64,
    },
    title: {
        paddingTop: 24,
        fontSize: 24,
        fontWeight: 'bold',
        color: '#388e3c',
        textAlign: 'center',
        marginBottom: 10,
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
    spacer: {
        height: 12,
    },
    groupList: {
        flex: 1,
        marginBottom: 80, // TabBarとの間隔を確保
    },
    groupItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ACEEBB',
        borderRadius: 10,
        padding: 18,
        marginBottom: 10,
    },
    groupItemShadow: {
        position: 'absolute',
        width: '100%',
        height: '95%',
        backgroundColor: '#a5cfa5',
        borderRadius: 10,
        zIndex: 0,
    },
    groupTextContainer: {
        flex: 1,
    },
    groupImage: {
        width: 48,
        height: 48,
        borderRadius: 8,
        marginRight: 12,
        backgroundColor: '#b2d8b2',
    },
    groupName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
        textAlign: 'left',
        marginBottom: 8,
    },
    groupMemberCount: {
        fontSize: 15,
        color: '#222',
        textAlign: 'left',
    },
    bottomSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 80, // TabBarとの間隔を確保
        gap: 12,
        position: 'absolute',
        bottom: 80, // TabBarの上に配置
        left: 16,
        right: 16,
    },
    searchContainer: {
        flex: 1,
        backgroundColor: '#fefefe', // 背景を白に変更
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    searchInput: {
        fontSize: 16,
        color: '#000',
    },
    addButton: {
        backgroundColor: '#fff',
        borderRadius: 24, // 円形にするため半径を48/2=24に
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    tabBarContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
    },
    // 不要になった古いスタイル（削除）
    roomList: {
        paddingTop: 24,
        paddingBottom: 24,
    },
    roomButton: {
        backgroundColor: '#ACEEBB',
        borderRadius: 12,
        paddingVertical: 32,
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
})

export default GroupScreen
