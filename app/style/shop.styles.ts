import { Platform, StyleSheet } from 'react-native'
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions'

const styles = StyleSheet.create({
    background: {
        flex: 1,
    },
    container: {
        flex: 1,
        // paddingTop: 48,
        paddingTop: '8%',
        paddingHorizontal: 16,
        paddingBottom: '10%',
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
        paddingBottom: '-1%',
        paddingTop: '1%',
        paddingLeft: '5%',
        paddingRight: '5%',
        marginBottom: '2%',
        alignItems: 'center', // 中央寄せに変更
        flex: 1,
    },
    selectedPetImage: {
        width: 130, // 340pxの50%サイズ
        height: undefined,
        aspectRatio: 1, // 正方形を維持
        marginBottom: 12,
        resizeMode: 'contain', // 画像の縦横比を保持しつつ完全に表示
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
        marginTop: '5%', // ← TabBarの少し上に余白を追加
        marginBottom: '25%', // ← TabBarとの隙間を縮小（100→70）
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
        padding: 8,
        marginHorizontal: 4,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 12,
        width: 115, // 固定幅を設定
        height: 115, // 固定高さを設定して正方形に
        justifyContent: 'center', // 中央揃えを追加
    },
    sliderPetImage: {
        width: 70, // 画像サイズを小さく調整
        height: 70, // 正方形を維持
        marginBottom: 4, // マージンを小さく
        resizeMode: 'contain', // 画像の縦横比を保持しつつ完全に表示
    },
    sliderPetName: {
        fontSize: 12, // フォントサイズを小さく
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 2, // マージンを小さく
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
        width: 100,
        height: undefined,
        aspectRatio: 1, // 正方形を維持
        marginBottom: 12,
        resizeMode: 'contain', // 画像の縦横比を保持しつつ完全に表示
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
    // 新しく追加するスタイル
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 12,
        marginVertical: 20,
        paddingVertical: 40,
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    noItemsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 12,
        marginVertical: 20,
        paddingVertical: 40,
    },
    noItemsText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    ownedText: {
        fontSize: 12,
        color: '#4CAF50',
        fontWeight: 'bold',
        marginTop: 4,
    },
    ownedBadge: {
        fontSize: 10,
        color: '#4CAF50',
        fontWeight: 'bold',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
        textAlign: 'center',
        marginTop: 2,
    },
    // 所有済みアイテムのスタイル
    sliderItemOwned: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)', // 黒っぽい背景
        opacity: 0.6,
    },
    sliderPetImageOwned: {
        opacity: 0.5, // 画像を薄くする
    },
    sliderPetNameOwned: {
        color: '#999', // テキストを薄くする
    },
    ownedOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    ownedOverlayText: {
        fontSize: 12,
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
    },
})

export default styles
