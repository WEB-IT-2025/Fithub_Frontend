import React, { useState, useRef } from 'react'
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, Animated, Image, Dimensions } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import TabBar from '../components/TabBar'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faBars, faXmark, faRightFromBracket, faRepeat, faAddressBook } from '@fortawesome/free-solid-svg-icons'

// ステータスごとのサイズ
const statusToSize: Record<number, number> = {
    1: 48,
    2: 64,
    3: 80,
}

// 仮のAPIレスポンス例
const groupUsers = [
    {
        user_id: 'u1',
        name: 'ユーザーA',
        pet: {
            pet_id: 'p1',
            pet_size: 3,
            pet_state: 2,
            pet_pictures: '',
        },
    },
    {
        user_id: 'u2',
        name: 'ユーザーB',
        pet: {
            pet_id: 'p2',
            pet_size: 3,
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
            pet_size: 3,
            pet_state: 2,
            pet_pictures: '',
        },
    },
]

// 画面サイズ取得
const { height: screenHeight, width: screenWidth } = Dimensions.get('window')

// ペット出現範囲を計算
const TABBAR_HEIGHT = 80 // TabBarの高さを正確に設定（必要に応じて調整）
const PET_AREA_TOP = screenHeight / 6  //なんかこのくらいがちょうどいい
const PET_AREA_BOTTOM = screenHeight / 1.5 - TABBAR_HEIGHT // TabBarの上端まで
const PET_AREA_LEFT = 20
const PET_AREA_RIGHT = screenWidth - 80 // 右端から少し余白

// ランダム位置生成（被りを避ける）
const getNonOverlappingPositions = (
    count: number,
    sizeGetter: (idx: number) => number,
    maxTry = 100
) => {
    const positions: { top: number; left: number }[] = [];
    for (let i = 0; i < count; i++) {
        let tryCount = 0;
        let pos;
        let overlap;
        do {
            const width = sizeGetter(i);
            const height = sizeGetter(i);
            const top = Math.random() * (PET_AREA_BOTTOM - PET_AREA_TOP - height) + PET_AREA_TOP;
            const left = Math.random() * (PET_AREA_RIGHT - PET_AREA_LEFT - width) + PET_AREA_LEFT;
            pos = { top, left };
            overlap = positions.some((p, j) => {
                const w2 = sizeGetter(j);
                const h2 = sizeGetter(j);
                return (
                    Math.abs(p.left - left) < (width + w2) / 2 &&
                    Math.abs(p.top - top) < (height + h2) / 2
                );
            });
            tryCount++;
        } while (overlap && tryCount < maxTry);
        positions.push(pos);
    }
    return positions;
};

const menuItems = [
    {
        label: 'ユーザーリスト',
        icon: faAddressBook,
        onPress: () => {
            // TODO: implement address book action
        },
    },
    {
        label: 'グループ変更',
        icon: faRepeat,
        onPress: () => {
            // TODO: implement reload action
        },
    },
    {
        label: 'グループ退出',
        icon: faRightFromBracket,
        onPress: () => {
            // TODO: implement leave room action
        },
    },
]

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

    // --- RoomScreen内で部屋名を取得 ---
    const room = rooms.find(r => String(r.id) === String(roomId))
    const roomName = room ? room.name : 'ルーム'

    const [menuOpen, setMenuOpen] = useState(false)
    const anim = useRef(new Animated.Value(0)).current

    // ペットのランダム位置を初期化
    const [petPositions] = useState(() =>
        getNonOverlappingPositions(
            groupUsers.length,
            idx => statusToSize[groupUsers[idx].pet.pet_size] || 64
        )
    )

    const toggleMenu = () => {
        setMenuOpen(prev => {
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
            resizeMode="cover"
        >
            <View style={styles.container}>
                {/* 部屋名 */}
                <View style={styles.roomTitleBoard}>
                    <Text style={styles.title}>{roomName}</Text>
                </View>

                {/* ペット画像をランダム配置 */}
                <View style={styles.petArea}>
                    {groupUsers.map((user, idx) => (
                        <Image
                            key={user.pet.pet_id}
                            source={require('@/assets/images/cat_test.png')}
                            style={[
                                styles.petImage,
                                {
                                    width: statusToSize[user.pet.pet_size] || 64, // 万一undefinedなら64
                                    height: statusToSize[user.pet.pet_size] || 64,
                                    position: 'absolute',
                                    top: petPositions[idx].top,
                                    left: petPositions[idx].left,
                                }
                            ]}
                            resizeMode="contain"
                        />
                    ))}
                </View>

                {/* フローティングメニュー */}
                <View pointerEvents="box-none" style={styles.menuArea}>
                    {[...menuItems].reverse().map((item, idx) => {
                        const translateY = anim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, -64 * (idx + 1)],
                        })
                        const opacity = anim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 1],
                        })
                        return (
                            <Animated.View
                                key={item.label}
                                style={[
                                    styles.floatingButton,
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
                                    <FontAwesomeIcon icon={item.icon} size={32} color="#fff" />
                                </TouchableOpacity>
                            </Animated.View>
                        )
                    })}
                    {/* ハンバーガー/クローズボタン */}
                    <TouchableOpacity style={styles.menuButton} onPress={toggleMenu}>
                        {menuOpen ? (
                            <FontAwesomeIcon icon={faXmark} size={32} color="#000" />
                        ) : (
                            <FontAwesomeIcon icon={faBars} size={32} color="#000" />
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.tabBarContainer}>
                    <TabBar />
                </View>
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
    roomTitleBoard: {
        alignSelf: 'center',
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderRadius: 8,
        paddingVertical: 18,
        width: 320,
        maxWidth: '90%',
        marginTop: 48,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
        textAlign: 'center',
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
        right: 24,
        bottom: 150,
        alignItems: 'center',
        zIndex: 10,
    },
    menuButton: {
        backgroundColor: 'rgba(255,255,255,0.85)',
        borderRadius: 32,
        width: 56,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    floatingButton: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        width: 56,
        alignItems: 'center',
    },
    floatingButtonInner: {
        width: 56,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        elevation: 3,
    },
    floatingButtonText: {
        color: '#136229',
        fontWeight: 'bold',
        fontSize: 16,
        textAlign: 'center',
    },
    tabBarContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
    },
})

export default RoomScreen