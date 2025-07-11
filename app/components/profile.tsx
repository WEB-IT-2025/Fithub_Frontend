import React, { useEffect, useRef, useState } from 'react'

import { Animated, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions'

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
    const [period, setPeriod] = useState<'日' | '週' | '月'>('日')
    const [toggleWidth, setToggleWidth] = useState(0)
    const sliderAnim = useRef(new Animated.Value(0)).current

    // レスポンシブなスライダーマージン
    const sliderMargin = responsiveWidth(1.5) // 6px -> レスポンシブ
    const sliderCount = 3
    const sliderWidth = toggleWidth > 0 ? (toggleWidth - sliderMargin * 2) / sliderCount : 0

    // スライダー位置を計算
    const getLeft = (p: '日' | '週' | '月') => {
        if (toggleWidth === 0) return sliderMargin
        if (p === '日') return sliderMargin
        if (p === '週') return sliderMargin + sliderWidth
        return sliderMargin + sliderWidth * 2
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
                                { backgroundColor: contributionColors[Math.max(0, Math.min(count, 4))] },
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
                        resizeMode='cover'
                    />
                </View>
                {/* 名前＋インジケーター3本（縦並び） */}
                <View style={styles.petParamInfo}>
                    <Text style={styles.petParamName}>くろた</Text>
                    <View style={styles.indicatorColumn}>
                        <View style={styles.indicatorRow}>
                            <Text style={styles.indicatorLabel}>健康度</Text>
                            <View style={styles.indicator}>
                                <Animated.View
                                    style={{
                                        backgroundColor: '#2BA44E',
                                        height: '100%',
                                        borderRadius: responsiveWidth(1.25), // 5px -> レスポンシブ
                                        width: healthAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: ['0%', '100%'],
                                        }),
                                    }}
                                />
                            </View>
                        </View>
                        <View style={styles.indicatorRow}>
                            <Text style={styles.indicatorLabel}>サイズ</Text>
                            <View style={styles.indicator}>
                                <Animated.View
                                    style={{
                                        backgroundColor: '#2BA44E',
                                        height: '100%',
                                        borderRadius: responsiveWidth(1.25), // 5px -> レスポンシブ
                                        width: sizeAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: ['0%', '100%'],
                                        }),
                                    }}
                                />
                            </View>
                        </View>
                        <View style={styles.indicatorRow}>
                            <Text style={styles.indicatorLabel}>年齢</Text>
                            <View style={styles.indicator}>
                                <Animated.View
                                    style={{
                                        backgroundColor: '#2BA44E',
                                        height: '100%',
                                        borderRadius: responsiveWidth(1.25), // 5px -> レスポンシブ
                                        width: ageAnim.interpolate({
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
            <View style={styles.Spacer} />
            {/* ユーザーの運動グラフ */}
            <Text style={styles.sectionLabel}>ユーザーの運動グラフ</Text>

            {/* トグルボタン */}
            <View style={styles.toggleContainer}>
                <View
                    style={styles.toggleBackground}
                    onLayout={(e) => setToggleWidth(e.nativeEvent.layout.width)}
                >
                    <Animated.View
                        style={[
                            styles.toggleSlider,
                            {
                                left: sliderAnim,
                                width: sliderWidth || '33.3%',
                            },
                        ]}
                    />
                    {['日', '週', '月'].map((label) => (
                        <TouchableOpacity
                            key={label}
                            style={styles.toggleTouchable}
                            onPress={() => setPeriod(label as '日' | '週' | '月')}
                            activeOpacity={1}
                        >
                            <Text style={[styles.toggleText, period === label && styles.activeToggleText]}>
                                {label}
                            </Text>
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
                <Text
                    style={{
                        color: '#bbb',
                        fontSize: responsiveFontSize(2), // レスポンシブ対応
                    }}
                >
                    （ここに折れ線グラフ）
                </Text>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        borderRadius: responsiveWidth(5), // 20 -> レスポンシブ
        padding: responsiveWidth(6), // 24 -> レスポンシブ
        paddingTop: Platform.OS === 'ios' ? responsiveHeight(6) : responsiveHeight(0), // iOS用に上部パディング増加
    },
    title: {
        fontSize: Platform.OS === 'android' ? responsiveFontSize(2.8) : responsiveFontSize(3), // Androidで少し小さく
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: responsiveHeight(0.25),
        color: '#388e3c',
    },
    underline: {
        height: responsiveHeight(0.125), // 1 -> レスポンシブ
        backgroundColor: '#ccc',
        width: '150%',
        alignSelf: 'center',
        marginBottom: responsiveHeight(1.25), // 10 -> レスポンシブ
        opacity: 0.5,
    },
    userName: {
        fontSize: Platform.OS === 'android' ? responsiveFontSize(2.1) : responsiveFontSize(2.25), // Androidで少し小さく
        fontWeight: 'bold',
        color: '#000',
        marginBottom: responsiveHeight(1.25),
        textAlign: 'left',
    },
    sectionLabel: {
        fontSize: Platform.OS === 'android' ? responsiveFontSize(1.9) : responsiveFontSize(2), // Androidで少し小さく
        color: '#000',
        fontWeight: 'bold',
        marginBottom: responsiveHeight(1),
        textAlign: 'left',
        alignSelf: 'flex-start',
    },
    contributionBoard: {
        backgroundColor: '#fff',
        borderRadius: responsiveWidth(4),
        paddingVertical: responsiveHeight(1.25),
        paddingHorizontal: responsiveWidth(4),
        marginBottom: responsiveHeight(2),
        alignSelf: 'flex-start',
        // プラットフォーム別シャドウ
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: responsiveHeight(0.75) },
                shadowOpacity: 0.18,
                shadowRadius: responsiveWidth(3),
            },
            android: {
                elevation: 6, // Androidではelevationを少し下げる
            },
        }),
    },
    contributionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    contributionBox: {
        width: responsiveWidth(9), // 36 -> レスポンシブ
        height: responsiveWidth(9), // 36 -> レスポンシブ（正方形を維持）
        borderRadius: responsiveWidth(2), // 8 -> レスポンシブ
        marginLeft: responsiveWidth(1), // 4 -> レスポンシブ
        marginRight: responsiveWidth(1), // 4 -> レスポンシブ
        alignItems: 'center',
        justifyContent: 'center',
    },
    Spacer: {
        height: responsiveHeight(1.5), // 12 -> レスポンシブ
    },
    petParamRow: {
        flexDirection: 'row',
        alignItems: 'stretch',
        marginBottom: responsiveHeight(3), // 24 -> レスポンシブ
        width: '100%',
    },
    petParamImageWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
        height: responsiveHeight(10), // 80 -> レスポンシブ
        marginRight: responsiveWidth(4), // 16 -> レスポンシブ
    },
    petParamImage: {
        width: responsiveWidth(25), // 100 -> レスポンシブ
        height: responsiveWidth(25), // 100 -> レスポンシブ（正方形を維持）
    },
    petParamInfo: {
        flex: 1,
        justifyContent: 'center',
        height: responsiveHeight(10), // 80 -> レスポンシブ
    },
    petParamName: {
        fontSize: Platform.OS === 'android' ? responsiveFontSize(2.1) : responsiveFontSize(2.25), // Androidで少し小さく
        fontWeight: 'bold',
        color: '#388e3c',
        marginBottom: responsiveHeight(1),
        textAlign: 'center',
    },
    indicatorColumn: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: responsiveHeight(0.3), // 6 -> 2.4px に縮小
    },
    indicatorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: responsiveHeight(0.3), // 6 -> 2.4px に縮小
        width: '100%',
    },
    indicatorLabel: {
        fontSize: Platform.OS === 'android' ? responsiveFontSize(1.6) : responsiveFontSize(1.75), // Androidで少し小さく
        color: '#333',
        marginRight: responsiveWidth(2.5),
        minWidth: responsiveWidth(15),
        textAlign: 'right',
    },
    indicator: {
        height: responsiveHeight(1.25),
        borderRadius: responsiveWidth(1.25),
        flex: 1,
        minWidth: 0,
        backgroundColor: '#fff',
        // プラットフォーム別シャドウ
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: responsiveHeight(0.25) },
                shadowOpacity: 0.18,
                shadowRadius: responsiveWidth(1),
            },
            android: {
                elevation: 2, // Androidではelevationを少し下げる
            },
        }),
        overflow: 'visible',
        position: 'relative',
    },
    toggleContainer: {
        alignItems: 'center',
        marginBottom: responsiveHeight(2), // 16 -> レスポンシブ
        width: '100%',
    },
    toggleBackground: {
        width: '100%',
        maxWidth: responsiveWidth(100),
        height: responsiveHeight(5.5),
        backgroundColor: '#fff',
        borderRadius: responsiveHeight(2.75),
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
        // プラットフォーム別シャドウ
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: responsiveHeight(0.25) },
                shadowOpacity: 0.12,
                shadowRadius: responsiveWidth(1.5),
            },
            android: {
                elevation: 3, // Androidではelevationを少し下げる
            },
        }),
    },
    toggleSlider: {
        position: 'absolute',
        top: responsiveHeight(0.5), // 4 -> レスポンシブ
        height: responsiveHeight(4.5), // 36 -> レスポンシブ
        backgroundColor: '#136229',
        borderRadius: responsiveHeight(2.25), // 18 -> レスポンシブ
        zIndex: 1,
    },
    toggleTouchable: {
        flex: 1,
        height: responsiveHeight(5.5), // 44 -> レスポンシブ
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    toggleText: {
        color: '#136229',
        fontWeight: 'bold',
        fontSize: responsiveFontSize(2), // 16 -> レスポンシブ
    },
    activeToggleText: {
        color: '#fff',
    },
    totalRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: responsiveHeight(1), // 8 -> レスポンシブ
        gap: responsiveWidth(2), // 8 -> レスポンシブ
    },
    totalLabel: {
        fontSize: responsiveFontSize(1.5), // 12 -> レスポンシブ
        color: '#666',
        marginBottom: responsiveHeight(0.25), // 2 -> レスポンシブ
    },
    totalValue: {
        fontWeight: 'bold',
        color: '#000',
        fontSize: responsiveFontSize(2.5), // 20 -> レスポンシブ
    },
    totalNumber: {
        fontSize: responsiveFontSize(4), // 32 -> レスポンシブ
        fontWeight: 'bold',
        color: '#000',
    },
    totalUnit: {
        fontSize: responsiveFontSize(2), // 16 -> レスポンシブ
        fontWeight: 'bold',
        color: '#000',
    },
    graphPlaceholder: {
        height: responsiveHeight(22.5), // 180 -> レスポンシブ
        width: '100%',
        backgroundColor: '#f4f4f4',
        borderRadius: responsiveWidth(3), // 12 -> レスポンシブ
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: responsiveHeight(3), // 24 -> レスポンシブ
    },
})

export default Profile
