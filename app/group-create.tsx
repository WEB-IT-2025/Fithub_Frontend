import React, { useState } from 'react'
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Ionicons } from '@expo/vector-icons'

// APIベースURL設定
const API_BASE_URL = (process.env.EXPO_PUBLIC_API_TEST_URL || 'http://10.200.4.2:3000').replace(/\/+$/, '')

// ストレージキー
const STORAGE_KEYS = {
    SESSION_TOKEN: 'session_token',
}

const GroupCreateScreen = () => {
    const router = useRouter()
    const [groupName, setGroupName] = useState('')
    const [maxPerson, setMaxPerson] = useState(2)
    const [isPrivate, setIsPrivate] = useState(false)
    const [showDropdown, setShowDropdown] = useState(false)
    const [loading, setLoading] = useState(false)

    // 参加上限の選択肢（2-10人）
    const participantOptions = [2, 3, 4, 5, 6, 7, 8, 9, 10]

    // セッショントークンを取得する関数
    const getSessionToken = async (): Promise<string | null> => {
        try {
            const token = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_TOKEN)
            return token
        } catch (error) {
            console.error('❌ トークン取得エラー:', error)
            return null
        }
    }

    // グループ作成API呼び出し
    const createGroup = async () => {
        if (!groupName.trim()) {
            Alert.alert('エラー', 'グループ名を入力してください')
            return
        }

        try {
            setLoading(true)

            const token = await getSessionToken()
            if (!token) {
                Alert.alert('エラー', '認証が必要です。再度ログインしてください。')
                return
            }

            const response = await fetch(`${API_BASE_URL}/api/group/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    group_name: groupName.trim(),
                    max_person: maxPerson,
                    back_image: 'black_cat', // デフォルト値
                    is_private: isPrivate,
                }),
            })

            if (!response.ok) {
                if (response.status === 401) {
                    Alert.alert('エラー', '認証が無効です。再度ログインしてください。')
                    return
                }
                const errorText = await response.text()
                console.error('グループ作成エラー:', errorText)
                Alert.alert('エラー', 'グループの作成に失敗しました。')
                return
            }

            const result = await response.json()
            console.log('グループ作成成功:', result)

            Alert.alert(
                '作成完了',
                `グループ「${groupName}」を作成しました！`,
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            // グループ画面に戻る
                            router.back()
                        },
                    },
                ]
            )
        } catch (error) {
            console.error('グループ作成エラー:', error)
            Alert.alert('エラー', 'グループ作成中にエラーが発生しました。')
        } finally {
            setLoading(false)
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.keyboardAvoidingView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {/* ヘッダー */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="close" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.title}>グループ作成</Text>
                </View>

                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    {/* 説明テキスト */}
                    <View style={styles.descriptionSection}>
                        <Text style={styles.descriptionText}>
                            すべての設定は
                            <Text style={styles.highlightText}>あとからでも{'\n'}変更することが可能</Text>です。
                        </Text>
                    </View>

                    {/* グループ名入力 */}
                    <View style={styles.section}>
                        <TextInput
                            style={styles.textInput}
                            placeholder="グループ名"
                            placeholderTextColor="#999"
                            value={groupName}
                            onChangeText={setGroupName}
                            maxLength={30}
                        />
                    </View>

                    {/* 参加上限設定 */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>参加上限</Text>
                        <TouchableOpacity
                            style={styles.dropdownButton}
                            onPress={() => setShowDropdown(!showDropdown)}
                        >
                            <Text style={styles.dropdownText}>{maxPerson}人</Text>
                            <Ionicons 
                                name={showDropdown ? "chevron-up" : "chevron-down"} 
                                size={20} 
                                color="#666" 
                            />
                        </TouchableOpacity>
                        
                        {showDropdown && (
                            <View style={styles.dropdownList}>
                                {participantOptions.map((option) => (
                                    <TouchableOpacity
                                        key={option}
                                        style={styles.dropdownItem}
                                        onPress={() => {
                                            setMaxPerson(option)
                                            setShowDropdown(false)
                                        }}
                                    >
                                        <Text style={styles.dropdownItemText}>{option}人</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* グループ非公開設定 */}
                    <View style={styles.section}>
                        <View style={styles.checkboxContainer}>
                            <Text style={styles.checkboxLabel}>グループを非公開にする</Text>
                            <TouchableOpacity
                                style={styles.checkbox}
                                onPress={() => setIsPrivate(!isPrivate)}
                            >
                                {isPrivate && (
                                    <Ionicons name="checkmark" size={16} color="#388e3c" />
                                )}
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.privateDescription}>
                            ルームを非公開にすると、<Text style={styles.highlightText}>（招待限定ルームの作成が可能）</Text>です。
                        </Text>
                    </View>
                </ScrollView>

                {/* 作成ボタン */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.createButton, loading && styles.createButtonDisabled]}
                        onPress={createGroup}
                        disabled={loading}
                    >
                        <Text style={styles.createButtonText}>
                            {loading ? '作成中...' : 'グループを作成する'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    closeButton: {
        padding: 8,
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 16,
    },
    descriptionSection: {
        marginTop: 16,
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    descriptionText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'left',
        lineHeight: 20,
    },
    highlightText: {
        color: '#388e3c',
        fontWeight: '600',
    },
    section: {
        marginTop: 48,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '400',
        color: '#000',
        marginBottom: 8,
    },
    textInput: {
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        paddingVertical: 8,
        paddingHorizontal: 0,
        fontSize: 20,
        backgroundColor: 'transparent',
    },
    dropdownButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#000',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 12,
        backgroundColor: '#fafafa',
    },
    dropdownText: {
        fontSize: 16,
        color: '#333',
    },
    dropdownList: {
        backgroundColor: '#fff',
        borderRadius: 8,
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        maxHeight: 200,
    },
    dropdownItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    dropdownItemText: {
        fontSize: 16,
        color: '#333',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    checkboxLabel: {
        fontSize: 16,
        color: '#333',
        marginRight: 8,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 3,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    privateDescription: {
        fontSize: 12,
        color: '#666',
        lineHeight: 18,
    },
    characterCount: {
        textAlign: 'right',
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },
    buttonContainer: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        paddingBottom: 32,
    },
    createButton: {
        backgroundColor: '#388e3c',
        borderRadius: 8,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    createButtonDisabled: {
        backgroundColor: '#ccc',
    },
    createButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
})

export default GroupCreateScreen
