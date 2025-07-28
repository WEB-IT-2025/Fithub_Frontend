import React, { useState } from 'react'

import { FontAwesome5 } from '@expo/vector-icons'
import {
    Dimensions,
    Image,
    ImageBackground,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'

import TabBar from '../../components/TabBar'

const { width: screenWidth } = Dimensions.get('window')

// 猫のペットデータ
const catPets = [
    {
        id: 1,
        name: 'クロネコ',
        image: require('@/assets/images/cat1.png'),
        price: 500,
        description: '鼻がチャームの黒猫。基本懐かない。',
    },
    {
        id: 2,
        name: 'ブチネコ',
        image: require('@/assets/images/cat2.png'),
        price: 800,
        description: '丸い体型が特徴的。甘えん坊な性格。',
    },
    {
        id: 3,
        name: 'ミケネコ',
        image: require('@/assets/images/cat3.png'),
        price: 1200,
        description: '元気いっぱいな猫。遊ぶのが大好き。',
    },
    {
        id: 4,
        name: 'キジトラ',
        image: require('@/assets/images/cat4.png'),
        price: 500,
        description: '静かで落ち着いた性格。読書のお供。',
    },
    {
        id: 5,
        name: 'アメショ',
        image: require('@/assets/images/cat5.png'),
        price: 800,
        description: '食いしん坊な猫。おやつが大好き。',
    },
]

// 犬のペットデータ
const dogPets = [
    {
        id: 1,
        name: 'シバイヌ',
        image: require('@/assets/images/dog1.png'),
        price: 600,
        description: '温厚で優しい性格。家族想いの犬。',
    },
    {
        id: 2,
        name: 'チワワ',
        image: require('@/assets/images/dog2.png'),
        price: 900,
        description: '賢くて従順。しつけのしやすい犬。',
    },
    {
        id: 3,
        name: 'ポメラニアン',
        image: require('@/assets/images/dog3.png'),
        price: 700,
        description: '短い脚がチャーミング。好奇心旺盛。',
    },
    {
        id: 4,
        name: 'プードル',
        image: require('@/assets/images/dog4.png'),
        price: 800,
        description: '元気いっぱいで活発。散歩が大好き。',
    },
    {
        id: 5,
        name: 'ブルドッグ',
        image: require('@/assets/images/dog5.png'),
        price: 1000,
        description: '短い脚で一生懸命走る姿が愛らしい。',
    },
]

const ShopScreen = () => {
    const [selectedPetIndex, setSelectedPetIndex] = useState(0)
    const [showExchangeModal, setShowExchangeModal] = useState(false)
    const [userPoints, setUserPoints] = useState(1000) // 保有ポイントをステートで管理
    const [animalType, setAnimalType] = useState<'cat' | 'dog'>('cat') // 選択された動物タイプ
    const [pets, setPets] = useState(catPets) // 現在表示するペットデータ
    const selectedPet = pets[selectedPetIndex]
    const canExchange = userPoints >= selectedPet.price // 交換可能かどうか

    // 動物タイプ切り替え関数
    const switchAnimalType = (type: 'cat' | 'dog') => {
        setAnimalType(type)
        if (type === 'cat') {
            setPets(catPets)
        } else if (type === 'dog') {
            setPets(dogPets)
        }
        setSelectedPetIndex(0) // 選択インデックスをリセット
    }

    const handleExchange = () => {
        if (canExchange) {
            setShowExchangeModal(true)
        }
    }

    const confirmExchange = () => {
        if (canExchange) {
            // ポイントを引く処理
            setUserPoints((prevPoints) => prevPoints - selectedPet.price)
            setShowExchangeModal(false)
            // 交換成功のフィードバックなどを追加可能
            console.log(`${selectedPet.name}と交換しました！残りポイント: ${userPoints - selectedPet.price}pt`)
        }
    }

    const cancelExchange = () => {
        setShowExchangeModal(false)
    }

    return (
        <ImageBackground
            source={require('@/assets/images/shop_bg.png')}
            style={styles.background}
            resizeMode='cover'
        >
            <View style={styles.container}>
                {/* 上部にショップパネル */}
                <Image
                    source={require('@/assets/images/shop_panel.png')}
                    style={styles.shopPanel}
                    resizeMode='contain'
                />

                {/* 保有ポイント */}
                <View style={styles.pointsContainer}>
                    <Text style={styles.pointsText}>
                        保有ポイント　
                        <Text style={styles.pointsBold}>{userPoints}pt</Text>
                    </Text>
                </View>

                {/* 選択中のペット情報 */}
                <View style={styles.selectedPetContainer}>
                    <Text style={styles.selectedPetName}>{selectedPet.name}</Text>
                    <Image
                        source={selectedPet.image}
                        style={styles.selectedPetImage}
                    />
                    <View style={styles.selectedPetBottom}>
                        <View style={styles.selectedPetLeftInfo}>
                            <Text
                                style={styles.selectedPetDescription}
                                numberOfLines={1}
                            >
                                {selectedPet.description}
                            </Text>
                            <Text style={styles.selectedPetPrice}>{selectedPet.price}pt</Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.exchangeButton, !canExchange && styles.exchangeButtonDisabled]}
                            onPress={handleExchange}
                            disabled={!canExchange}
                        >
                            <Text
                                style={[styles.exchangeButtonText, !canExchange && styles.exchangeButtonTextDisabled]}
                            >
                                {canExchange ? '交換する' : 'ポイント不足'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ペットメニュー */}
                <View style={styles.petMenuContainer}>
                    {/* 左側：縦並びボタン（比率1） */}
                    <View style={styles.menuButtons}>
                        <TouchableOpacity 
                            style={styles.menuButton}
                            onPress={() => switchAnimalType('dog')}
                        >
                            <FontAwesome5
                                name='dog'
                                size={20}
                                color={animalType === 'dog' ? '#FF6B6B' : 'black'}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.menuButton}
                            onPress={() => switchAnimalType('cat')}
                        >
                            <FontAwesome5
                                name='cat'
                                size={20}
                                color={animalType === 'cat' ? '#FF6B6B' : 'black'}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.menuButton}>
                            <FontAwesome5
                                name='fish'
                                size={20}
                                color='black'
                            />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.menuButton}>
                            <FontAwesome5
                                name='horse'
                                size={20}
                                color='black'
                            />
                        </TouchableOpacity>
                    </View>

                    {/* 右側：スライダーメニュー（比率6） */}
                    <View style={styles.sliderContainer}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.sliderContent}
                        >
                            <View style={styles.sliderGrid}>
                                {/* 1段目 */}
                                <View style={styles.sliderRow}>
                                    {pets.slice(0, Math.ceil(pets.length / 2)).map((pet, index) => (
                                        <TouchableOpacity
                                            key={pet.id}
                                            style={styles.sliderItem}
                                            onPress={() => setSelectedPetIndex(index)}
                                        >
                                            <Image
                                                source={pet.image}
                                                style={styles.sliderPetImage}
                                            />
                                            <Text style={styles.sliderPetName}>{pet.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* 2段目 */}
                                <View style={styles.sliderRow}>
                                    {pets.slice(Math.ceil(pets.length / 2)).map((pet, index) => (
                                        <TouchableOpacity
                                            key={pet.id}
                                            style={styles.sliderItem}
                                            onPress={() => setSelectedPetIndex(Math.ceil(pets.length / 2) + index)}
                                        >
                                            <Image
                                                source={pet.image}
                                                style={styles.sliderPetImage}
                                            />
                                            <Text style={styles.sliderPetName}>{pet.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </ScrollView>
                    </View>
                </View>

                <View style={styles.tabBarContainer}>
                    <TabBar />
                </View>

                {/* 交換確認ポップアップ */}
                <Modal
                    animationType='fade'
                    transparent={true}
                    visible={showExchangeModal}
                    onRequestClose={cancelExchange}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>交換確認</Text>
                            <View style={styles.modalDivider} />

                            <View style={styles.modalPetInfo}>
                                <Image
                                    source={selectedPet.image}
                                    style={styles.modalPetImage}
                                />
                                <Text style={styles.modalPetName}>{selectedPet.name}</Text>
                                <Text style={styles.modalPetDescription}>{selectedPet.description}</Text>
                            </View>

                            <View style={styles.modalPriceInfo}>
                                <Text style={styles.modalPriceText}>
                                    必要ポイント: <Text style={styles.modalPriceValue}>{selectedPet.price}pt</Text>
                                </Text>
                                <Text style={styles.modalBalanceText}>
                                    保有ポイント: <Text style={styles.modalBalanceValue}>{userPoints}pt</Text>
                                </Text>
                            </View>

                            {!canExchange && (
                                <Text style={styles.modalWarningText}>ポイントが不足しているため交換できません</Text>
                            )}

                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={cancelExchange}
                                >
                                    <Text style={styles.cancelButtonText}>キャンセル</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.confirmButton, !canExchange && styles.confirmButtonDisabled]}
                                    onPress={confirmExchange}
                                    disabled={!canExchange}
                                >
                                    <Text
                                        style={[
                                            styles.confirmButtonText,
                                            !canExchange && styles.confirmButtonTextDisabled,
                                        ]}
                                    >
                                        {!canExchange ? 'ポイント不足' : '交換する'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
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
    shopPanel: {
        width: '100%',
        height: 50,
        alignSelf: 'center',
        marginTop: 35,
        marginBottom: 16,
    },
    // 保有ポイント
    pointsContainer: {
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 6,
        paddingVertical: 14,
        paddingHorizontal: 18,
        marginTop: 16,
        marginBottom: 16,
        alignSelf: 'flex-end', // 右寄せ
    },
    pointsText: {
        fontSize: 12,
        color: '#333',
    },
    pointsBold: {
        fontSize: 12,
        color: '#333',
        fontWeight: 'bold', // ← ポイント数だけボールド
    },
    // 選択中のペット情報
    selectedPetContainer: {
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 6,
        alignItems: 'center', // 中央寄せに変更
        flex: 1,
    },
    selectedPetImage: {
        width: 120,
        height: 120,
        marginBottom: 12,
    },
    selectedPetInfo: {
        flex: 1,
    },
    selectedPetName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 12,
        marginBottom: 12,
        textAlign: 'center', // 中央寄せ
    },
    selectedPetPrice: {
        fontSize: 16,
        color: '#333',
        fontWeight: 'bold',
    },
    selectedPetBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        width: '100%',
    },
    selectedPetLeftInfo: {
        flex: 1,
    },
    selectedPetDescription: {
        fontSize: 14,
        color: '#666',
        marginRight: 10,
        textAlign: 'left',
    },
    exchangeButton: {
        backgroundColor: '#FF6B6B',
        borderRadius: 4,
        paddingHorizontal: 20,
        paddingVertical: 8,
    },
    exchangeButtonDisabled: {
        backgroundColor: '#ccc',
        opacity: 0.6,
    },
    exchangeButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    exchangeButtonTextDisabled: {
        color: '#999',
    },
    // ペットメニュー
    petMenuContainer: {
        flex: 1, // ← そのまま
        flexDirection: 'row',
        marginTop: 16, // ← TabBarの少し上に余白を追加
        marginBottom: 70, // ← TabBarとの隙間を縮小（100→70）
    },
    // 左側ボタン（比率1）
    menuButtons: {
        flex: 1,
        marginRight: 12,
    },
    menuButton: {
        backgroundColor: 'white',
        borderRadius: 25,
        width: 50,
        height: 50,
        marginBottom: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    menuButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
        display: 'none', // テキストを非表示
    },
    // 右側スライダー（比率6）
    sliderContainer: {
        flex: 6,
    },
    sliderContent: {
        paddingHorizontal: 8,
    },
    sliderGrid: {
        flexDirection: 'column',
    },
    sliderRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    sliderItem: {
        alignItems: 'center',
        padding: 10,
        marginHorizontal: 4,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 12,
        minWidth: 120,
    },
    sliderPetImage: {
        width: 65,
        height: 65,
        marginBottom: 8,
    },
    sliderPetName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
        textAlign: 'center',
    },
    tabBarContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
    },
    // モーダルスタイル
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        margin: 20,
        maxWidth: 350,
        width: '90%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
        textAlign: 'center',
    },
    modalDivider: {
        width: '100%',
        height: 1,
        backgroundColor: '#e0e0e0',
        marginBottom: 20,
    },
    modalPetInfo: {
        alignItems: 'center',
        marginBottom: 20,
    },
    modalPetImage: {
        width: 80,
        height: 80,
        marginBottom: 12,
    },
    modalPetName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
    },
    modalPetDescription: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 8,
    },
    modalPriceInfo: {
        alignItems: 'center',
        marginBottom: 20,
        width: '100%',
    },
    modalPriceText: {
        fontSize: 16,
        color: '#333',
        marginBottom: 8,
    },
    modalPriceValue: {
        fontWeight: 'bold',
        color: '#FF6B6B',
    },
    modalBalanceText: {
        fontSize: 12,
        color: '#333',
        marginBottom: 18,
    },
    modalBalanceValue: {
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    modalWarningText: {
        fontSize: 14,
        color: '#FF6B6B',
        textAlign: 'center',
        marginBottom: 20,
        fontWeight: 'bold',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#ACEEBB',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#333',
        fontWeight: 'bold',
        fontSize: 16,
    },
    confirmButton: {
        flex: 1,
        backgroundColor: '#2BA44E',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    confirmButtonDisabled: {
        backgroundColor: '#ccc',
        opacity: 0.6,
    },
    confirmButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    confirmButtonTextDisabled: {
        color: '#999',
    },
})

export default ShopScreen
