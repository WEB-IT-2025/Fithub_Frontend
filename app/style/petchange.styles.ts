import { Platform, StyleSheet } from 'react-native'
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions'

const styles = StyleSheet.create({
    // ===============================
    // 1. メインコンテナ（画面全体）
    // ===============================
    
    // メインコンテナ - 画面全体のレイアウト
    container: {
        flex: 1,
        padding: 16,
    },

    // ===============================
    // 2. タイトルセクション
    // ===============================
    
    // ページタイトル - 「ペット変更」の見出し
    title: {
        fontSize: Platform.OS === 'android' ? responsiveFontSize(2.8) : responsiveFontSize(2.25),
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: '5%',
        marginTop: 0,
        color: '#388e3c',
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

    // ===============================
    // 3. 背景画像セクション
    // ===============================
    
    // 背景画像コンテナ - ペット背景画像の外枠
    backgroundImageContainer: {
        width: responsiveWidth(100) - 32, // padding分を引く
        height: responsiveHeight(25), // 画面の1/4
        marginTop: 10,
        marginBottom: 10,
        borderRadius: 16,
        overflow: 'hidden', // 角丸を適用するために追加
    },
    // 背景画像 - ペットの背景画像スタイル
    backgroundImage: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    // 選択されたペット画像 - 背景画像の中央に表示
    selectedPetImage: {
        width: '60%',
        height: '60%',
        maxWidth: 120,
        maxHeight: 120,
    },

    // ===============================
    // 4. ペット名セクション
    // ===============================
    
    // ペット名セクション - 名前とペンシルアイコンの横並び
    petNameSection: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        marginBottom: 5,
        paddingLeft: 16, // 左側のパディングを追加
    },
    // ペット名テキスト - 名前表示のスタイル
    petNameText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
        marginRight: 12,
    },
    // 編集ボタン - ペンシルアイコンのタッチエリア
    editButton: {
        paddingTop: 3, // アイコンの位置がテキストの真ん中あたりになるように調整
        alignItems: 'center',
        justifyContent: 'center',
    },

    // ===============================
    // 5. ペットパラメータセクション
    // ===============================
    
    // パラメータ行 - 画像とパラメータの横並びレイアウト
    petParamRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
        width: responsiveWidth(100) - 32, // 背景画像コンテナと同じ（padding分を引く）
        height: responsiveHeight(10), // 画面の1/10程度（縮小）
        gap: 16,
        paddingHorizontal: 16, // 内側のパディング（狭く調整）
    },
    // ペット画像ラッパー - 1:1正方形の画像コンテナ
    petParamImageWrapper: {
        width: responsiveWidth(15), // 1:1の正方形
        height: responsiveWidth(15),
        borderRadius: 8,
        overflow: 'hidden',
    },
    // ペット画像 - 画像本体のスタイル
    petParamImage: {
        width: '100%',
        height: '100%',
    },
    // パラメータ情報 - 右側のパラメータ表示エリア
    petParamInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    // インジケーター列 - パラメータ項目の縦並び
    indicatorColumn: {
        gap: 0,
    },
    // インジケーター行 - ラベルとプログレスバーの横並び
    indicatorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    // インジケーターラベル - パラメータ名（健康度、大きさ、親密度）
    indicatorLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        width: responsiveWidth(20),
        minWidth: 60,
    },
    // インジケーター - プログレスバーの背景
    indicator: {
        flex: 1,
        height: 8,
        backgroundColor: '#e0e0e0', // 薄いグレー - インジケーター背景
        borderRadius: responsiveWidth(1.25),
        overflow: 'hidden',
    },

    // ===============================
    // 6. ペット選択グリッドセクション
    // ===============================
    
    // グリッドコンテナ - ペット選択エリア全体
    petGridContainer: {
        flex: 1,
        marginTop: 10,
        marginBottom: 58, // 閉じるボタン（48px）分の余白
    },   
    // グリッドスクロールビュー - スクロール可能エリア
    petGridScrollView: {
        flex: 1,
        paddingBottom: 80, // バツボタンより上に余白を確保（48px + 余裕分）
    },
    // ペットグリッド - 3列グリッドレイアウト
    petGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        paddingBottom: 10,
    },
    // グリッドアイテム - 各ペットのボタン
    petGridItem: {
        width: '30%', // 3列表示
        aspectRatio: 1, // 正方形
        marginBottom: 15,
        borderRadius: 8,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E9E9E9',
        padding: 8,
    },
    // 選択されたグリッドアイテム - ハイライト表示
    selectedPetGridItem: {
        borderColor: '#388e3c',
        borderWidth: 3,
        backgroundColor: '#f0fff0',
    },
    // グリッド内ペット画像 - 各ペットの画像
    petGridImage: {
        width: '85%',
        height: '85%',
        borderRadius: 4,
    },

    // ===============================
    // 7. モーダル関連（ペット名編集）
    // ===============================
    
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
        backgroundColor: '#ffffff', // 白 - モーダルコンテナ
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
    },
    // テキスト入力フィールド - ペット名入力エリア
    textInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 20,
        backgroundColor: '#f9f9f9', // 薄いグレー - テキスト入力
    },
    // モーダルボタン群 - キャンセル・送信ボタンの横並び
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
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
        backgroundColor: '#f0f0f0', // 薄いグレー - キャンセルボタン
        borderWidth: 1,
        borderColor: '#ccc',
    },
    // 送信ボタン - 緑背景のメインボタン
    submitButton: {
        backgroundColor: '#388e3c', // 緑 - 送信ボタン
    },
    // キャンセルボタンテキスト - グレー文字
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // 送信ボタンテキスト - 白文字
    submitButtonText: {
        color: '#ffffff', // 白文字
        fontSize: 16,
        fontWeight: 'bold',
    },

    // ===============================
    // 8. 閉じるボタン（固定位置）
    // ===============================
    
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
})

export default styles
