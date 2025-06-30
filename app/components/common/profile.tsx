import React, { useState, useRef, useEffect } from 'react'
import { View, Text, StyleSheet, Image, TouchableOpacity, Animated } from 'react-native'

const userName = 'Nguyen Duc Huynh'
const contributions = [2, 0, 4, 3, 2, 4, 3] // 0〜4の値のみ使うようにしてください

// コントリビューションの色分け
const contributionColors = [
    '#EFEFF4', // 0
    '#ACEEBB', // 1
    '#4BC16B', // 2
    '#2BA44E', // 3
    '#136229', // 4
]

const Profile = () => {
    const [period, setPeriod] = useState<'日' | '週' | '月'>('日') // ← 初期値を「日」に
    const [toggleWidth, setToggleWidth] = useState(0)
    const sliderAnim = useRef(new Animated.Value(0)).current

    // スライダー位置を計算
    const getLeft = (p: '日' | '週' | '月') => {
        if (toggleWidth === 0) return 0
        if (p === '日') return 0
        if (p === '週') return toggleWidth / 3
        return (toggleWidth / 3) * 2
    }

    useEffect(() => {
        Animated.timing(sliderAnim, {
            toValue: getLeft(period),
            duration: 200,
            useNativeDriver: false,
        }).start()
    }, [period, toggleWidth])

    // 進捗率（0~1）を指定
    const paramValues = {
        health: 0.9,
        size: 0.5,
        age: 0.3,
    }

    // Animated.Valueを用意
    const healthAnim = useRef(new Animated.Value(0)).current
    const sizeAnim = useRef(new Animated.Value(0)).current
    const ageAnim = useRef(new Animated.Value(0)).current

    useEffect(() => {
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
        Animated.timing(ageAnim, {
            toValue: paramValues.age,
            duration: 800,
            useNativeDriver: false,
        }).start()
    }, [])

    return (
        <View style={styles.container}>
            {/* タイトル */}
            <Text style={styles.title}>プロフィール</Text>
            <View style={styles.underline} />
            {/* ユーザー名 */}
            <Text style={styles.userName}>{userName}</Text>
            
            {/* 今週のコントリビューション */}
            <Text style={styles.sectionLabel}>今週のコントリビューション</Text>
            {/* 7日分のコントリビューションデータ */}
            <View style={styles.contributionBoard}>
                <View style={styles.contributionRow}>
                    {contributions.map((count, idx) => (
                        <View
                            key={idx}
                            style={[
                                styles.contributionBox,
                                { backgroundColor: contributionColors[Math.max(0, Math.min(count, 4))] }
                            ]}
                        />
                    ))}
                </View>
            </View>
            <View style={styles.Spacer} />
            {/* ペットのパラメータ */}
            <Text style={styles.sectionLabel}>ペットのパラメータ</Text>
            <View style={styles.petParamRow}>
                {/* ペット画像 */}
                <View style={styles.petParamImageWrapper}>
                    <Image
                        source={require('@/assets/images/moukona.jpeg')}
                        style={styles.petParamImage}
                        resizeMode="cover"
                    />
                </View>
                {/* 名前＋インジケーター3本（縦並び） */}
                <View style={styles.petParamInfo}>
                    <Text style={styles.petParamName}>天王寺　熟子
                    </Text>
                    <View style={styles.indicatorColumn}>
                        <View style={styles.indicatorRow}>
                            <Text style={styles.indicatorLabel}>健康度</Text>
                            <View style={styles.indicator}>
                                <Animated.View style={{
                                    backgroundColor: '#2BA44E',
                                    height: '100%',
                                    borderRadius: 5,
                                    width: healthAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ['0%', '100%']
                                    }),
                                }} />
                            </View>
                        </View>
                        <View style={styles.indicatorRow}>
                            <Text style={styles.indicatorLabel}>サイズ</Text>
                            <View style={styles.indicator}>
                                <Animated.View style={{
                                    backgroundColor: '#2BA44E',
                                    height: '100%',
                                    borderRadius: 5,
                                    width: sizeAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ['0%', '100%']
                                    }),
                                }} />
                            </View>
                        </View>
                        <View style={styles.indicatorRow}>
                            <Text style={styles.indicatorLabel}>年齢</Text>
                            <View style={styles.indicator}>
                                <Animated.View style={{
                                    backgroundColor: '#2BA44E',
                                    height: '100%',
                                    borderRadius: 5,
                                    width: ageAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ['0%', '100%']
                                    }),
                                }} />
                            </View>
                        </View>
                    </View>
                </View>
            </View>
            <View style={styles.Spacer} />
            {/* ユーザーの運動グラフ */}
            <Text style={styles.sectionLabel}>ユーザーの運動グラフ</Text>

            {/* トグルボタン */}
            <View style={styles.toggleContainer}>
                <View
                    style={styles.toggleBackground}
                    onLayout={e => setToggleWidth(e.nativeEvent.layout.width)}
                >
                    <Animated.View
                        style={[
                            styles.toggleSlider,
                            {
                                left: sliderAnim,
                                width: toggleWidth / 3 || '33.3%',
                            }
                        ]}
                    />
                    {['日', '週', '月'].map((label) => (
                        <TouchableOpacity
                            key={label}
                            style={styles.toggleTouchable}
                            onPress={() => setPeriod(label as '日' | '週' | '月')}
                            activeOpacity={1}
                        >
                            <Text style={[
                                styles.toggleText,
                                period === label && styles.activeToggleText
                            ]}>{label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* 合計・歩数 */}
            <View style={styles.totalRow}>
                <View>
                    <Text style={styles.totalLabel}>合計</Text>
                    <Text style={styles.totalValue}>
                        <Text style={styles.totalNumber}>5,000</Text>
                        <Text style={styles.totalUnit}>歩</Text>
                    </Text>
                </View>
            </View>

            {/* 折れ線グラフ（ダミー） */}
            <View style={styles.graphPlaceholder}>
                <Text style={{ color: '#bbb' }}>（ここに折れ線グラフ）</Text>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 24,
        paddingTop: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
        color: '#388e3c',
    },
    underline: {
        height: 1,
        backgroundColor: '#ccc',
        width: '150%',
        alignSelf: 'center',
        marginBottom: 10,
        opacity: 0.5,
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 10,
        textAlign: 'left',
    },
    sectionLabel: {
        fontSize: 16,
        color: '#000',           // 黒
        fontWeight: 'bold',      // ボールド
        marginBottom: 16,
        textAlign: 'left',
        alignSelf: 'flex-start',
    },
    contributionBoard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingVertical: 10,
        paddingHorizontal: 16,
        marginBottom: 16,
        alignSelf: 'flex-start',
        // ドロップシャドウ
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
        elevation: 8, // Android用
    },
    contributionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    contributionBox: {
        width: 36,
        height: 36,
        borderRadius: 8,
        marginLeft: 4,
        marginRight: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    Spacer: {
        height: 12, 
    },
    petParamRow: {
        flexDirection: 'row',
        alignItems: 'stretch', // ← stretchで高さを揃える
        marginBottom: 24,
        width: '100%',
    },
    petParamImageWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
        height: 80, // 下のpetParamInfoと高さを揃える
        marginRight: 16,
    },
    petParamImage: {
        width: 100,
        height: 100,
    },
    petParamInfo: {
        flex: 1,
        justifyContent: 'center',
        height: 80, // 画像と同じ高さに
    },
    petParamName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#388e3c',
        marginBottom: 8,
        textAlign: 'center',
    },
    indicatorColumn: {
        flexDirection: 'column',
        alignItems: 'flex-start', // ← 左寄せ
        gap: 6, //
    },
    indicatorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        width: '100%', // 横幅いっぱい使う
    },
    indicatorLabel: {
        fontSize: 14,
        color: '#333',
        marginRight: 10,
        minWidth: 60, // 必要なら固定幅
        textAlign: 'right',
    },
    indicator: {
        height: 10,
        borderRadius: 5,
        flex: 1,
        minWidth: 0,
        backgroundColor: '#fff', // 背景を白
        // ドロップシャドウ
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 4,
        elevation: 3, // Android用
        overflow: 'visible',
        position: 'relative',
    },
    toggleContainer: {
        alignItems: 'center',
        marginBottom: 16,
        width: '100%',
    },
    toggleBackground: {
        width: '100%', // ← 横幅を100%に
        maxWidth: 400, // 必要なら最大幅を設定（例: 400px）
        height: 44,
        backgroundColor: '#fff',
        borderRadius: 22,
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 4,
    },
    toggleSlider: {
        position: 'absolute',
        top: 4,
        height: 36,
        backgroundColor: '#136229',
        borderRadius: 18,
        zIndex: 1,
    },
    toggleTouchable: {
        flex: 1,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    toggleText: {
        color: '#136229',
        fontWeight: 'bold',
        fontSize: 16,
    },
    activeToggleText: {
        color: '#fff',
    },
    totalRow: {
        flexDirection: 'row',
        alignItems: 'flex-start', // ← 上揃えに
        marginBottom: 8,
        gap: 8,
    },
    totalLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2, // ラベルと値の間に少し余白
    },
    totalValue: {
        fontWeight: 'bold',
        color: '#000',
        fontSize: 20,
    },
    totalNumber: {
        fontSize: 32, // 数字を大きく
        fontWeight: 'bold',
        color: '#000',
    },
    totalUnit: {
        fontSize: 16, // 単位を小さく
        fontWeight: 'bold',
        color: '#000',
    },
    graphPlaceholder: {
        height: 180,
        width: '100%',
        backgroundColor: '#f4f4f4',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
})

export default Profile