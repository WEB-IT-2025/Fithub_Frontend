import React from 'react'
import { View, Text, StyleSheet, Image } from 'react-native'

const userName = 'フィン'
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
            {/* ペットのパラメータ */}
            <Text style={styles.sectionLabel}>ペットのパラメータ</Text>
            <View style={styles.petParamRow}>
                {/* ペット画像 */}
                <Image
                    source={require('@/assets/images/moukona.jpeg')}
                    style={styles.petParamImage}
                    resizeMode="cover"
                />
                {/* 名前＋インジケーター3本（縦並び） */}
                <View style={styles.petParamInfo}>
                    <Text style={styles.petParamName}>ペットの名前</Text>
                    <View style={styles.indicatorColumn}>
                        <View style={[styles.indicator, { backgroundColor: '#4caf50', width: 60 }]} />
                        <View style={[styles.indicator, { backgroundColor: '#ff9800', width: 40 }]} />
                        <View style={[styles.indicator, { backgroundColor: '#2196f3', width: 30 }]} />
                    </View>
                </View>
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
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
        color: '#388e3c',
    },
    underline: {
        height: 1,
        backgroundColor: '#ccc',
        width: '150%',         // 横幅いっぱい
        alignSelf: 'center',   // 中央寄せ
        marginBottom: 24,
        opacity: 0.5,
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#388e3c',
        marginBottom: 20,
        textAlign: 'left',
    },
    sectionLabel: {
        fontSize: 16,
        color: '#388e3c',
        marginBottom: 12,
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
    petParamRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        width: '100%',
    },
    petParamImage: {
        width: 64,
        height: 64,
        borderRadius: 32,
        marginRight: 16,
    },
    petParamInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    petParamName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#388e3c',
        marginBottom: 8,
    },
    indicatorColumn: {
        flexDirection: 'column', // 縦並び
        alignItems: 'flex-start',
        gap: 6, // RN0.71以降。古い場合はmarginBottomで調整
    },
    indicator: {
        height: 10,
        borderRadius: 5,
        marginBottom: 6,
    },
})

export default Profile