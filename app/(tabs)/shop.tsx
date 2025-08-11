import React, { useEffect, useState } from 'react'

import { FontAwesome5 } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
    Alert,
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

// APIから取得するアイテムの型定義
interface ShopItem {
    item_id: string
    item_name: string
    item_point: number
    item_image_url: string
    item_create_day: string
    item_details: string
    item_category: string
    pet_type: 'cat' | 'dog' | 'fish' | 'other'
    owned: boolean
}

// APIレスポンスの型定義
interface ShopResponse {
    success: boolean
    message: string
    data: ShopItem[]
}

// 環境変数からAPIベースURLを取得
const API_BASE_URL = process.env.EXPO_PUBLIC_API_TEST_URL
console.log('API_BASE_URL:', API_BASE_URL)
// 画像マッピング用の関数
const getImageSource = (imageFileName: string) => {
    const imageMap: { [key: string]: any } = {
        'black_cat.png': require('@/assets/images/black_cat.png'),
        'vitiligo_cat.png': require('@/assets/images/vitiligo_cat.png'),
        'mike_cat.png': require('@/assets/images/mike_cat.png'),
        'tora_cat.png': require('@/assets/images/tora_cat.png'),
        'ameshort_cat.png': require('@/assets/images/ameshort_cat.png'),
        'shiba_dog.png': require('@/assets/images/shiba_dog.png'),
        'chihuahua.png': require('@/assets/images/chihuahua.png'),
        'pome.png': require('@/assets/images/pome.png'),
        'toipo.png': require('@/assets/images/toipo.png'),
        'bulldog.png': require('@/assets/images/bulldog.png'),
        'gingin_penguin.png': require('@/assets/images/gingin_penguin.png'),
        'takopee.png': require('@/assets/images/takopee.png'),
        'penguin.png': require('@/assets/images/penguin.png'),
        'slime.png': require('@/assets/images/slime.png'),
        'zebra.png': require('@/assets/images/zebra.png'),
        'rabbit.png': require('@/assets/images/rabbit.png'),
        'chinpan.png': require('@/assets/images/chinpan.png'),
        'panda.png': require('@/assets/images/panda.png'),
    }
    return imageMap[imageFileName] || require('@/assets/images/black_cat.png')
}

const ShopScreen = () => {
    const [selectedPetIndex, setSelectedPetIndex] = useState(0)
    const [showExchangeModal, setShowExchangeModal] = useState(false)
    const [userPoints, setUserPoints] = useState(0) // 保有ポイント
    const [animalType, setAnimalType] = useState<'cat' | 'dog' | 'fish' | 'other'>('cat')
    const [allItems, setAllItems] = useState<ShopItem[]>([]) // 全アイテム
    const [filteredItems, setFilteredItems] = useState<ShopItem[]>([]) // フィルタされたアイテム
    const [loading, setLoading] = useState(true)

    const selectedPet = filteredItems[selectedPetIndex]
    const canExchange = selectedPet && userPoints >= selectedPet.item_point && !selectedPet.owned

    // デバッグ用：AsyncStorageからトークンを確認する関数
    const checkStoredToken = async () => {
        try {
            // configで使用されているキー 'session_token' を使用
            const token = await AsyncStorage.getItem('session_token')
            console.log('=== AsyncStorage トークン確認（session_token） ===')
            console.log('トークン存在:', token ? 'あり' : 'なし')
            console.log('トークン長さ:', token ? token.length : 0)
            console.log('トークン内容:', token)
            console.log('Postmanトークン:', 'PPYJWDBGR6A_qVV_e5o21YNDNAU')
            console.log('トークン一致:', token === 'PPYJWDBGR6A_qVV_e5o21YNDNAU' ? 'YES' : 'NO')
            console.log('================================')
            return token
        } catch (error) {
            console.error('トークン確認エラー:', error)
            return null
        }
    }

    // APIからショップデータを取得
    const fetchShopData = async () => {
        try {
            setLoading(true)
            const token = await AsyncStorage.getItem('session_token')
            console.log('=== GET /api/shop/items リクエスト詳細 ===')
            console.log('URL:', `${API_BASE_URL}/api/shop/items`)
            console.log('Method: GET')
            console.log('トークン:', token ? `存在 (長さ: ${token.length})` : '不存在')
            console.log('トークン内容:', token)

            const headers = {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
            console.log('送信ヘッダー:', headers)

            const response = await fetch(`${API_BASE_URL}/api/shop/items`, {
                method: 'GET',
                headers,
            })

            console.log('GET レスポンス詳細:', {
                status: response.status,
                statusText: response.statusText,
                url: response.url,
                headers: Object.fromEntries(response.headers.entries()),
            })

            if (!response.ok) {
                const responseText = await response.text()
                console.error('GET HTTPエラー詳細:', {
                    status: response.status,
                    statusText: response.statusText,
                    url: response.url,
                    responseText: responseText,
                })
                throw new Error(`HTTPエラー: ${response.status} - ${response.statusText}`)
            }

            const data: ShopResponse = await response.json()
            console.log('GET レスポンスデータ:', data)
            console.log('=== GET リクエスト成功 ===')

            if (data.success) {
                setAllItems(data.data)
                filterItemsByType('cat', data.data)
            } else {
                console.error('APIエラー:', data.message)
                Alert.alert('エラー', data.message || 'ショップデータの取得に失敗しました')
            }
        } catch (error) {
            console.error('ショップデータ取得エラー:', error)
            Alert.alert('エラー', 'ショップデータの取得に失敗しました')
        } finally {
            setLoading(false)
        }
    }

    // ユーザーポイントを取得
    const fetchUserPoints = async () => {
        try {
            const token = await AsyncStorage.getItem('session_token')
            console.log('ポイント取得開始:', `${API_BASE_URL}/api/shop/point`)

            // ユーザーポイント取得のAPIエンドポイント
            const response = await fetch(`${API_BASE_URL}/api/shop/point`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            })

            console.log('ポイント取得レスポンス:', response.status)

            if (response.ok) {
                const data = await response.json()
                console.log('ポイントデータ:', data)
                if (data.success && data.data) {
                    setUserPoints(data.data.point || 500) // data.data.point を参照
                }
            } else {
                console.warn('ポイント取得失敗:', response.status, response.statusText)
                setUserPoints(500) // デフォルト値
            }
        } catch (error) {
            console.error('ポイント取得エラー:', error)
            setUserPoints(500) // エラー時のデフォルト値
        }
    }

    // アイテムをタイプでフィルタする関数
    const filterItemsByType = (type: 'cat' | 'dog' | 'fish' | 'other', items?: ShopItem[]) => {
        const itemsToFilter = items || allItems
        const filtered = itemsToFilter.filter((item) => item.pet_type === type)
        setFilteredItems(filtered)
        setSelectedPetIndex(0)
    }

    // 初期データ読み込み
    useEffect(() => {
        const initializeShop = async () => {
            await checkStoredToken() // デバッグ用トークン確認
            fetchShopData()
            fetchUserPoints()
        }
        initializeShop()
    }, [])

    // アニマルタイプが変更された時のフィルタリング
    useEffect(() => {
        if (allItems.length > 0) {
            filterItemsByType(animalType)
        }
    }, [animalType, allItems])

    // 動物タイプ切り替え関数
    const switchAnimalType = (type: 'cat' | 'dog' | 'fish' | 'other') => {
        setAnimalType(type)
    }

    const handleExchange = () => {
        if (canExchange) {
            setShowExchangeModal(true)
        }
    }

    const confirmExchange = async () => {
        if (canExchange) {
            try {
                // まず再度トークンを確認
                const token = await checkStoredToken()
                console.log('購入開始 - アイテムID:', selectedPet.item_id)

                if (!token) {
                    Alert.alert('エラー', 'ログインが必要です')
                    return
                }

                const requestBody = {
                    item_id: selectedPet.item_id,
                }
                console.log('送信データ:', requestBody)

                const headers = {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
                console.log('送信ヘッダー:', headers)

                console.log('=== API呼び出し比較 ===')
                console.log('GET /api/shop/items - 成功済み')
                console.log('POST /api/shop/purchases - これから実行')
                console.log('同じトークン使用:', token)
                console.log('========================')

                // アイテム購入のAPIエンドポイント
                const response = await fetch(`${API_BASE_URL}/api/shop/purchases`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(requestBody),
                })

                console.log('購入レスポンス詳細:', {
                    status: response.status,
                    statusText: response.statusText,
                    url: response.url,
                    headers: Object.fromEntries(response.headers.entries()),
                })

                // レスポンステキストを取得してログ出力
                const responseText = await response.text()
                console.log('購入レスポンステキスト:', responseText)

                if (!response.ok) {
                    console.error('購入API HTTPエラー:', {
                        status: response.status,
                        statusText: response.statusText,
                        responseText: responseText,
                    })

                    // 401エラーの場合はログイン画面へ誘導
                    if (response.status === 401) {
                        console.error('=== 401エラー詳細分析 ===')
                        console.error('GETは成功、POSTで401発生')
                        console.error('同じトークン使用しているのに認証失敗')
                        console.error('========================')
                        Alert.alert('認証エラー', 'ログインが必要です。再度ログインしてください。')
                        return
                    }

                    throw new Error(`購入失敗: ${response.status} - ${response.statusText}`)
                }

                let data
                try {
                    data = JSON.parse(responseText)
                } catch (parseError) {
                    console.error('JSONパースエラー:', parseError)
                    throw new Error('レスポンスの解析に失敗しました')
                }

                console.log('購入レスポンスデータ:', data)

                if (data.success) {
                    // ポイントを引く処理
                    setUserPoints((prevPoints) => prevPoints - selectedPet.item_point)
                    setShowExchangeModal(false)
                    Alert.alert('購入完了', `${selectedPet.item_name}を購入しました！`)

                    // データを再取得して最新の状態に更新
                    await fetchShopData()
                } else {
                    console.error('購入APIエラー:', data.message)
                    Alert.alert('エラー', data.message || '購入に失敗しました')
                }
            } catch (error) {
                console.error('購入エラー詳細:', error)
                const errorMessage = error instanceof Error ? error.message : '不明なエラー'
                Alert.alert('エラー', `購入に失敗しました: ${errorMessage}`)
            }
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
                {loading ?
                    <View style={styles.loadingContainer}>
                        <Text style={styles.loadingText}>読み込み中...</Text>
                    </View>
                : !selectedPet ?
                    <View style={styles.noItemsContainer}>
                        <Text style={styles.noItemsText}>アイテムがありません</Text>
                    </View>
                :   <>
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
                            <Text style={styles.selectedPetName}>{selectedPet.item_name}</Text>
                            <Image
                                source={getImageSource(selectedPet.item_image_url)}
                                style={styles.selectedPetImage}
                            />
                            <View style={styles.selectedPetBottom}>
                                <View style={styles.selectedPetLeftInfo}>
                                    <Text
                                        style={styles.selectedPetDescription}
                                        numberOfLines={1}
                                    >
                                        {selectedPet.item_details}
                                    </Text>
                                    <Text style={styles.selectedPetPrice}>{selectedPet.item_point}pt</Text>
                                </View>
                                <TouchableOpacity
                                    style={[
                                        styles.exchangeButton,
                                        (!canExchange || selectedPet.owned) && styles.exchangeButtonDisabled,
                                    ]}
                                    onPress={handleExchange}
                                    disabled={!canExchange || selectedPet.owned}
                                >
                                    <Text
                                        style={[
                                            styles.exchangeButtonText,
                                            (!canExchange || selectedPet.owned) && styles.exchangeButtonTextDisabled,
                                        ]}
                                    >
                                        {selectedPet.owned ?
                                            '所有済み'
                                        : canExchange ?
                                            '交換する'
                                        :   'ポイント不足'}
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
                                            {filteredItems
                                                .slice(0, Math.ceil(filteredItems.length / 2))
                                                .map((item, index) => (
                                                    <TouchableOpacity
                                                        key={item.item_id}
                                                        style={styles.sliderItem}
                                                        onPress={() => setSelectedPetIndex(index)}
                                                    >
                                                        <Image
                                                            source={getImageSource(item.item_image_url)}
                                                            style={styles.sliderPetImage}
                                                        />
                                                        <Text style={styles.sliderPetName}>{item.item_name}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                        </View>

                                        {/* 2段目 */}
                                        <View style={styles.sliderRow}>
                                            {filteredItems
                                                .slice(Math.ceil(filteredItems.length / 2))
                                                .map((item, index) => (
                                                    <TouchableOpacity
                                                        key={item.item_id}
                                                        style={styles.sliderItem}
                                                        onPress={() =>
                                                            setSelectedPetIndex(
                                                                Math.ceil(filteredItems.length / 2) + index
                                                            )
                                                        }
                                                    >
                                                        <Image
                                                            source={getImageSource(item.item_image_url)}
                                                            style={styles.sliderPetImage}
                                                        />
                                                        <Text style={styles.sliderPetName}>{item.item_name}</Text>
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
                    </>
                }

                {/* 交換確認ポップアップ */}
                {selectedPet && (
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
                                        source={getImageSource(selectedPet.item_image_url)}
                                        style={styles.modalPetImage}
                                    />
                                    <Text style={styles.modalPetName}>{selectedPet.item_name}</Text>
                                    <Text style={styles.modalPetDescription}>{selectedPet.item_details}</Text>
                                </View>

                                <View style={styles.modalPriceInfo}>
                                    <Text style={styles.modalPriceText}>
                                        必要ポイント:{' '}
                                        <Text style={styles.modalPriceValue}>{selectedPet.item_point}pt</Text>
                                    </Text>
                                    <Text style={styles.modalBalanceText}>
                                        保有ポイント: <Text style={styles.modalBalanceValue}>{userPoints}pt</Text>
                                    </Text>
                                </View>

                                {(!canExchange || selectedPet.owned) && (
                                    <Text style={styles.modalWarningText}>
                                        {selectedPet.owned ?
                                            'すでに所有しているアイテムです'
                                        :   'ポイントが不足しているため交換できません'}
                                    </Text>
                                )}

                                <View style={styles.modalButtons}>
                                    <TouchableOpacity
                                        style={styles.cancelButton}
                                        onPress={cancelExchange}
                                    >
                                        <Text style={styles.cancelButtonText}>キャンセル</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.confirmButton,
                                            (!canExchange || selectedPet.owned) && styles.confirmButtonDisabled,
                                        ]}
                                        onPress={confirmExchange}
                                        disabled={!canExchange || selectedPet.owned}
                                    >
                                        <Text
                                            style={[
                                                styles.confirmButtonText,
                                                (!canExchange || selectedPet.owned) && styles.confirmButtonTextDisabled,
                                            ]}
                                        >
                                            {selectedPet.owned ?
                                                '所有済み'
                                            : !canExchange ?
                                                'ポイント不足'
                                            :   '交換する'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>
                )}
            </View>
        </ImageBackground>
    )
}

export default ShopScreen
