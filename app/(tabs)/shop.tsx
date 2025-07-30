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
        description: '元気いっぱいな猫。',
    },
    {
        id: 4,
        name: 'キジトラ',
        image: require('@/assets/images/cat4.png'),
        price: 500,
        description: '静かで落ち着いた性格。',
    },
    {
        id: 5,
        name: 'アメショ',
        image: require('@/assets/images/cat5.png'),
        price: 800,
        description: '食いしん坊な猫。',
    },
]

// 犬のペットデータ
const dogPets = [
    {
        id: 1,
        name: 'シバイヌ',
        image: require('@/assets/images/dog1.png'),
        price: 600,
        description: '温厚で優しい性格。',
    },
    {
        id: 2,
        name: 'チワワ',
        image: require('@/assets/images/dog2.png'),
        price: 900,
        description: '気が強く、よく吠える。',
    },
    {
        id: 3,
        name: 'ポメラニアン',
        image: require('@/assets/images/dog3.png'),
        price: 700,
        description: '短い脚がチャーミング。',
    },
    {
        id: 4,
        name: 'プードル',
        image: require('@/assets/images/dog4.png'),
        price: 800,
        description: '元気いっぱいで活発。',
    },
    {
        id: 5,
        name: 'ブルドッグ',
        image: require('@/assets/images/dog5.png'),
        price: 1000,
        description: '癒し系。とっても優しい。',
    },
]

// 魚のペットデータ
const fishPets = [
    {
        id: 1,
        name: 'GINGIN',
        image: require('@/assets/images/fish1.png'),
        price: 300,
        description: 'いつもみなぎっている。',
    },
    {
        id: 2,
        name: 'ミズダコ',
        image: require('@/assets/images/fish2.png'),
        price: 400,
        description: 'ふわふわ泳ぐのが好き。',
    },
    {
        id: 3,
        name: 'ペンギン',
        image: require('@/assets/images/fish3.png'),
        price: 350,
        description: '寒いところが好き。',
    },
    {
        id: 4,
        name: 'スラリー',
        image: require('@/assets/images/fish4.png'),
        price: 450,
        description: '工業用排水から生まれた。',
    },
]

// その他のペットデータ
const anymorePets = [
    {
        id: 1,
        name: 'シマウマ',
        image: require('@/assets/images/anymore1.png'),
        price: 1500,
        description: '群れでいるのが好き。',
    },
    {
        id: 2,
        name: 'ウサギ',
        image: require('@/assets/images/anymore2.png'),
        price: 1800,
        description: '警戒心がつよい。',
    },
    {
        id: 3,
        name: 'チンパンジー',
        image: require('@/assets/images/anymore3.png'),
        price: 2000,
        description: 'とてもかしこい。',
    },
    {
        id: 4,
        name: 'パンダ',
        image: require('@/assets/images/anymore4.png'),
        price: 5500,
        description: 'みんなのアイドル。',
    },
]

const ShopScreen = () => {
    const [selectedPetIndex, setSelectedPetIndex] = useState(0)
    const [showExchangeModal, setShowExchangeModal] = useState(false)
    const [userPoints, setUserPoints] = useState(1000) // 保有ポイントをステートで管理
    const [animalType, setAnimalType] = useState<'cat' | 'dog' | 'fish' | 'other'>('cat') // 選択された動物タイプ
    const [pets, setPets] = useState(catPets) // 現在表示するペットデータ
    const selectedPet = pets[selectedPetIndex]
    const canExchange = userPoints >= selectedPet.price // 交換可能かどうか

    // 動物タイプ切り替え関数
    const switchAnimalType = (type: 'cat' | 'dog' | 'fish' | 'other') => {
        setAnimalType(type)
        if (type === 'cat') {
            setPets(catPets)
        } else if (type === 'dog') {
            setPets(dogPets)
        } else if (type === 'fish') {
            setPets(fishPets)
        } else if (type === 'other') {
            setPets(anymorePets)
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
                            onPress={() => switchAnimalType('cat')}
                        >
                            <FontAwesome5
                                name='cat'
                                size={20}
                                color={animalType === 'cat' ? '#FF6B6B' : 'black'}
                            />
                        </TouchableOpacity>
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
                            onPress={() => switchAnimalType('fish')}
                        >
                            <FontAwesome5
                                name='fish'
                                size={20}
                                color={animalType === 'fish' ? '#FF6B6B' : 'black'}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.menuButton}
                            onPress={() => switchAnimalType('other')}
                        >
                            <FontAwesome5
                                name='horse'
                                size={20}
                                color={animalType === 'other' ? '#FF6B6B' : 'black'}
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
