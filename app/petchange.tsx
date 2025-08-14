/*
 * petchange.tsx - ペット変更画面
 * 
 * このページのみ試験的に結合を意識してコードを書いています。もし逆にやりにくくなってたらゴメンね☆
 *
 */

import React, { useEffect, useRef, useState } from 'react'

import { faPencil } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { 
    Alert,
    Animated,
    Image, 
    ImageBackground, 
    Modal,
    Platform, 
    ScrollView,
    Text, 
    TextInput,
    TouchableOpacity, 
    View 
} from 'react-native'
import { responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import styles from './style/petchange.styles'

const PET_NAME = 'とりゃー' // home.tsxと同じペット名を参照

// API設定
const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || 'http://10.200.4.2:3000').replace(/\/+$/, '')

// カテゴリーと並び順の選択肢
const CATEGORIES = ['すべて', '猫', '犬', '水生動物', 'その他']
const SORT_OPTIONS = ['入手順', '名前順', '種類順']

// 全ペットデータ（ペット選択用）
const allPets = [
    // 猫のペット
    { id: 'black_cat', name: 'クロネコ', image: require('@/assets/images/black_cat.png'), category: '猫' },
    { id: 'vitiligo_cat', name: 'ブチネコ', image: require('@/assets/images/vitiligo_cat.png'), category: '猫' },
    { id: 'mike_cat', name: 'ミケネコ', image: require('@/assets/images/mike_cat.png'), category: '猫' },
    { id: 'tora_cat', name: 'キジトラ', image: require('@/assets/images/tora_cat.png'), category: '猫' },
    { id: 'ameshort_cat', name: 'アメショ', image: require('@/assets/images/ameshort_cat.png'), category: '猫' },
    
    // 犬のペット
    { id: 'shiba_dog', name: 'シバイヌ', image: require('@/assets/images/shiba_dog.png'), category: '犬' },
    { id: 'chihuahua', name: 'チワワ', image: require('@/assets/images/chihuahua.png'), category: '犬' },
    { id: 'pome', name: 'ポメラニアン', image: require('@/assets/images/pome.png'), category: '犬' },
    { id: 'toipo', name: 'プードル', image: require('@/assets/images/toipo.png'), category: '犬' },
    { id: 'bulldog', name: 'ブルドッグ', image: require('@/assets/images/bulldog.png'), category: '犬' },
    
    // 魚類・水生動物
    { id: 'gingin_penguin', name: 'GINGIN', image: require('@/assets/images/gingin_penguin.png'), category: '水生動物' },
    { id: 'takopee', name: 'ミズダコ', image: require('@/assets/images/takopee.png'), category: '水生動物' },
    { id: 'penguin', name: 'ペンギン', image: require('@/assets/images/penguin.png'), category: '水生動物' },
    { id: 'slime', name: 'スラリー', image: require('@/assets/images/slime.png'), category: '水生動物' },
    
    // その他
    { id: 'zebra', name: 'シマウマ', image: require('@/assets/images/zebra.png'), category: 'その他' },
    { id: 'rabbit', name: 'ウサギ', image: require('@/assets/images/rabbit.png'), category: 'その他' },
    { id: 'chinpan', name: 'チンパンジー', image: require('@/assets/images/chinpan.png'), category: 'その他' },
    { id: 'panda', name: 'パンダ', image: require('@/assets/images/panda.png'), category: 'その他' },
]

interface PetChangeProps {
    onClose?: () => void
}

const PetChange: React.FC<PetChangeProps> = ({ onClose }) => {
    const insets = useSafeAreaInsets()
    const [isSafeAreaReady, setIsSafeAreaReady] = useState(false)
    const [nameEditVisible, setNameEditVisible] = useState(false)
    const [newPetName, setNewPetName] = useState(PET_NAME)
    const [isUpdating, setIsUpdating] = useState(false)
    const [selectedPetId, setSelectedPetId] = useState('black_cat') // 選択されたペットID
    
    // グリッド並べ替え用のstate
    const [selectedCategory, setSelectedCategory] = useState('すべて')
    const [selectedSortOrder, setSelectedSortOrder] = useState('入手順')
    const [categoryDropdownVisible, setCategoryDropdownVisible] = useState(false)
    const [sortDropdownVisible, setSortDropdownVisible] = useState(false)
    
    // パラメータアニメーション用のref
    const healthAnim = useRef(new Animated.Value(0)).current
    const sizeAnim = useRef(new Animated.Value(0)).current
    const intimacyAnim = useRef(new Animated.Value(0)).current

    // ペット名を更新する関数
    const updatePetName = async () => {
        if (!newPetName.trim()) {
            Alert.alert('エラー', 'ペット名を入力してください')
            return
        }

        try {
            setIsUpdating(true)
            

            // API呼び出し
            const response = await fetch(`${API_BASE_URL}/api/pets/update-name`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_pet_name: newPetName.trim(),
                }),
            })

            if (response.ok) {
                const result = await response.json()
                if (result.success) {
                    Alert.alert('成功', 'ペット名を更新しました')
                    setNameEditVisible(false)
                } else {
                    Alert.alert('エラー', result.message || 'ペット名の更新に失敗しました')
                }
            } else {
                Alert.alert('エラー', 'サーバーエラーが発生しました')
            }
        } catch (error) {
            console.error('ペット名更新エラー:', error)
            Alert.alert('エラー', 'ネットワークエラーが発生しました')
        } finally {
            setIsUpdating(false)
        }
    }

    // SafeAreaInsetsが確実に取得できるまで待つ
    useEffect(() => {
        // iOSの場合はinsets.topが20以上、Androidの場合は0以上であることを確認
        const isInsetsReady = Platform.OS === 'ios' ? insets.top >= 20 : insets.top >= 0

        if (isInsetsReady) {
            // 少し遅延してから表示（SafeAreaが確実に適用されるまで）
            const timer = setTimeout(() => {
                setIsSafeAreaReady(true)
            }, 300)
            return () => clearTimeout(timer)
        }
    }, [insets])

    // ペットパラメータアニメーション
    useEffect(() => {
        const paramValues = {
            health: 0.9,    // 健康度 90%
            size: 0.6,      // 大きさ 60%
            intimacy: 0.8,  // 親密度 80%
        }

        // アニメーションをリセットしてから開始
        healthAnim.setValue(0)
        sizeAnim.setValue(0)
        intimacyAnim.setValue(0)

        // すべて同じ秒数（例: 800ms）でアニメーション
        Animated.timing(healthAnim, {
            toValue: paramValues.health,
            duration: 800,
            useNativeDriver: false,
        }).start()
        Animated.timing(sizeAnim, {
            toValue: paramValues.size,
            duration: 800,
            useNativeDriver: false,
        }).start()
        Animated.timing(intimacyAnim, {
            toValue: paramValues.intimacy,
            duration: 800,
            useNativeDriver: false,
        }).start()
    }, [healthAnim, sizeAnim, intimacyAnim])

    // ペット選択ハンドラ
    const handlePetSelect = (petId: string) => {
        setSelectedPetId(petId)
    }

    // フィルタリングとソート機能
    const getFilteredAndSortedPets = () => {
        let filteredPets = [...allPets]
        
        // カテゴリーフィルタ
        if (selectedCategory !== 'すべて') {
            filteredPets = filteredPets.filter(pet => pet.category === selectedCategory)
        }
        
        // ソート
        switch (selectedSortOrder) {
            case '名前順':
                filteredPets.sort((a, b) => a.name.localeCompare(b.name, 'ja'))
                break
            case '種類順':
                filteredPets.sort((a, b) => a.category.localeCompare(b.category, 'ja'))
                break
            case '入手順':
            default:
                // 元の順序を維持（何もしない）
                break
        }
        
        return filteredPets
    }

    // 選択されたペットを取得
    const getSelectedPet = () => {
        return allPets.find(pet => pet.id === selectedPetId) || allPets[0]
    }

    // SafeAreaInsetsが準備できるまでローディング表示
    if (!isSafeAreaReady) {
        return <View style={{ flex: 1, backgroundColor: '#fff' }} />
    }

    return (
        <View style={styles.container}>
            {/* タイトル */}
            <Text style={styles.title}>ペット変更</Text>
            {/* 水平線 */}
            <View style={styles.underline} />

            {/* 背景画像エリア */}
            <View style={styles.backgroundImageContainer}>
                <ImageBackground
                    source={require('@/assets/images/petback.png')}
                    style={styles.backgroundImage}
                    resizeMode='cover'
                >
                    {/* 選択されたペット画像を中央に表示 */}
                    <Image
                        source={getSelectedPet().image}
                        style={styles.selectedPetImage}
                        resizeMode='contain'
                    />
                </ImageBackground>
            </View>

            {/* ペット名とペンシルアイコン */}
            <View style={styles.petNameSection}>
                <Text style={styles.petNameText}>{PET_NAME}</Text>
                <TouchableOpacity 
                    style={styles.editButton}
                    onPress={() => {
                        setNameEditVisible(true)
                    }}
                >
                    <FontAwesomeIcon
                        icon={faPencil}
                        size={16}
                        color='#000'
                    />
                </TouchableOpacity>
            </View>

            {/* ペットのパラメータセクション */}
            <View style={styles.petParamRow}>
                {/* ペット画像 */}
                <View style={styles.petParamImageWrapper}>
                    <Image
                        source={getSelectedPet().image}
                        style={styles.petParamImage}
                        resizeMode='cover'
                    />
                </View>
                {/* パラメータ情報 */}
                <View style={styles.petParamInfo}>
                    <View style={styles.indicatorColumn}>
                        <View style={styles.indicatorRow}>
                            <Text style={styles.indicatorLabel}>健康度</Text>
                            <View style={styles.indicator}>
                                <Animated.View
                                    style={{
                                        backgroundColor: '#2BA44E',
                                        height: '100%',
                                        borderRadius: responsiveWidth(1.25),
                                        width: healthAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: ['0%', '100%'],
                                        }),
                                    }}
                                />
                            </View>
                        </View>
                        <View style={styles.indicatorRow}>
                            <Text style={styles.indicatorLabel}>大きさ</Text>
                            <View style={styles.indicator}>
                                <Animated.View
                                    style={{
                                        backgroundColor: '#2BA44E',
                                        height: '100%',
                                        borderRadius: responsiveWidth(1.25),
                                        width: sizeAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: ['0%', '100%'],
                                        }),
                                    }}
                                />
                            </View>
                        </View>
                        <View style={[styles.indicatorRow, { marginBottom: 0 }]}>
                            <Text style={styles.indicatorLabel}>親密度</Text>
                            <View style={styles.indicator}>
                                <Animated.View
                                    style={{
                                        backgroundColor: '#2BA44E',
                                        height: '100%',
                                        borderRadius: responsiveWidth(1.25),
                                        width: intimacyAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: ['0%', '100%'],
                                        }),
                                    }}
                                />
                            </View>
                        </View>
                    </View>
                </View>
            </View>

            {/* グリッド並べ替えセクション */}
            <View style={styles.sortFilterContainer}>
                {/* カテゴリー絞り込み */}
                <View style={styles.categoryFilterContainer}>
                    <Text style={styles.categoryLabel}>カテゴリー：</Text>
                    <TouchableOpacity
                        style={styles.categorySelectButton}
                        onPress={() => setCategoryDropdownVisible(true)}
                    >
                        <Text style={styles.categorySelectText}>{selectedCategory}</Text>
                        <Text style={styles.dropdownArrow}>▼</Text>
                    </TouchableOpacity>
                </View>
                
                {/* 並び順選択 */}
                <View style={styles.sortOrderContainer}>
                    <Text style={styles.sortLabel}>表示順：</Text>
                    <TouchableOpacity
                        style={styles.sortSelectButton}
                        onPress={() => setSortDropdownVisible(true)}
                    >
                        <Text style={styles.sortSelectText}>{selectedSortOrder}</Text>
                        <Text style={styles.dropdownArrow}>▼</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* ペット選択グリッド */}
            <View style={styles.petGridContainer}>
                <ScrollView 
                    style={styles.petGridScrollView}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.petGrid}>
                        {getFilteredAndSortedPets().map((pet, index) => (
                            <TouchableOpacity
                                key={pet.id}
                                style={[
                                    styles.petGridItem,
                                    selectedPetId === pet.id && styles.selectedPetGridItem,
                                    (index + 1) % 3 === 0 && styles.petGridItemLast // 3列目のアイテムに適用
                                ]}
                                onPress={() => handlePetSelect(pet.id)}
                            >
                                <Image
                                    source={pet.image}
                                    style={styles.petGridImage}
                                    resizeMode='contain'
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            </View>

            {/* ペット名編集モーダル */}
            <Modal
                visible={nameEditVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setNameEditVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>ペット名を変更</Text>
                        
                        <TextInput
                            style={styles.textInput}
                            value={newPetName}
                            onChangeText={setNewPetName}
                            placeholder="新しいペット名を入力"
                            maxLength={20}
                            autoFocus={true}
                        />
                        
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => {
                                    setNameEditVisible(false)
                                    setNewPetName(PET_NAME) // 元の名前に戻す
                                }}
                            >
                                <Text style={styles.cancelButtonText}>キャンセル</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={[styles.modalButton, styles.submitButton]}
                                onPress={updatePetName}
                                disabled={isUpdating}
                            >
                                <Text style={styles.submitButtonText}>
                                    {isUpdating ? '更新中...' : '送信'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* カテゴリー選択ドロップダウンモーダル */}
            <Modal
                visible={categoryDropdownVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setCategoryDropdownVisible(false)}
            >
                <TouchableOpacity
                    style={styles.dropdownOverlay}
                    activeOpacity={1}
                    onPress={() => setCategoryDropdownVisible(false)}
                >
                    <View style={styles.dropdownMenu}>
                        {CATEGORIES.map((category, index) => (
                            <TouchableOpacity
                                key={category}
                                style={[
                                    styles.dropdownItem,
                                    index === CATEGORIES.length - 1 && styles.dropdownItemLast,
                                    selectedCategory === category && styles.dropdownItemSelected
                                ]}
                                onPress={() => {
                                    setSelectedCategory(category)
                                    setCategoryDropdownVisible(false)
                                }}
                            >
                                <Text style={[
                                    styles.dropdownItemText,
                                    selectedCategory === category && styles.dropdownItemTextSelected
                                ]}>
                                    {category}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* 並び順選択ドロップダウンモーダル */}
            <Modal
                visible={sortDropdownVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSortDropdownVisible(false)}
            >
                <TouchableOpacity
                    style={styles.dropdownOverlay}
                    activeOpacity={1}
                    onPress={() => setSortDropdownVisible(false)}
                >
                    <View style={styles.dropdownMenu}>
                        {SORT_OPTIONS.map((option, index) => (
                            <TouchableOpacity
                                key={option}
                                style={[
                                    styles.dropdownItem,
                                    index === SORT_OPTIONS.length - 1 && styles.dropdownItemLast,
                                    selectedSortOrder === option && styles.dropdownItemSelected
                                ]}
                                onPress={() => {
                                    setSelectedSortOrder(option)
                                    setSortDropdownVisible(false)
                                }}
                            >
                                <Text style={[
                                    styles.dropdownItemText,
                                    selectedSortOrder === option && styles.dropdownItemTextSelected
                                ]}>
                                    {option}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* 閉じるボタン */}
            {onClose && (
                <TouchableOpacity
                    style={styles.closeModalButtonAbsolute}
                    onPress={onClose}
                >
                    <Text style={styles.closeModalButtonText}>✕</Text>
                </TouchableOpacity>
            )}
        </View>
    )
}

export default PetChange
