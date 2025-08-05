/*

このページのみ試験的に結合を意識してコードを書いています。もし逆にやりにくくなってたらゴメンね☆

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
    StyleSheet, 
    Text, 
    TextInput,
    TouchableOpacity, 
    View 
} from 'react-native'
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const PET_NAME = 'とりゃー' // home.tsxと同じペット名を参照

// API設定
const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || 'http://10.200.4.2:3000').replace(/\/+$/, '')

interface PetChangeProps {
    onClose?: () => void
}

const PetChange: React.FC<PetChangeProps> = ({ onClose }) => {
    const insets = useSafeAreaInsets()
    const [isSafeAreaReady, setIsSafeAreaReady] = useState(false)
    const [nameEditVisible, setNameEditVisible] = useState(false)
    const [newPetName, setNewPetName] = useState(PET_NAME)
    const [isUpdating, setIsUpdating] = useState(false)
    
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
                    {/* 背景画像の上に表示するコンテンツがあればここに追加 */}
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
                        source={require('@/assets/images/Nicon.png')}
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

const styles = StyleSheet.create({
    // メインコンテナ - 画面全体のレイアウト
    container: {
        flex: 1,
        backgroundColor: '#ffcccc', // 薄い赤 - メインコンテナ
        padding: 16,
    },
    // ページタイトル - 「ペット変更」の見出し
    title: {
        fontSize: Platform.OS === 'android' ? responsiveFontSize(2.8) : responsiveFontSize(3),
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
        color: '#000',
        backgroundColor: '#ccffcc', // 薄い緑 - タイトル
    },
    // タイトル下の水平線 - 視覚的な区切り
    underline: {
        height: 1,
        backgroundColor: '#000000', // 黒 - 水平線
        width: '150%',
        alignSelf: 'center',
        marginBottom: 10,
        opacity: 0.5,
    },
    // 背景画像コンテナ - ペット背景画像の外枠
    backgroundImageContainer: {
        width: responsiveWidth(100) - 32, // padding分を引く
        height: responsiveHeight(25), // 画面の1/4
        marginTop: 10,
        marginBottom: 10,
        borderRadius: 16,
        overflow: 'hidden', // 角丸を適用するために追加
        backgroundColor: '#ccccff', // 薄い青 - 背景画像コンテナ
    },
    // 背景画像 - ペットの背景画像スタイル
    backgroundImage: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffcc', // 薄い黄色 - 背景画像
    },
    // ペット名セクション - 名前とペンシルアイコンの横並び
    petNameSection: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        marginBottom: 20,
        paddingLeft: 16, // 左側のパディングを追加
        backgroundColor: '#ffccff', // 薄いピンク - ペット名セクション
    },
    // ペット名テキスト - 名前表示のスタイル
    petNameText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
        marginRight: 12,
        backgroundColor: '#ccffff', // 薄いシアン - ペット名テキスト
    },
    // 編集ボタン - ペンシルアイコンのタッチエリア
    editButton: {
        paddingTop: 3, // アイコンの位置がテキストの真ん中あたりになるように調整
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffaacc', // 薄いマゼンタ - 編集ボタン
    },
    // 閉じるボタン（絶対位置） - 画面左下の閉じるボタン
    closeModalButtonAbsolute: {
        position: 'absolute',
        left: 16,
        bottom: '1%',
        backgroundColor: '#b2d8b2',
        width: 64,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    // 閉じるボタンテキスト - ✕マークのスタイル
    closeModalButtonText: {
        color: '#388e3c',
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    // モーダルオーバーレイ - モーダルの背景（半透明）
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(255, 0, 0, 0.3)', // 薄い赤（半透明） - モーダルオーバーレイ
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: responsiveHeight(25), // 上からの距離を指定
    },
    // モーダルコンテナ - モーダルダイアログ本体
    modalContainer: {
        backgroundColor: '#aaffaa', // 薄い緑 - モーダルコンテナ
        borderRadius: 16,
        padding: 24,
        width: responsiveWidth(80),
        maxWidth: 400,
    },
    // モーダルタイトル - 「ペット名を変更」の見出し
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        color: '#388e3c',
        backgroundColor: '#ffaaaa', // 薄い赤 - モーダルタイトル
    },
    // テキスト入力フィールド - ペット名入力エリア
    textInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 20,
        backgroundColor: '#aaaaff', // 薄い青 - テキスト入力
    },
    // モーダルボタン群 - キャンセル・送信ボタンの横並び
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        backgroundColor: '#ffffaa', // 薄い黄色 - モーダルボタン群
    },
    // モーダルボタン共通 - ボタンの基本スタイル
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // キャンセルボタン - グレー背景のボタン
    cancelButton: {
        backgroundColor: '#ffbbbb', // 薄い赤 - キャンセルボタン
        borderWidth: 1,
        borderColor: '#ccc',
    },
    // 送信ボタン - 緑背景のメインボタン
    submitButton: {
        backgroundColor: '#bbffbb', // 薄い緑 - 送信ボタン
    },
    // キャンセルボタンテキスト - グレー文字
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // 送信ボタンテキスト - 白文字
    submitButtonText: {
        color: '#000000', // 黒文字に変更して見やすく
        fontSize: 16,
        fontWeight: 'bold',
    },
    // ペットパラメータ関連のスタイル
    // パラメータ行 - 画像とパラメータの横並びレイアウト
    petParamRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        width: responsiveWidth(100) - 32, // 背景画像コンテナと同じ（padding分を引く）
        height: responsiveHeight(14), // 画面の1/7程度
        gap: 16,
        backgroundColor: '#ddaadd', // 薄い紫 - パラメータ行
        paddingHorizontal: 16, // 内側のパディング
    },
    // ペット画像ラッパー - 1:1正方形の画像コンテナ
    petParamImageWrapper: {
        width: responsiveWidth(15), // 1:1の正方形
        height: responsiveWidth(15),
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#aadddd', // 薄いティール - 画像ラッパー
    },
    // ペット画像 - 画像本体のスタイル
    petParamImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#ddddaa', // 薄いオリーブ - ペット画像
    },
    // パラメータ情報 - 右側のパラメータ表示エリア
    petParamInfo: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: '#ffddaa', // 薄いオレンジ - パラメータ情報
    },
    // インジケーター列 - パラメータ項目の縦並び
    indicatorColumn: {
        gap: 0,
        backgroundColor: '#ddffaa', // 薄い黄緑 - インジケーター列
    },
    // インジケーター行 - ラベルとプログレスバーの横並び
    indicatorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        backgroundColor: '#aaddff', // 薄い青 - インジケーター行
    },
    // インジケーターラベル - パラメータ名（健康度、大きさ、親密度）
    indicatorLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        width: responsiveWidth(20),
        minWidth: 60,
        backgroundColor: '#ffaadd', // 薄いピンク - インジケーターラベル
    },
    // インジケーター - プログレスバーの背景
    indicator: {
        flex: 1,
        height: 8,
        backgroundColor: '#ffaaaa', // 薄い赤 - インジケーター背景
        borderRadius: responsiveWidth(1.25),
        overflow: 'hidden',
    },
})

export default PetChange
