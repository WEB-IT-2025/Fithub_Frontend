import React, { useRef, useState } from 'react'

import {
    faAddressBook,
    faBars,
    faCircleInfo,
    faRepeat,
    faRightFromBracket,
    faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
    Alert,
    Animated,
    Dimensions,
    FlatList,
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
import OtherProfile from '../other-profile'

// ステータスごとのサイズ
const statusToSize: Record<number, number> = {
    1: 48,
    2: 64,
    3: 80,
    4: 96,
    5: 112,
}

// 仮のAPIレスポンス例
const groupUsers = [
    {
        user_id: 'u1',
        name: 'ユーザーA',
        pet: {
            pet_id: 'p1',
            pet_size: 5,
            pet_state: 2,
            pet_pictures: '',
        },
    },
    {
        user_id: 'u2',
        name: 'ユーザーB',
        pet: {
            pet_id: 'p2',
            pet_size: 4,
            pet_state: 1,
            pet_pictures: '',
        },
    },
    {
        user_id: 'u3',
        name: 'ユーザーC',
        pet: {
            pet_id: 'p3',
            pet_size: 3,
            pet_state: 3,
            pet_pictures: '',
        },
    },
    {
        user_id: 'u4',
        name: 'ユーザーD',
        pet: {
            pet_id: 'p4',
            pet_size: 2,
            pet_state: 2,
            pet_pictures: '',
        },
    },
    {
        user_id: 'u5',
        name: 'ユーザーE',
        pet: {
            pet_id: 'p5',
            pet_size: 1,
            pet_state: 1,
            pet_pictures: '',
        },
    },
    {
        user_id: 'u6',
        name: 'ユーザーF',
        pet: {
            pet_id: 'p6',
            pet_size: 4,
            pet_state: 2,
            pet_pictures: '',
        },
    },
]

// 画面サイズ取得
const { height: screenHeight, width: screenWidth } = Dimensions.get('window')

// ペット出現範囲を計算
const TABBAR_HEIGHT = 80 // TabBarの高さを正確に設定（必要に応じて調整）
const PET_AREA_TOP = screenHeight / 4 // 上端をもう少し下に移動
const PET_AREA_BOTTOM = screenHeight / 1.25 - TABBAR_HEIGHT // TabBarの上端まで
const PET_AREA_LEFT = 20
const PET_AREA_RIGHT = screenWidth - 80 // 右端から少し余白

// ランダム位置生成（被りを避ける）
const getNonOverlappingPositions = (count: number, sizeGetter: (idx: number) => number, maxTry = 100) => {
    const positions: { top: number; left: number }[] = []
    for (let i = 0; i < count; i++) {
        let tryCount = 0
        let pos
        let overlap
        do {
            const width = sizeGetter(i)
            const height = sizeGetter(i)
            const top = Math.random() * (PET_AREA_BOTTOM - PET_AREA_TOP - height) + PET_AREA_TOP
            const left = Math.random() * (PET_AREA_RIGHT - PET_AREA_LEFT - width) + PET_AREA_LEFT
            pos = { top, left }
            overlap = positions.some((p, j) => {
                const w2 = sizeGetter(j)
                const h2 = sizeGetter(j)
                return Math.abs(p.left - left) < (width + w2) / 2 && Math.abs(p.top - top) < (height + h2) / 2
            })
            tryCount++
        } while (overlap && tryCount < maxTry)
        positions.push(pos)
    }
    return positions
}

// --- 既存のroomNamesマッピングを削除し、group.tsxのrooms配列と同じ内容で定義 ---
const rooms = [
    { id: 1, name: 'ダイエット部' },
    { id: 2, name: '筋トレ部' },
    { id: 3, name: '同期' },
    { id: 4, name: '開発チーム' },
    { id: 5, name: 'ECC' },
    { id: 6, name: '女子会' },
]

const RoomScreen = () => {
    const { roomId } = useLocalSearchParams<{ roomId: string }>()
    const router = useRouter()

    // --- RoomScreen内で部屋名を取得 ---
    const room = rooms.find((r) => String(r.id) === String(roomId))
    const roomName = room ? room.name : 'ルーム'

    const [menuOpen, setMenuOpen] = useState(false)
    const [membersModalVisible, setMembersModalVisible] = useState(false)
    const [userDetailModalVisible, setUserDetailModalVisible] = useState(false)
    const [selectedUser, setSelectedUser] = useState<any>(null)
    const [profileKey, setProfileKey] = useState(0) // プロフィール強制再レンダリング用のキー
    const anim = useRef(new Animated.Value(0)).current

    // メンバー一覧を表示
    const handleShowMembers = () => {
        setMembersModalVisible(true)
    }

    // ユーザー詳細を表示
    const handleShowUserDetail = (user: any) => {
        setSelectedUser(user)
        setMembersModalVisible(false)
        setProfileKey((prev) => prev + 1) // キーを更新して強制再レンダリング
        setTimeout(() => {
            setUserDetailModalVisible(true) // プロフィールモーダルを0.2秒後に開く
        }, 200)
    }

    // 退会確認ダイアログ
    const handleLeaveGroup = () => {
        Alert.alert(
            '退会確認',
            '本当にグループを退会しますか？',
            [
                {
                    text: 'いいえ',
                    style: 'cancel',
                },
                {
                    text: 'はい',
                    style: 'destructive',
                    onPress: () => {
                        // group.tsxに遷移
                        router.push('/(tabs)/group')
                    },
                },
            ],
            { cancelable: true }
        )
    }

    const menuItems = [
        {
            label: '詳細',
            icon: faCircleInfo,
            onPress: () => {
                // TODO: implement address book action
            },
        },
        {
            label: 'メンバー',
            icon: faAddressBook,
            onPress: handleShowMembers,
        },
        {
            label: '退会',
            icon: faRightFromBracket,
            onPress: handleLeaveGroup,
        },
    ]

    // ペットのランダム位置を初期化
    const [petPositions] = useState(() =>
        getNonOverlappingPositions(groupUsers.length, (idx) => statusToSize[groupUsers[idx].pet.pet_size] || 64)
    )

    const toggleMenu = () => {
        setMenuOpen((prev) => {
            if (!prev) {
                Animated.timing(anim, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                }).start()
            } else {
                Animated.timing(anim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }).start()
            }
            return !prev
        })
    }

    return (
        <ImageBackground
            source={require('@/assets/images/home_bg.png')}
            style={styles.background}
            resizeMode='cover'
        >
            <View style={styles.container}>
                {/* 部屋名 */}
                <View style={styles.roomTitleContainer}>
                    <TouchableOpacity onPress={() => router.push('/(tabs)/group')}>
                        <Image
                            source={require('@/assets/images/Vector.png')}
                            style={styles.backIcon}
                            resizeMode='contain'
                        />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.push('/(tabs)/group')}>
                        <Text style={styles.roomTitle}>{roomName}</Text>
                    </TouchableOpacity>
                </View>

                {/* ペット画像をランダム配置 */}
                <View style={styles.petArea}>
                    {groupUsers.map((user, idx) => (
                        <TouchableOpacity
                            key={user.pet.pet_id}
                            style={[
                                {
                                    position: 'absolute',
                                    top: petPositions[idx].top,
                                    left: petPositions[idx].left,
                                },
                            ]}
                            onPress={() => {
                                setSelectedUser(user)
                                setProfileKey((prev) => prev + 1) // キーを更新して強制再レンダリング
                                setTimeout(() => {
                                    setUserDetailModalVisible(true) // プロフィールモーダルを0.2秒後に開く
                                }, 500)
                            }}
                        >
                            <Image
                                source={require('@/assets/images/cat1.png')}
                                style={[
                                    styles.petImage,
                                    {
                                        width: statusToSize[user.pet.pet_size] || 64, // 万一undefinedなら64
                                        height: statusToSize[user.pet.pet_size] || 64,
                                    },
                                ]}
                                resizeMode='contain'
                            />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* フローティングメニュー */}
                <View
                    pointerEvents='box-none'
                    style={styles.menuArea}
                >
                    {[...menuItems].reverse().map((item, idx) => {
                        const translateY = anim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, -80 * (idx + 1)],
                        })
                        const opacity = anim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 1],
                        })
                        return (
                            <Animated.View
                                key={item.label}
                                style={[
                                    styles.floatingMenuItem,
                                    {
                                        transform: [{ translateY }],
                                        opacity,
                                    },
                                ]}
                                pointerEvents={menuOpen ? 'auto' : 'none'}
                            >
                                <TouchableOpacity
                                    style={styles.floatingButtonInner}
                                    onPress={item.onPress}
                                >
                                    <FontAwesomeIcon
                                        icon={item.icon}
                                        size={32}
                                        color='#fff'
                                    />
                                </TouchableOpacity>
                                <Text style={styles.floatingButtonLabel}>{item.label}</Text>
                            </Animated.View>
                        )
                    })}
                    {/* ハンバーガー/クローズボタン */}
                    <TouchableOpacity
                        style={styles.menuButton}
                        onPress={toggleMenu}
                    >
                        {menuOpen ?
                            <FontAwesomeIcon
                                icon={faXmark}
                                size={32}
                                color='#000'
                            />
                        :   <FontAwesomeIcon
                                icon={faBars}
                                size={32}
                                color='#000'
                            />
                        }
                    </TouchableOpacity>
                </View>

                <View style={styles.tabBarContainer}>
                    <TabBar />
                </View>

                {/* メンバー一覧モーダル */}
                <Modal
                    visible={membersModalVisible}
                    transparent={true}
                    animationType='fade'
                    onRequestClose={() => setMembersModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>メンバー一覧</Text>
                                <TouchableOpacity
                                    onPress={() => setMembersModalVisible(false)}
                                    style={styles.closeButton}
                                >
                                    <FontAwesomeIcon
                                        icon={faXmark}
                                        size={24}
                                        color='#333'
                                    />
                                </TouchableOpacity>
                            </View>

                            <FlatList
                                data={groupUsers}
                                keyExtractor={(item) => item.user_id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.memberItem}
                                        onPress={() => handleShowUserDetail(item)}
                                    >
                                        <Image
                                            source={require('@/assets/images/cat1.png')}
                                            style={styles.memberPetImage}
                                            resizeMode='contain'
                                        />
                                        <View style={styles.memberInfo}>
                                            <Text style={styles.memberName}>{item.name}</Text>
                                            <Text style={styles.memberDetails}>
                                                ペットサイズ: {item.pet.pet_size} | 健康度: {item.pet.pet_state}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                )}
                                style={styles.membersList}
                            />
                        </View>
                    </View>
                </Modal>

                {/* ユーザー詳細モーダル */}
                <Modal
                    visible={userDetailModalVisible}
                    animationType='slide'
                    onRequestClose={() => setUserDetailModalVisible(false)}
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
                    {selectedUser &&
                        (Platform.OS === 'ios' ?
                            <SafeAreaView style={styles.fullScreenModal}>
                                <OtherProfile
                                    key={profileKey}
                                    userName={selectedUser.name}
                                    userData={{
                                        today: {
                                            steps: 5000,
                                            contributions: 3,
                                            date: new Date().toISOString().split('T')[0],
                                        },
                                        recent_exercise: [],
                                        recent_contributions: [
                                            { day: 'Mon', count: '2' },
                                            { day: 'Tue', count: '0' },
                                            { day: 'Wed', count: '4' },
                                            { day: 'Thu', count: '3' },
                                            { day: 'Fri', count: '2' },
                                            { day: 'Sat', count: '4' },
                                            { day: 'Sun', count: '3' },
                                        ],
                                    }}
                                    onClose={() => setUserDetailModalVisible(false)}
                                />
                            </SafeAreaView>
                        :   <View
                                style={[
                                    styles.fullScreenModal,
                                    { marginTop: 0, paddingTop: StatusBar.currentHeight || 0 },
                                ]}
                            >
                                <OtherProfile
                                    key={profileKey}
                                    userName={selectedUser.name}
                                    userData={{
                                        today: {
                                            steps: 5000,
                                            contributions: 3,
                                            date: new Date().toISOString().split('T')[0],
                                        },
                                        recent_exercise: [],
                                        recent_contributions: [
                                            { day: 'Mon', count: '2' },
                                            { day: 'Tue', count: '0' },
                                            { day: 'Wed', count: '4' },
                                            { day: 'Thu', count: '3' },
                                            { day: 'Fri', count: '2' },
                                            { day: 'Sat', count: '4' },
                                            { day: 'Sun', count: '3' },
                                        ],
                                    }}
                                    onClose={() => setUserDetailModalVisible(false)}
                                />
                            </View>)}
                </Modal>
            </View>
        </ImageBackground>
    )
}

const styles = StyleSheet.create({
    background: { flex: 1 },
    container: {
        flex: 1,
        paddingTop: 48,
        paddingHorizontal: 16,
        paddingBottom: 64,
    },
    roomTitleContainer: {
        position: 'absolute',
        top: 60,
        left: 16,
        zIndex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backIcon: {
        width: 24,
        height: 24,
        marginTop: 24,
        marginRight: 8,
    },
    roomTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#000',
        marginTop: 24,
    },
    petArea: {
        flex: 1,
        position: 'relative',
        minHeight: 350,
        marginBottom: 24,
    },
    petImage: {
        // borderRadius: 32,
        // borderWidth: 2,
        // borderColor: '#fff',
    },
    menuArea: {
        position: 'absolute',
        right: 8,
        bottom: 150,
        alignItems: 'center',
        zIndex: 10,
    },
    menuButton: {
        backgroundColor: 'rgba(255,255,255,0.85)',
        borderRadius: 32,
        width: 56,
        height: 56,
        marginRight: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    floatingMenuItem: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        width: 80,
        height: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
    floatingButtonInner: {
        width: 56,
        height: 56,
        backgroundColor: 'transparent',
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    floatingButtonLabel: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
        textAlign: 'center',
    },
    tabBarContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
    },
    // モーダル関連のスタイル
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        width: '90%',
        maxHeight: '80%',
        paddingVertical: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    closeButton: {
        padding: 8,
    },
    membersList: {
        paddingHorizontal: 20,
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    memberPetImage: {
        width: 48,
        height: 48,
        marginRight: 12,
    },
    memberInfo: {
        flex: 1,
    },
    memberName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    memberDetails: {
        fontSize: 14,
        color: '#666',
    },
    fullScreenModal: {
        flex: 1,
        backgroundColor: '#fff',
        position: 'relative',
    },
})

export default RoomScreen
