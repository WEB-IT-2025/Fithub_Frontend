import React, { useState } from 'react'
import { View, StyleSheet, ImageBackground, Image, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native'
import TabBar from '../components/TabBar'

const { width: screenWidth } = Dimensions.get('window')

// 仮のペットデータ
const pets = [
    { id: 1, name: 'ペットA', image: require('@/assets/images/cat_test.png'), price: 500 },
    { id: 2, name: 'ペットB', image: require('@/assets/images/cat_test.png'), price: 800 },
    { id: 3, name: 'ペットC', image: require('@/assets/images/cat_test.png'), price: 1200 },
]

const ShopScreen = () => {
    const [selectedPetIndex, setSelectedPetIndex] = useState(0)
    const selectedPet = pets[selectedPetIndex]

    return (
        <ImageBackground
            source={require('@/assets/images/shop_bg.png')}
            style={styles.background}
            resizeMode="cover"
        >
            <View style={styles.container}>
                {/* 上部にショップパネル */}
                <Image
                    source={require('@/assets/images/shop_panel.png')}
                    style={styles.shopPanel}
                    resizeMode="contain"
                />
                
                {/* 保有ポイント */}
                <View style={styles.pointsContainer}>
                    <Text style={styles.pointsText}>
                        保有ポイント　
                        <Text style={styles.pointsBold}>1000pt</Text>
                    </Text>
                </View>

                {/* 選択中のペット情報 */}
                <View style={styles.selectedPetContainer}>
                    <Text style={styles.selectedPetName}>{selectedPet.name}</Text>
                    <Image source={selectedPet.image} style={styles.selectedPetImage} />
                    <View style={styles.selectedPetBottom}>
                        <View style={styles.selectedPetLeftInfo}>
                            <Text style={styles.selectedPetDescription}>かわいいペットです</Text>
                            <Text style={styles.selectedPetPrice}>{selectedPet.price}pt</Text>
                        </View>
                        <TouchableOpacity style={styles.exchangeButton}>
                            <Text style={styles.exchangeButtonText}>交換する</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ペットメニュー */}
                <View style={styles.petMenuContainer}>
                    {/* 左側：縦並びボタン（比率1） */}
                    <View style={styles.menuButtons}>
                        <TouchableOpacity style={styles.menuButton}>
                            <Text style={styles.menuButtonText}>購入</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.menuButton}>
                            <Text style={styles.menuButtonText}>詳細</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.menuButton}>
                            <Text style={styles.menuButtonText}>試着</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.menuButton}>
                            <Text style={styles.menuButtonText}>お気に入り</Text>
                        </TouchableOpacity>
                    </View>
                    
                    {/* 右側：カルーセルスライダー（比率6） */}
                    <View style={styles.carouselContainer}>
                        <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false}
                            pagingEnabled
                            onMomentumScrollEnd={(event) => {
                                const index = Math.floor(event.nativeEvent.contentOffset.x / (screenWidth * 0.6 * 0.8))
                                setSelectedPetIndex(index)
                            }}
                        >
                            {pets.map((pet, index) => (
                                <View key={pet.id} style={styles.carouselItem}>
                                    <Image source={pet.image} style={styles.carouselPetImage} />
                                    <Text style={styles.carouselPetName}>{pet.name}</Text>
                                    <Text style={styles.carouselPetPrice}>{pet.price}pt</Text>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                </View>
                
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
    shopPanel: {
        width: '100%',
        height: 50,
        alignSelf: 'center',
        marginTop: 35,
        marginBottom: 16,
    },
    // 保有ポイント
    pointsContainer: {
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: 6,
        paddingVertical: 12,
        paddingHorizontal: 18,
        marginTop: 16,
        marginBottom: 16,
        alignSelf: 'flex-end', // 右寄せ
    },
    pointsText: {
        fontSize: 14,
        color: '#333',
    },
    pointsBold: {
        fontSize: 14,
        color: '#333',
        fontWeight: 'bold', // ← ポイント数だけボールド
    },
    // 選択中のペット情報
    selectedPetContainer: {
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        alignItems: 'center', // 中央寄せに変更
        flex: 1,
    },
    selectedPetImage: {
        width: 100,
        height: 100,
        marginBottom: 12,
    },
    selectedPetInfo: {
        flex: 1,
    },
    selectedPetName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
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
        marginBottom: 4,
    },
    exchangeButton: {
        backgroundColor: '#FF6B6B',
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 8,
    },
    exchangeButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    // ペットメニュー
    petMenuContainer: {
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: 12,
        padding: 16,
        flex: 1, // ← そのまま
        flexDirection: 'row',
        marginBottom: 100, // ← TabBarの少し上に余白を追加
    },
    // 左側ボタン（比率1）
    menuButtons: {
        flex: 1,
        marginRight: 12,
    },
    menuButton: {
        backgroundColor: '#4CAF50',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        alignItems: 'center',
    },
    menuButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    // 右側カルーセル（比率6）
    carouselContainer: {
        flex: 6,
    },
    carouselItem: {
        width: screenWidth * 0.6 * 0.8, // 画面幅の約48%
        alignItems: 'center',
        padding: 8,
    },
    carouselPetImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: 8,
    },
    carouselPetName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    carouselPetPrice: {
        fontSize: 14,
        color: '#666',
    },
    tabBarContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
    },
})

export default ShopScreen