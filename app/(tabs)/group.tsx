import React, { useCallback, useEffect, useRef, useState } from 'react'

import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import {
    Alert,
    Animated,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'

import TabBar from '../../components/TabBar'

// APIベースURL設定
const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || 'http://10.200.4.2:3000').replace(/\/+$/, '')

// ストレージキー
const STORAGE_KEYS = {
    SESSION_TOKEN: 'session_token',
    USER_ID: 'user_id',
}

// JWT解析ヘルパー関数
const parseJwtPayload = (token: string): any | null => {
    try {
        const parts = token.split('.')
        if (parts.length !== 3) return null

        const payload = parts[1]
        let base64 = payload.replace(/-/g, '+').replace(/_/g, '/')

        switch (base64.length % 4) {
            case 2:
                base64 += '=='
                break
            case 3:
                base64 += '='
                break
        }

        return JSON.parse(atob(base64))
    } catch {
        return null
    }
}

// API response type for search
interface ApiGroupData {
    group_id: string
    group_name: string
    max_person: number
    back_image: string
    current_count: number
    is_full: boolean
}

// API response type for user's joined groups (home tab)
interface ApiUserGroupData {
    group_id: string
    group_name: string
    max_person: number
    current_count: number
    back_image: string
    is_leader: boolean
    role: string // "MEMBER" or "GROUP_LEADER"
}

// Local room type
interface Room {
    id: number
    name: string
    type: 'home' | 'search'
    image: any
    createdDate: string
    memberCount: number
    maxMembers: number
    originalGroupId?: string // APIから取得した元のgroup_id
}

const rooms = [
    {
        id: 1,
        name: 'ダイエット部',
        type: 'home',
        image: require('@/assets/images/black_cat.png'),
        createdDate: '2024/01/15',
        memberCount: 5,
        maxMembers: 10,
    },
    {
        id: 2,
        name: '筋トレ部',
        type: 'home',
        image: require('@/assets/images/vitiligo_cat.png'),
        createdDate: '2024/02/03',
        memberCount: 5,
        maxMembers: 10,
    },
    {
        id: 3,
        name: '同期',
        type: 'home',
        image: require('@/assets/images/mike_cat.png'),
        createdDate: '2024/01/20',
        memberCount: 5,
        maxMembers: 10,
    },
    {
        id: 4,
        name: '開発チーム',
        type: 'search',
        image: require('@/assets/images/shiba_dog.png'),
        createdDate: '2024/03/10',
        memberCount: 5,
        maxMembers: 10,
    },
    {
        id: 5,
        name: 'ECC',
        type: 'search',
        image: require('@/assets/images/chihuahua.png'),
        createdDate: '2024/02/28',
        memberCount: 5,
        maxMembers: 10,
    },
    {
        id: 6,
        name: '女子会',
        type: 'search',
        image: require('@/assets/images/pome.png'),
        createdDate: '2024/03/05',
        memberCount: 10,
        maxMembers: 10,
    },
]

type TabType = 'home' | 'search'

const GroupScreen = () => {
    const router = useRouter()
    const [type, setType] = useState<TabType>('home')
    const [toggleWidth, setToggleWidth] = useState(0)
    const [searchText, setSearchText] = useState('')
    const [apiGroups, setApiGroups] = useState<Room[]>([])
    const [userGroups, setUserGroups] = useState<Room[]>([]) // ユーザーが参加しているグループ
    const [loading, setLoading] = useState(false)
    const [sessionToken, setSessionToken] = useState<string | null>(null)
    const sliderAnim = useRef(new Animated.Value(0)).current

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

    // 認証情報を読み込む
    const loadAuthInfo = async () => {
        try {
            const token = await getSessionToken()
            setSessionToken(token)
            console.log('🔐 セッショントークン取得:', token ? 'あり' : 'なし')
        } catch (error) {
            console.error('❌ 認証情報読み込みエラー:', error)
        }
    }

    // APIからグループデータを取得する関数
    const fetchGroups = useCallback(
        async (searchQuery: string = '') => {
            try {
                setLoading(true)

                // 検索クエリパラメータを追加
                const searchParam = searchQuery.trim() ? `?search=${encodeURIComponent(searchQuery)}` : ''
                const apiUrl = `${API_BASE_URL}/api/group/search${searchParam}`

                console.log('🔍 グループ検索API呼び出し開始:', apiUrl)

                // 現在のセッショントークンを取得
                const currentToken = sessionToken || (await getSessionToken())

                if (!currentToken) {
                    console.warn('⚠️ セッショントークンが見つかりません。ログインが必要です。')
                    setApiGroups([])
                    return
                }

                console.log('🔐 認証トークン使用:', currentToken.substring(0, 20) + '...')
                console.log('🔍 検索クエリ:', searchQuery || '(全件)')

                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${currentToken}`,
                    },
                })

                console.log('📡 グループ検索API応答:', response.status)

                if (!response.ok) {
                    if (response.status === 401) {
                        console.error('❌ 認証エラー: トークンが無効または期限切れです')
                        // トークンをクリア
                        setSessionToken(null)
                        await AsyncStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN)
                        throw new Error('認証が必要です。再度ログインしてください。')
                    }
                    throw new Error(`HTTP error! status: ${response.status}`)
                }

                const data: ApiGroupData[] = await response.json()
                console.log('✅ APIから取得したグループデータ:', data)

                // 自分が参加しているグループのIDリストを作成
                const joinedGroupIds = new Set(userGroups.map((group) => group.originalGroupId))
                console.log('🚫 参加済みグループID:', Array.from(joinedGroupIds))

                // 参加していないグループのみフィルタリング
                const availableGroups = data.filter((group) => !joinedGroupIds.has(group.group_id))
                console.log('✅ 参加可能なグループデータ:', availableGroups)

                // APIデータをローカルの Room 型に変換
                const convertedGroups: Room[] = availableGroups.map((group, index) => ({
                    id: parseInt(group.group_id.replace('g', '')) || 1000 + index, // グループIDを数値に変換
                    name: group.group_name,
                    type: 'search' as const,
                    image: require('@/assets/images/black_cat.png'), // デフォルト画像（後でback_imageプロパティを使用可能）
                    createdDate: new Date()
                        .toLocaleDateString('ja-JP', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                        })
                        .replace(/\//g, '/'),
                    memberCount: group.current_count,
                    maxMembers: group.max_person,
                    // 元のgroup_idを保持（API呼び出し用）
                    originalGroupId: group.group_id,
                }))

                console.log('✅ 変換されたグループデータ:', convertedGroups)
                setApiGroups(convertedGroups)
            } catch (error) {
                console.error('❌ グループ取得失敗:', error)
                // エラーの場合は空配列を設定（モックデータのみ表示）
                setApiGroups([])
            } finally {
                setLoading(false)
            }
        },
        [sessionToken, userGroups]
    ) // userGroupsを依存配列に含める

    // ユーザーが参加しているグループを取得する関数（ホームタブ用）
    const fetchUserGroups = useCallback(async () => {
        try {
            setLoading(true)

            // 現在のセッショントークンを取得
            const currentToken = sessionToken || (await getSessionToken())

            if (!currentToken) {
                console.warn('⚠️ セッショントークンが見つかりません。ログインが必要です。')
                setUserGroups([])
                return
            }

            // JWTからユーザーIDを抽出
            const payload = parseJwtPayload(currentToken)
            const userId = payload?.user_id

            if (!userId) {
                console.error('❌ JWTからユーザーIDを取得できませんでした')
                setUserGroups([])
                return
            }

            const apiUrl = `${API_BASE_URL}/api/group/member/userlist/${userId}`
            console.log('🏠 ユーザーグループAPI呼び出し開始:', apiUrl)
            console.log('🔐 認証トークン使用:', currentToken.substring(0, 20) + '...')
            console.log('👤 使用ユーザーID:', userId)

            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${currentToken}`,
                },
            })

            console.log('📡 ユーザーグループAPI応答:', response.status)

            if (!response.ok) {
                if (response.status === 401) {
                    console.error('❌ 認証エラー: トークンが無効または期限切れです')
                    // トークンをクリア
                    setSessionToken(null)
                    await AsyncStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN)
                    throw new Error('認証が必要です。再度ログインしてください。')
                }
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data: ApiUserGroupData[] = await response.json()
            console.log('✅ APIから取得したユーザーグループデータ:', data)

            // APIデータをローカルの Room 型に変換
            const convertedUserGroups: Room[] = data.map((group, index) => ({
                id: parseInt(group.group_id.replace('g', '')) || 2000 + index, // ユーザーグループは2000番台
                name: group.group_name,
                type: 'home' as const,
                image: require('@/assets/images/black_cat.png'), // デフォルト画像（後でback_imageプロパティを使用可能）
                createdDate: new Date()
                    .toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                    })
                    .replace(/\//g, '/'),
                memberCount: group.current_count,
                maxMembers: group.max_person,
                // 元のgroup_idを保持（API呼び出し用）
                originalGroupId: group.group_id,
            }))

            console.log('✅ 変換されたユーザーグループデータ:', convertedUserGroups)
            setUserGroups(convertedUserGroups)
        } catch (error) {
            console.error('❌ ユーザーグループ取得失敗:', error)
            // エラーの場合は空配列を設定
            setUserGroups([])
        } finally {
            setLoading(false)
        }
    }, [sessionToken]) // sessionTokenのみを依存配列に含める

    // グループ参加API呼び出し
    const joinGroup = useCallback(
        async (groupId: string, groupName: string) => {
            try {
                setLoading(true)

                // 常に最新のトークンを取得する
                const currentToken = sessionToken || (await getSessionToken())

                console.log('🚪 グループ参加処理開始:')
                console.log('- groupId:', groupId)
                console.log('- groupName:', groupName)
                console.log('- currentToken:', currentToken ? `${currentToken.substring(0, 20)}...` : 'null')

                if (!currentToken) {
                    console.warn('⚠️ セッショントークンが見つかりません。ログインが必要です。')
                    Alert.alert('エラー', '認証が必要です。再度ログインしてください。')
                    return false
                }

                const apiUrl = `${API_BASE_URL}/api/group/members/join/${groupId}`

                console.log('🚪 グループ参加API呼び出し開始:')
                console.log('- API URL:', apiUrl)
                console.log('- Authorization Header:', `Bearer ${currentToken?.substring(0, 20)}...`)

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${currentToken}`,
                    },
                })

                console.log('📡 グループ参加API応答:')
                console.log('- Status:', response.status)
                console.log('- Status Text:', response.statusText)

                if (!response.ok) {
                    const errorText = await response.text()
                    console.error('❌ グループ参加APIエラー:')
                    console.error('- Status:', response.status)
                    console.error('- Status Text:', response.statusText)
                    console.error('- Error Body:', errorText)

                    if (response.status === 401) {
                        console.error('❌ 認証エラー: トークンが無効または期限切れです')
                        Alert.alert('エラー', '認証が必要です。再度ログインしてください。')
                        return false
                    } else if (response.status === 400) {
                        Alert.alert('参加失敗', 'このグループは満席または参加条件を満たしていません。')
                        return false
                    } else if (response.status === 409) {
                        Alert.alert('参加失敗', '既にこのグループに参加しています。')
                        return false
                    }

                    Alert.alert('エラー', 'グループ参加に失敗しました。もう一度お試しください。')
                    return false
                }

                console.log('✅ グループ参加成功')
                return true
            } catch (error) {
                console.error('❌ グループ参加処理失敗:')
                console.error('- Error:', error)
                console.error('- Error message:', error instanceof Error ? error.message : 'Unknown error')

                Alert.alert('エラー', 'グループ参加処理中にエラーが発生しました。')
                return false
            } finally {
                setLoading(false)
            }
        },
        [sessionToken]
    )

    // グループ参加確認ダイアログ
    const handleJoinGroup = useCallback(
        (room: Room) => {
            if (!sessionToken) {
                Alert.alert('エラー', '認証が必要です。再度ログインしてください。')
                return
            }

            Alert.alert(
                'グループ参加',
                `「${room.name}」に参加しますか？`,
                [
                    {
                        text: 'キャンセル',
                        style: 'cancel',
                    },
                    {
                        text: '参加する',
                        style: 'default',
                        onPress: async () => {
                            const groupId = room.originalGroupId || `g${room.id}`
                            const success = await joinGroup(groupId, room.name)

                            if (success) {
                                Alert.alert('参加完了', `「${room.name}」に参加しました！`, [
                                    {
                                        text: 'OK',
                                        onPress: async () => {
                                            // 参加成功後、データを再取得してUIを更新
                                            await fetchUserGroups() // 先にユーザーグループを更新
                                            await fetchGroups(searchText) // 検索結果も更新（参加したグループは除外される）

                                            // グループ詳細画面に遷移
                                            router.push({
                                                pathname: '/rooms/[roomId]',
                                                params: {
                                                    roomId: String(room.id),
                                                    groupName: room.name,
                                                    groupId: groupId,
                                                },
                                            })
                                        },
                                    },
                                ])
                            }
                        },
                    },
                ],
                { cancelable: true }
            )
        },
        [sessionToken, joinGroup, fetchUserGroups, fetchGroups, searchText, router]
    )

    // コンポーネントマウント時に認証情報とAPIデータを取得（一回のみ）
    useEffect(() => {
        const initializeScreen = async () => {
            await loadAuthInfo()
        }
        initializeScreen()
    }, []) // 空の依存配列で一回のみ実行

    // セッショントークンが設定されたときに初期データを取得
    useEffect(() => {
        if (sessionToken) {
            const loadInitialData = async () => {
                // 認証情報読み込み後、まずユーザーグループを取得
                await fetchUserGroups()
                // その後、検索可能なグループを取得（ユーザーグループを除外するため）
                await fetchGroups('')
            }
            loadInitialData()
        }
    }, [sessionToken]) // sessionTokenの変更時のみ実行

    // 検索テキスト変更時に再検索（デバウンス付き）
    useEffect(() => {
        if (!sessionToken) return // セッショントークンがない場合は何もしない

        const timeoutId = setTimeout(() => {
            if (type === 'search') {
                fetchGroups(searchText) // 検索テキストをAPIに渡す
            }
            // ホームタブでは検索テキストが変わっても再取得しない（既に取得済み）
        }, 500) // 500ms のデバウンス

        return () => clearTimeout(timeoutId)
    }, [searchText, type, sessionToken]) // 関数を依存配列から削除

    // タブ切り替え時の遅延処理
    const handleTabChange = (tabType: TabType) => {
        // タブ状態を即座に変更（UI反応の改善）
        setType(tabType)

        // 既にデータがある場合は再取得しない
        if (tabType === 'search' && sessionToken && apiGroups.length === 0) {
            // 「探す」タブで初回のみAPI取得
            setTimeout(() => {
                fetchGroups(searchText) // 現在の検索テキストを渡す（参加済みグループを除外）
            }, 250) // アニメーション完了後に実行
        } else if (tabType === 'home' && sessionToken && userGroups.length === 0) {
            // 「ホーム」タブで初回のみAPI取得
            setTimeout(() => {
                fetchUserGroups()
            }, 250)
        }
    }

    const sliderMargin = 8
    const sliderCount = 2
    const sliderWidth = toggleWidth > 0 ? (toggleWidth - sliderMargin * 2) / sliderCount : 0

    // スライダー位置を計算
    const getLeft = (t: TabType) => {
        if (toggleWidth === 0) return sliderMargin
        if (t === 'home') return sliderMargin
        return sliderMargin + sliderWidth
    }

    useEffect(() => {
        Animated.timing(sliderAnim, {
            toValue: getLeft(type),
            duration: 200,
            useNativeDriver: false,
        }).start()
    }, [type, toggleWidth])

    // グループをフィルタリング
    const filteredRooms = () => {
        if (type === 'home') {
            // ホームタブはAPIから取得したユーザーが参加しているグループを表示
            const homeRooms = userGroups

            // 検索テキストでフィルタリング（クライアントサイド）
            if (searchText.trim()) {
                return homeRooms.filter((room) => room.name.toLowerCase().includes(searchText.toLowerCase()))
            }

            return homeRooms
        } else {
            // 探すタブはAPIで検索済みのデータを表示（サーバーサイド検索）
            // モックデータは含めない（APIからの結果のみ）
            return apiGroups
        }
    }

    return (
        <View style={styles.background}>
            <View style={styles.container}>
                {/* タイトル */}
                <Text style={styles.title}>グループ</Text>
                {/* 水平線 */}
                <View style={styles.underline} />

                {/* トグルボタン */}
                <View style={styles.toggleContainer}>
                    <View
                        style={{
                            position: 'relative',
                            width: '100%',
                            maxWidth: 400,
                            alignSelf: 'center',
                            marginBottom: 16,
                        }}
                        onLayout={(e) => setToggleWidth(e.nativeEvent.layout.width)}
                    >
                        <View style={[styles.toggleBackgroundShadow, { top: 4, left: 0 }]} />
                        <View style={styles.toggleBackground}>
                            <Animated.View
                                style={[
                                    styles.toggleSlider,
                                    {
                                        left: sliderAnim,
                                        width: sliderWidth || '50%',
                                    },
                                ]}
                            />
                            <TouchableOpacity
                                style={styles.toggleTouchable}
                                onPress={() => handleTabChange('home')}
                                activeOpacity={1}
                            >
                                <Text style={[styles.toggleText, type === 'home' && styles.activeToggleText]}>
                                    ホーム
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.toggleTouchable}
                                onPress={() => handleTabChange('search')}
                                activeOpacity={1}
                            >
                                <Text style={[styles.toggleText, type === 'search' && styles.activeToggleText]}>
                                    探す
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* セクションラベル */}
                <Text style={styles.sectionLabel}>{type === 'home' ? 'ホーム' : '探す'}</Text>
                <View style={styles.spacer} />

                {/* グループリスト */}
                <ScrollView
                    style={styles.groupList}
                    refreshControl={
                        <RefreshControl
                            refreshing={loading}
                            onRefresh={async () => {
                                // プルリフレッシュ時は認証情報も再読み込み
                                await loadAuthInfo()
                                // 現在のタブに応じて適切なAPIを呼び出し
                                if (type === 'home') {
                                    await fetchUserGroups()
                                } else if (type === 'search') {
                                    // 探すタブの場合は、最新のユーザーグループ情報で検索結果を更新
                                    await fetchUserGroups() // 先にユーザーグループを更新
                                    await fetchGroups(searchText) // その後で検索結果を更新
                                }
                            }}
                            colors={['#388e3c']} // Android
                            tintColor='#388e3c' // iOS
                        />
                    }
                >
                    {/* ローディング中でもレイアウトを固定 */}
                    {!sessionToken && (
                        <Text style={styles.authRequiredText}>
                            {type === 'home' ?
                                '参加グループを表示するにはログインが必要です'
                            :   'グループを表示するにはログインが必要です'}
                        </Text>
                    )}

                    {type === 'search' && sessionToken && loading && filteredRooms().length === 0 && (
                        <Text style={styles.loadingText}>グループを読み込み中...</Text>
                    )}

                    {type === 'home' && sessionToken && loading && filteredRooms().length === 0 && (
                        <Text style={styles.loadingText}>参加グループを読み込み中...</Text>
                    )}

                    {type === 'search' && sessionToken && !loading && filteredRooms().length === 0 && (
                        <Text style={styles.emptyText}>グループが見つかりませんでした</Text>
                    )}

                    {type === 'home' && sessionToken && !loading && filteredRooms().length === 0 && (
                        <Text style={styles.emptyText}>参加しているグループがありません</Text>
                    )}

                    {filteredRooms().map((room, idx) => (
                        <View
                            key={idx}
                            style={{ position: 'relative', marginBottom: 16 }}
                        >
                            <View style={[styles.groupItemShadow, { top: 1 }]} />
                            <TouchableOpacity
                                style={styles.groupItem}
                                onPress={() => {
                                    if (type === 'home') {
                                        // ホームタブの場合は直接グループ詳細に遷移
                                        router.push({
                                            pathname: '/rooms/[roomId]',
                                            params: {
                                                roomId: String(room.id),
                                                groupName: room.name,
                                                groupId: room.originalGroupId || `g${room.id}`,
                                            },
                                        })
                                    } else {
                                        // 探すタブの場合は満席チェック後に参加確認ダイアログを表示
                                        if (room.memberCount >= room.maxMembers) {
                                            Alert.alert('参加不可', 'このグループは満席です。')
                                            return
                                        }
                                        handleJoinGroup(room)
                                    }
                                }}
                            >
                                {/* 右下に作成日表示 */}
                                <View style={{ position: 'absolute', bottom: 8, right: 12, zIndex: 2 }}>
                                    <Text
                                        style={{
                                            fontSize: 12,
                                            color: '#666',
                                            fontWeight: 'normal',
                                        }}
                                    >
                                        {room.createdDate}
                                    </Text>
                                </View>

                                {/* 探すタブの場合は参加ボタンを追加表示 */}
                                {type === 'search' && (
                                    <View style={{ position: 'absolute', top: 8, right: 12, zIndex: 3 }}>
                                        <View
                                            style={[
                                                styles.joinButton,
                                                room.memberCount >= room.maxMembers && styles.joinButtonDisabled,
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.joinButtonText,
                                                    room.memberCount >= room.maxMembers &&
                                                        styles.joinButtonTextDisabled,
                                                ]}
                                            >
                                                {room.memberCount >= room.maxMembers ? '満席' : '参加'}
                                            </Text>
                                        </View>
                                    </View>
                                )}

                                {/* ルーム画像 */}
                                <Image
                                    source={room.image}
                                    style={styles.groupImage}
                                    resizeMode='cover'
                                />

                                <View style={styles.groupTextContainer}>
                                    {/* ルーム名 */}
                                    <Text style={styles.groupName}>{room.name}</Text>
                                    {/* 参加人数 */}
                                    <Text style={styles.groupMemberCount}>
                                        参加人数：{room.memberCount} / {room.maxMembers}
                                        {room.memberCount >= room.maxMembers && (
                                            <Text style={styles.fullText}> （満席）</Text>
                                        )}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>

                {/* 下部検索バーと＋ボタン */}
                <View style={styles.bottomSection}>
                    <View style={styles.searchContainer}>
                        <TextInput
                            style={styles.searchInput}
                            placeholder='グループを検索...'
                            placeholderTextColor='#888'
                            value={searchText}
                            onChangeText={setSearchText}
                        />
                    </View>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => {
                            // グループ作成画面に遷移
                            router.push('/group-create')
                        }}
                    >
                        <Ionicons
                            name='add'
                            size={24}
                            color='#000'
                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.tabBarContainer}>
                    <TabBar />
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        backgroundColor: '#fff', // 背景を白に変更
    },
    container: {
        flex: 1,
        backgroundColor: 'transparent',
        borderRadius: 20,
        paddingTop: 48,
        paddingHorizontal: 16,
        paddingBottom: 64,
    },
    title: {
        paddingTop: 24,
        fontSize: 24,
        fontWeight: 'bold',
        color: '#388e3c',
        textAlign: 'center',
        marginBottom: 10,
    },
    underline: {
        height: 1,
        backgroundColor: '#ccc',
        width: '150%',
        alignSelf: 'center',
        marginBottom: 10,
        opacity: 0.5,
    },
    toggleContainer: {
        alignItems: 'center',
        marginBottom: 16,
        width: '100%',
    },
    toggleBackground: {
        width: '100%',
        maxWidth: 400,
        height: 44,
        backgroundColor: '#ACEEBB',
        borderRadius: 22,
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
    },
    toggleBackgroundShadow: {
        position: 'absolute',
        width: '100%',
        height: 44,
        backgroundColor: '#98D3A5',
        borderRadius: 22,
        zIndex: 0,
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
        color: '#388e3c',
        fontWeight: 'bold',
        fontSize: 16,
    },
    activeToggleText: {
        color: '#fff',
    },
    sectionLabel: {
        fontSize: 13,
        color: '#136229',
        textAlign: 'left',
        fontWeight: 'bold',
        marginBottom: 4,
        marginLeft: 8,
        opacity: 0.7,
    },
    spacer: {
        height: 12,
    },
    groupList: {
        flex: 1,
        marginBottom: 80, // TabBarとの間隔を確保
        minHeight: 200, // レイアウト安定のための最小高さ
    },
    groupItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ACEEBB',
        borderRadius: 10,
        padding: 18,
        marginBottom: 10,
    },
    groupItemShadow: {
        position: 'absolute',
        width: '100%',
        height: '95%',
        backgroundColor: '#a5cfa5',
        borderRadius: 10,
        zIndex: 0,
    },
    groupTextContainer: {
        flex: 1,
    },
    groupImage: {
        width: 48,
        height: 48,
        borderRadius: 8,
        marginRight: 12,
        backgroundColor: '#b2d8b2',
    },
    groupName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
        textAlign: 'left',
        marginBottom: 8,
    },
    groupMemberCount: {
        fontSize: 15,
        color: '#222',
        textAlign: 'left',
    },
    fullText: {
        color: '#ff6b6b',
        fontWeight: 'bold',
    },
    joinButton: {
        backgroundColor: '#388e3c',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    joinButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    joinButtonDisabled: {
        backgroundColor: '#ccc',
        shadowOpacity: 0,
        elevation: 0,
    },
    joinButtonTextDisabled: {
        color: '#888',
    },
    bottomSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 80, // TabBarとの間隔を確保
        gap: 12,
        position: 'absolute',
        bottom: 80, // TabBarの上に配置
        left: 16,
        right: 16,
    },
    searchContainer: {
        flex: 1,
        backgroundColor: '#fefefe', // 背景を白に変更
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    searchInput: {
        fontSize: 16,
        color: '#000',
    },
    addButton: {
        backgroundColor: '#fff',
        borderRadius: 24, // 円形にするため半径を48/2=24に
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    tabBarContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
    },
    loadingText: {
        textAlign: 'center',
        color: '#666',
        fontSize: 16,
        marginVertical: 20,
        minHeight: 24, // レイアウト安定のための最小高さ
    },
    emptyText: {
        textAlign: 'center',
        color: '#999',
        fontSize: 16,
        marginVertical: 30,
        fontStyle: 'italic',
        minHeight: 24, // レイアウト安定のための最小高さ
    },
    authRequiredText: {
        textAlign: 'center',
        color: '#ff6b6b',
        fontSize: 16,
        marginVertical: 30,
        fontWeight: 'bold',
        minHeight: 24, // レイアウト安定のための最小高さ
    },
    // 不要になった古いスタイル（削除）
    roomList: {
        paddingTop: 24,
        paddingBottom: 24,
    },
    roomButton: {
        backgroundColor: '#ACEEBB',
        borderRadius: 12,
        paddingVertical: 32,
        paddingHorizontal: 24,
        marginBottom: 16,
        alignItems: 'center',
        shadowColor: '#98D3A5',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    roomButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#136229',
    },
})

export default GroupScreen
