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
import styles from '../style/shop.styles'

const { width: screenWidth } = Dimensions.get('window')

// 仮のペットデータ
const pets = [
    {
        id: 1,
        name: 'ペットA',
        image: require('@/assets/images/fithub_cat.png'),
        price: 500,
        description: '鼻がチャームの黒猫。基本懐かない。',
    },
    {
        id: 2,
        name: 'ペットB',
        image: require('@/assets/images/moukona.jpeg'),
        price: 800,
        description: '丸い体型が特徴的。甘えん坊な性格。',
    },
    {
        id: 3,
        name: 'ペットC',
        image: require('@/assets/images/fithub_cat.png'),
        price: 1200,
        description: '元気いっぱいな猫。遊ぶのが大好き。',
    },
    {
        id: 4,
        name: 'ペットD',
        image: require('@/assets/images/fithub_cat.png'),
        price: 500,
        description: '静かで落ち着いた性格。読書のお供。',
    },
    {
        id: 5,
        name: 'ペットE',
        image: require('@/assets/images/moukona.jpeg'),
        price: 800,
        description: '食いしん坊な猫。おやつが大好き。',
    },
    {
        id: 6,
        name: 'ペットF',
        image: require('@/assets/images/fithub_cat.png'),
        price: 1200,
        description: '賢くて学習能力が高い。トリック得意。',
    },
    {
        id: 7,
        name: 'ペットG',
        image: require('@/assets/images/fithub_cat.png'),
        price: 500,
        description: '人懐っこい性格。誰とでも仲良し。',
    },
    {
        id: 8,
        name: 'ペットH',
        image: require('@/assets/images/moukona.jpeg'),
        price: 800,
        description: '夜行性で活発。夜中に大運動会。',
    },
    {
        id: 9,
        name: 'ペットI',
        image: require('@/assets/images/fithub_cat.png'),
        price: 1200,
        description: '美しい毛色が自慢。グルーミング趣味。',
    },
]

const ShopScreen = () => {
    const [selectedPetIndex, setSelectedPetIndex] = useState(0)
    const [showExchangeModal, setShowExchangeModal] = useState(false)
    const [userPoints, setUserPoints] = useState(1000) // 保有ポイントをステートで管理
    const selectedPet = pets[selectedPetIndex]
    const canExchange = userPoints >= selectedPet.price // 交換可能かどうか

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
                        <TouchableOpacity style={styles.menuButton}>
                            <FontAwesome5
                                name='dog'
                                size={20}
                                color='black'
                            />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.menuButton}>
                            <FontAwesome5
                                name='cat'
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
                        <TouchableOpacity style={styles.menuButton}>
                            <FontAwesome5
                                name='fish'
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

export default ShopScreen
