import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
    faAddressBook,
    faBars,
    faCircleInfo,
    faRepeat,
    faRightFromBracket,
    faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
    Alert,
    Animated,
    Dimensions,
    FlatList,
    Image,
    ImageBackground,
    Modal,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import TabBar from '../../components/TabBar'
import OtherProfile from '../other-profile'

// APIベースURL設定
const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || 'http://10.200.4.2:3000').replace(/\/+$/, '')

// デバッグモード設定
const DEBUG_MODE = __DEV__ // 開発モード時のみデバッグログを出力

// ストレージキー
const STORAGE_KEYS = {
    SESSION_TOKEN: 'session_token',
    USER_ID: 'user_id',
}

// APIレスポンスの型定義
interface ApiGroupMember {
    user_id: string
    user_name: string
    user_icon: string
    is_leader: boolean
    role: 'MEMBER' | 'GROUP_LEADER'
    main_pet: {
        pet_name: string
        item_id: string
        pet_size: number
        pet_intimacy: number
        pet_image: string
    }
}

// 表示用統合型（APIとモックの両方に対応）
interface DisplayMember {
    user_id: string
    user_name?: string
    name?: string
    user_icon?: string
    is_leader?: boolean
    role?: string
    main_pet?: {
        pet_name: string
        item_id: string
        pet_size: number
        pet_intimacy: number
        pet_image: string
    }
    pet?: {
        pet_id: string
        pet_size: number
        pet_state: number
        pet_pictures: string
    }
}

// ペットサイズに基づく表示サイズ（APIのpet_sizeに対応）
// ホーム画面と同じ計算式: petSize * 2 + 40
const statusToSize: Record<number, number> = {
    1: 2 * 1 + 40, // 42px
    2: 2 * 2 + 40, // 44px
    3: 2 * 3 + 40, // 46px
    4: 2 * 4 + 40, // 48px
    5: 2 * 5 + 40, // 50px
    // APIから受け取る可能性のあるより大きなサイズにも対応
    10: 2 * 10 + 40, // 60px
    20: 2 * 20 + 40, // 80px
    30: 2 * 30 + 40, // 100px
    40: 2 * 40 + 40, // 120px
    50: 2 * 50 + 40, // 140px
    60: 2 * 60 + 40, // 160px
    70: 2 * 70 + 40, // 180px
    80: 2 * 80 + 40, // 200px
    90: 2 * 90 + 40, // 220px
    // 最大サイズ
    100: Math.min(2 * 100 + 40, 280), // 240px（最大280pxで制限）
}

// ペット画像のマッピング（APIのpet_imageに対応）
const petImageMap: Record<string, any> = {
    'tora_cat.png': require('@/assets/images/tora_cat.png'),
    'pome.png': require('@/assets/images/pome.png'),
    'cat1.png': require('@/assets/images/cat1.png'),
    'mike_cat.png': require('@/assets/images/mike_cat.png'),
    'black_cat.png': require('@/assets/images/black_cat.png'),
    'vitiligo_cat.png': require('@/assets/images/vitiligo_cat.png'),
    'fithub_cat.png': require('@/assets/images/fithub_cat.png'),
    'ameshort_cat.png': require('@/assets/images/ameshort_cat.png'),
    'gingin_penguin.png': require('@/assets/images/gingin_penguin.png'),
    'bulldog.png': require('@/assets/images/bulldog.png'),
    'chihuahua.png': require('@/assets/images/chihuahua.png'),
    'chinpan.png': require('@/assets/images/chinpan.png'),
    'panda.png': require('@/assets/images/panda.png'),
    'penguin.png': require('@/assets/images/penguin.png'),
    'rabbit.png': require('@/assets/images/rabbit.png'),
    'shiba_dog.png': require('@/assets/images/shiba_dog.png'),
    'slime.png': require('@/assets/images/slime.png'),
    'takopee.png': require('@/assets/images/takopee.png'),
    'toipo.png': require('@/assets/images/toipo.png'),
    'zebra.png': require('@/assets/images/zebra.png'),
    // デフォルト画像
    default: require('@/assets/images/cat1.png'),
}

// 仮のAPIレスポンス例
const groupUsers = [
    {
        user_id: 'u1',
        name: 'ユーザーA',
        pet: {
            pet_id: 'p1',
            pet_size: 5,
            pet_state: 2,
            pet_pictures: '',
        },
    },
    {
        user_id: 'u2',
        name: 'ユーザーB',
        pet: {
            pet_id: 'p2',
            pet_size: 4,
            pet_state: 1,
            pet_pictures: '',
        },
    },
    {
        user_id: 'u3',
        name: 'ユーザーC',
        pet: {
            pet_id: 'p3',
            pet_size: 3,
            pet_state: 3,
            pet_pictures: '',
        },
    },
    {
        user_id: 'u4',
        name: 'ユーザーD',
        pet: {
            pet_id: 'p4',
            pet_size: 2,
            pet_state: 2,
            pet_pictures: '',
        },
    },
    {
        user_id: 'u5',
        name: 'ユーザーE',
        pet: {
            pet_id: 'p5',
            pet_size: 1,
            pet_state: 1,
            pet_pictures: '',
        },
    },
    {
        user_id: 'u6',
        name: 'ユーザーF',
        pet: {
            pet_id: 'p6',
            pet_size: 4,
            pet_state: 2,
            pet_pictures: '',
        },
    },
]

// 画面サイズ取得
const { height: screenHeight, width: screenWidth } = Dimensions.get('window')

// ペット出現範囲を計算
const TABBAR_HEIGHT = 80 // TabBarの高さを正確に設定（必要に応じて調整）
const PET_AREA_TOP = 120 // タイトル領域を避けて上端から開始
const PET_AREA_BOTTOM = screenHeight - TABBAR_HEIGHT - 60 // TabBarの上に十分なマージンを確保
const PET_AREA_LEFT = 0 // 画面の端まで使用
const PET_AREA_RIGHT = screenWidth // 画面の端まで使用

// 画面全体に散らばる配置（全画面活用）
const getNonOverlappingPositions = (count: number, sizeGetter: (idx: number) => number, maxTry = 50) => {
    const positions: { top: number; left: number }[] = []

    // 配置設定 - 画面全体を活用
    const MARGIN = 0 // マージンなしで画面を最大活用
    const availableWidth = PET_AREA_RIGHT - PET_AREA_LEFT - MARGIN * 2
    const availableHeight = PET_AREA_BOTTOM - PET_AREA_TOP - MARGIN * 2

    // 完全にランダムな散らばり配置
    for (let i = 0; i < count; i++) {
        const width = sizeGetter(i)
        const height = sizeGetter(i)

        // 完全ランダム配置（画面全体を使用）
        let tryCount = 0
        let left, top
        let overlap

        do {
            // 画面全体でランダムに配置
            left = Math.random() * (availableWidth - width) + PET_AREA_LEFT + MARGIN
            top = Math.random() * (availableHeight - height) + PET_AREA_TOP + MARGIN

            // 軽い重なりチェック（完全に重ならない程度）
            overlap = positions.some((pos, j) => {
                const prevWidth = sizeGetter(j)
                const prevHeight = sizeGetter(j)
                const horizontalOverlap = Math.max(
                    0,
                    Math.min(left + width, pos.left + prevWidth) - Math.max(left, pos.left)
                )
                const verticalOverlap = Math.max(
                    0,
                    Math.min(top + height, pos.top + prevHeight) - Math.max(top, pos.top)
                )
                const overlapArea = horizontalOverlap * verticalOverlap
                const currentArea = width * height
                const existingArea = prevWidth * prevHeight
                const smallerArea = Math.min(currentArea, existingArea)

                // 80%以上重なっている場合のみ避ける（かなり緩い条件）
                return overlapArea > smallerArea * 0.8
            })

            tryCount++
        } while (overlap && tryCount < maxTry)

        // 画面境界の最終チェック
        left = Math.max(PET_AREA_LEFT, Math.min(left, PET_AREA_RIGHT - width))
        top = Math.max(PET_AREA_TOP, Math.min(top, PET_AREA_BOTTOM - height))

        positions.push({ top, left })
    }

    return positions
}

// --- 既存のroomNamesマッピングを削除し、group.tsxのrooms配列と同じ内容で定義 ---
const rooms = [
    { id: 1, name: 'ダイエット部' },
    { id: 2, name: '筋トレ部' },
    { id: 3, name: '同期' },
    { id: 4, name: '開発チーム' },
    { id: 5, name: 'ECC' },
    { id: 6, name: '女子会' },
]

const RoomScreen = () => {
    const { roomId, groupName, groupId } = useLocalSearchParams<{
        roomId: string
        groupName: string
        groupId: string
    }>()
    const router = useRouter()

    // --- パラメータから受け取ったグループ名を使用し、フォールバックとして従来のロジックを保持 ---
    const room = rooms.find((r) => String(r.id) === String(roomId))
    const roomName = groupName || (room ? room.name : 'ルーム')

    const [menuOpen, setMenuOpen] = useState(false)
    const [membersModalVisible, setMembersModalVisible] = useState(false)
    const [userDetailModalVisible, setUserDetailModalVisible] = useState(false)
    const [selectedUser, setSelectedUser] = useState<any>(null)
    const [profileKey, setProfileKey] = useState(0) // プロフィール強制再レンダリング用のキー
    const [groupMembers, setGroupMembers] = useState<ApiGroupMember[]>([]) // APIから取得したメンバー情報
    const [loading, setLoading] = useState(false)
    const [sessionToken, setSessionToken] = useState<string | null>(null)
    const [isInitialized, setIsInitialized] = useState(false) // 初期化フラグ
    const anim = useRef(new Animated.Value(0)).current

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
            setIsInitialized(true) // 初期化完了をマーク
            if (DEBUG_MODE) {
                console.log('🔐 セッショントークン取得:', token ? 'あり' : 'なし')
            }
        } catch (error) {
            console.error('❌ 認証情報読み込みエラー:', error)
            setIsInitialized(true) // エラーでも初期化完了をマーク
        }
    }

    // グループメンバー情報を取得する関数
    const fetchGroupMembers = useCallback(async () => {
        try {
            setLoading(true)

            // 常に最新のトークンを取得する
            const currentToken = await getSessionToken()

            if (DEBUG_MODE) {
                console.log('🔍 デバッグ情報:')
                console.log('- roomId:', roomId)
                console.log('- groupId:', groupId)
                console.log('- currentToken:', currentToken ? `${currentToken.substring(0, 20)}...` : 'null')
            }

            if (!currentToken) {
                if (DEBUG_MODE) console.warn('⚠️ セッショントークンが見つかりません。ログインが必要です。')
                setGroupMembers([])
                return
            }

            // パラメータから受け取ったgroupIdを優先し、なければroomIdから生成
            const apiGroupId = groupId || (roomId?.startsWith('g') ? roomId : `g${roomId}`)
            const apiUrl = `${API_BASE_URL}/api/group/members/list/${apiGroupId}`

            if (DEBUG_MODE) {
                console.log('👥 グループメンバーAPI呼び出し開始:')
                console.log('- API URL:', apiUrl)
                console.log('- API Group ID:', apiGroupId)
                console.log('- Original roomId:', roomId)
                console.log('- Passed groupId:', groupId)
                console.log('- Authorization Header:', `Bearer ${currentToken?.substring(0, 20)}...`)
            }

            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${currentToken}`,
                },
            })

            console.log('📡 グループメンバーAPI応答:')
            console.log('- Status:', response.status)
            console.log('- Status Text:', response.statusText)
            if (DEBUG_MODE) {
                console.log('- Headers:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2))
            }

            if (!response.ok) {
                const errorText = await response.text()
                console.error('❌ API エラー詳細:')
                console.error('- Status:', response.status)
                console.error('- Status Text:', response.statusText)
                console.error('- Error Body:', errorText)

                if (response.status === 401) {
                    console.error('❌ 認証エラー: トークンが無効または期限切れです')
                    setSessionToken(null)
                    await AsyncStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN)
                    throw new Error('認証が必要です。再度ログインしてください。')
                }
                throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`)
            }

            const responseText = await response.text()
            if (DEBUG_MODE) {
                console.log('📄 レスポンスボディ（テキスト）:', responseText)
            }

            let data: ApiGroupMember[]
            try {
                data = JSON.parse(responseText)
                if (DEBUG_MODE) {
                    console.log('✅ パースされたJSONデータ:', JSON.stringify(data, null, 2))
                }
            } catch (parseError) {
                console.error('❌ JSON パースエラー:', parseError)
                if (DEBUG_MODE) {
                    console.error('❌ レスポンステキスト:', responseText)
                }
                throw new Error(`JSON parse error: ${parseError}`)
            }

            if (DEBUG_MODE) {
                console.log('✅ APIから取得したグループメンバーデータ:')
                console.log('- データ数:', data.length)
                data.forEach((member, index) => {
                    console.log(`- メンバー${index + 1}:`, {
                        user_id: member.user_id,
                        user_name: member.user_name,
                        is_leader: member.is_leader,
                        pet_name: member.main_pet?.pet_name,
                        pet_size: member.main_pet?.pet_size,
                        pet_image: member.main_pet?.pet_image,
                    })
                })
            }

            setGroupMembers(data)
        } catch (error) {
            console.error('❌ グループメンバー取得失敗:')
            console.error('- Error:', error)
            console.error('- Error message:', error instanceof Error ? error.message : 'Unknown error')
            console.error('- Error stack:', error instanceof Error ? error.stack : 'No stack trace')

            // エラーの場合は従来のモックデータを使用
            setGroupMembers([])
        } finally {
            setLoading(false)
        }
    }, [roomId, groupId]) // 依存配列を最小限に絞る

    // コンポーネント初期化の統合useEffect
    useEffect(() => {
        const initializeScreen = async () => {
            if (!isInitialized) {
                await loadAuthInfo()
            }
        }
        initializeScreen()
    }, [isInitialized])

    // 初期化後にメンバー情報を取得
    useEffect(() => {
        if (isInitialized && roomId) {
            fetchGroupMembers()
        }
    }, [isInitialized, roomId, groupId]) // fetchGroupMembersを依存配列から除外

    // メンバー一覧を表示
    const handleShowMembers = () => {
        setMembersModalVisible(true)
    }

    // ユーザー詳細を表示
    const handleShowUserDetail = (user: any) => {
        setSelectedUser(user)
        setMembersModalVisible(false)
        setProfileKey((prev) => prev + 1) // キーを更新して強制再レンダリング
        setTimeout(() => {
            setUserDetailModalVisible(true) // プロフィールモーダルを0.2秒後に開く
        }, 200)
    }

    // メンバー詳細を更新（API対応）
    const getMemberDetails = (member: DisplayMember) => {
        if (member.main_pet) {
            // APIデータの場合
            return `ペット: ${member.main_pet.pet_name || 'なし'} | サイズ: ${member.main_pet.pet_size || 0} | 親密度: ${member.main_pet.pet_intimacy || 0}`
        } else if (member.pet) {
            // モックデータの場合
            return `ペットサイズ: ${member.pet.pet_size} | 健康度: ${member.pet.pet_state}`
        }
        return 'ペット情報なし'
    }

    // 退会確認ダイアログ
    const handleLeaveGroup = () => {
        Alert.alert(
            '退会確認',
            '本当にグループを退会しますか？',
            [
                {
                    text: 'いいえ',
                    style: 'cancel',
                },
                {
                    text: 'はい',
                    style: 'destructive',
                    onPress: async () => {
                        await leaveGroup()
                    },
                },
            ],
            { cancelable: true }
        )
    }

    // グループ退会API呼び出し
    const leaveGroup = async () => {
        try {
            setLoading(true)

            // 常に最新のトークンを取得する
            const currentToken = await getSessionToken()

            console.log('🚪 グループ退会処理開始:')
            console.log('- roomId:', roomId)
            console.log('- groupId:', groupId)
            console.log('- currentToken:', currentToken ? `${currentToken.substring(0, 20)}...` : 'null')

            if (!currentToken) {
                console.warn('⚠️ セッショントークンが見つかりません。ログインが必要です。')
                Alert.alert('エラー', '認証が必要です。再度ログインしてください。')
                return
            }

            // パラメータから受け取ったgroupIdを優先し、なければroomIdから生成
            const apiGroupId = groupId || (roomId?.startsWith('g') ? roomId : `g${roomId}`)
            const apiUrl = `${API_BASE_URL}/api/group/members/leave/${apiGroupId}`

            console.log('🚪 グループ退会API呼び出し開始:')
            console.log('- API URL:', apiUrl)
            console.log('- API Group ID:', apiGroupId)
            console.log('- Authorization Header:', `Bearer ${currentToken?.substring(0, 20)}...`)

            const response = await fetch(apiUrl, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${currentToken}`,
                },
            })

            console.log('📡 グループ退会API応答:')
            console.log('- Status:', response.status)
            console.log('- Status Text:', response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error('❌ グループ退会APIエラー:')
                console.error('- Status:', response.status)
                console.error('- Status Text:', response.statusText)
                console.error('- Error Body:', errorText)

                if (response.status === 401) {
                    console.error('❌ 認証エラー: トークンが無効または期限切れです')
                    Alert.alert('エラー', '認証が必要です。再度ログインしてください。')
                    return
                }

                Alert.alert('エラー', 'グループ退会に失敗しました。もう一度お試しください。')
                return
            }

            console.log('✅ グループ退会成功')

            // 退会成功時の処理
            Alert.alert('退会完了', 'グループから退会しました。', [
                {
                    text: 'OK',
                    onPress: () => {
                        // グループ一覧画面に戻る
                        router.push('/(tabs)/group')
                    },
                },
            ])
        } catch (error) {
            console.error('❌ グループ退会処理失敗:')
            console.error('- Error:', error)
            console.error('- Error message:', error instanceof Error ? error.message : 'Unknown error')

            Alert.alert('エラー', 'グループ退会処理中にエラーが発生しました。')
        } finally {
            setLoading(false)
        }
    }

    const menuItems = [
        {
            label: '詳細',
            icon: faCircleInfo,
            onPress: () => {
                // TODO: implement address book action
            },
        },
        {
            label: 'メンバー',
            icon: faAddressBook,
            onPress: handleShowMembers,
        },
        {
            label: '退会',
            icon: faRightFromBracket,
            onPress: handleLeaveGroup,
        },
    ]

    // APIデータとモックデータを組み合わせて表示用データを作成
    const displayMembers: DisplayMember[] = useMemo(() => {
        const members =
            groupMembers.length > 0 ?
                groupMembers.map((member) => ({
                    user_id: member.user_id,
                    user_name: member.user_name,
                    user_icon: member.user_icon,
                    is_leader: member.is_leader,
                    role: member.role,
                    main_pet: member.main_pet,
                }))
            :   groupUsers.map((user) => ({
                    user_id: user.user_id,
                    name: user.name,
                    pet: user.pet,
                }))

        // ペットサイズの昇順（小さい順）でソート - 小さいペットが後に描画され上に表示される
        return members.sort((a, b) => {
            const getSizeForSort = (member: DisplayMember): number => {
                if (member.main_pet?.pet_size) {
                    return member.main_pet.pet_size
                } else if (member.pet?.pet_size) {
                    return member.pet.pet_size
                }
                return 50 // デフォルトサイズ
            }

            return getSizeForSort(a) - getSizeForSort(b) // 昇順ソート
        })
    }, [groupMembers])

    // ペットのランダム位置を初期化（メンバー数に応じて動的に計算）
    const [petPositions, setPetPositions] = useState<{ top: number; left: number }[]>([])

    // メンバー情報が更新されたときにペット位置を再計算
    useEffect(() => {
        if (displayMembers.length > 0) {
            const positions = getNonOverlappingPositions(displayMembers.length, (idx) => {
                const member = displayMembers[idx]
                if (member.main_pet?.pet_size) {
                    // APIデータの場合（ホーム画面と同じ計算式）
                    const petSize = member.main_pet.pet_size
                    return statusToSize[petSize] || Math.min(2 * petSize + 40, 280)
                } else if (member.pet?.pet_size) {
                    // モックデータの場合（ホーム画面と同じ計算式）
                    const petSize = member.pet.pet_size
                    return statusToSize[petSize] || Math.min(2 * petSize + 40, 280)
                }
                return 64
            })
            setPetPositions(positions)
        }
    }, [displayMembers.length, groupMembers.length]) // より具体的な依存関係を指定

    // ペット画像を取得する関数
    const getPetImage = (member: DisplayMember) => {
        if (member.main_pet?.pet_image) {
            // APIデータの場合
            const petImage = member.main_pet.pet_image
            console.log(`🖼️ ペット画像取得: ${member.user_name} → ${petImage}`, {
                petImage,
                hasImageInMap: !!petImageMap[petImage],
                availableKeys: Object.keys(petImageMap).slice(0, 5), // 最初の5個のキーを表示
            })
            return petImageMap[petImage] || petImageMap.default
        } else {
            // モックデータの場合
            console.log(`🖼️ モックデータのペット画像使用: ${member.name || member.user_name}`)
            return require('@/assets/images/cat1.png')
        }
    }

    // ペットサイズを取得する関数
    const getPetSize = (member: DisplayMember) => {
        if (member.main_pet?.pet_size) {
            // APIデータの場合
            const petSize = member.main_pet.pet_size
            // statusToSizeマッピングにない場合は動的に計算（ホーム画面と同じ式）
            return statusToSize[petSize] || Math.min(2 * petSize + 40, 280)
        } else if (member.pet?.pet_size) {
            // モックデータの場合
            const petSize = member.pet.pet_size
            return statusToSize[petSize] || Math.min(2 * petSize + 40, 280)
        }
        return 64
    }

    // ユーザー名を取得する関数
    const getUserName = (member: DisplayMember) => {
        return member.user_name || member.name || 'Unknown'
    }

    // キーを生成する関数
    const getMemberKey = (member: DisplayMember) => {
        return member.user_id || member.pet?.pet_id || 'unknown'
    }

    const toggleMenu = () => {
        setMenuOpen((prev) => {
            if (!prev) {
                Animated.timing(anim, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                }).start()
            } else {
                Animated.timing(anim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }).start()
            }
            return !prev
        })
    }

    return (
        <ImageBackground
            source={require('@/assets/images/home_bg.png')}
            style={styles.background}
            resizeMode='cover'
        >
            <View style={styles.container}>
                {/* 部屋名 */}
                <View style={styles.roomTitleContainer}>
                    <TouchableOpacity onPress={() => router.push('/(tabs)/group')}>
                        <Image
                            source={require('@/assets/images/Vector.png')}
                            style={styles.backIcon}
                            resizeMode='contain'
                        />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.push('/(tabs)/group')}>
                        <Text style={styles.roomTitle}>{roomName}</Text>
                    </TouchableOpacity>
                </View>

                {/* ペット画像をランダム配置 */}
                <View style={styles.petArea}>
                    {loading && (
                        <View style={styles.loadingContainer}>
                            <Text style={styles.loadingText}>メンバー情報を読み込み中...</Text>
                        </View>
                    )}

                    {!loading &&
                        displayMembers.map((member, idx) => {
                            // 小さいペットほど高いzIndexを設定（上に表示される）
                            const petSize = member.main_pet?.pet_size || member.pet?.pet_size || 50
                            const zIndex = 1000 - petSize // サイズが小さいほどzIndexが大きくなる

                            return (
                                <TouchableOpacity
                                    key={getMemberKey(member)}
                                    style={[
                                        {
                                            position: 'absolute',
                                            top: petPositions[idx]?.top || 100,
                                            left: petPositions[idx]?.left || 100,
                                            zIndex: zIndex, // 小さいペットほど上に表示
                                        },
                                    ]}
                                    onPress={() => {
                                        setSelectedUser(member)
                                        setProfileKey((prev) => prev + 1) // キーを更新して強制再レンダリング
                                        setTimeout(() => {
                                            setUserDetailModalVisible(true) // プロフィールモーダルを0.2秒後に開く
                                        }, 500)
                                    }}
                                >
                                    <Image
                                        source={getPetImage(member)}
                                        style={[
                                            styles.petImage,
                                            {
                                                width: getPetSize(member),
                                                height: getPetSize(member),
                                            },
                                        ]}
                                        resizeMode='contain'
                                    />
                                </TouchableOpacity>
                            )
                        })}
                </View>

                {/* フローティングメニュー */}
                <View
                    pointerEvents='box-none'
                    style={styles.menuArea}
                >
                    {[...menuItems].reverse().map((item, idx) => {
                        const translateY = anim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, -80 * (idx + 1)],
                        })
                        const opacity = anim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 1],
                        })
                        return (
                            <Animated.View
                                key={item.label}
                                style={[
                                    styles.floatingMenuItem,
                                    {
                                        transform: [{ translateY }],
                                        opacity,
                                    },
                                ]}
                                pointerEvents={menuOpen ? 'auto' : 'none'}
                            >
                                <TouchableOpacity
                                    style={styles.floatingButtonInner}
                                    onPress={item.onPress}
                                >
                                    <FontAwesomeIcon
                                        icon={item.icon}
                                        size={32}
                                        color='#fff'
                                    />
                                </TouchableOpacity>
                                <Text style={styles.floatingButtonLabel}>{item.label}</Text>
                            </Animated.View>
                        )
                    })}
                    {/* ハンバーガー/クローズボタン */}
                    <TouchableOpacity
                        style={styles.menuButton}
                        onPress={toggleMenu}
                    >
                        {menuOpen ?
                            <FontAwesomeIcon
                                icon={faXmark}
                                size={32}
                                color='#000'
                            />
                        :   <FontAwesomeIcon
                                icon={faBars}
                                size={32}
                                color='#000'
                            />
                        }
                    </TouchableOpacity>
                </View>

                <View style={styles.tabBarContainer}>
                    <TabBar />
                </View>

                {/* メンバー一覧モーダル */}
                <Modal
                    visible={membersModalVisible}
                    transparent={true}
                    animationType='fade'
                    onRequestClose={() => setMembersModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>メンバー一覧</Text>
                                <TouchableOpacity
                                    onPress={() => setMembersModalVisible(false)}
                                    style={styles.closeButton}
                                >
                                    <FontAwesomeIcon
                                        icon={faXmark}
                                        size={24}
                                        color='#333'
                                    />
                                </TouchableOpacity>
                            </View>

                            <FlatList
                                data={displayMembers}
                                keyExtractor={(item) => getMemberKey(item)}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.memberItem}
                                        onPress={() => handleShowUserDetail(item)}
                                    >
                                        <Image
                                            source={getPetImage(item)}
                                            style={styles.memberPetImage}
                                            resizeMode='contain'
                                        />
                                        <View style={styles.memberInfo}>
                                            <View style={styles.memberNameContainer}>
                                                <Text style={styles.memberName}>{getUserName(item)}</Text>
                                                {/* リーダーバッジ表示（APIデータの場合のみ） */}
                                                {item.is_leader && <Text style={styles.leaderText}>👑 リーダー</Text>}
                                            </View>
                                            <Text style={styles.memberDetails}>{getMemberDetails(item)}</Text>
                                        </View>
                                    </TouchableOpacity>
                                )}
                                style={styles.membersList}
                            />
                        </View>
                    </View>
                </Modal>

                {/* ユーザー詳細モーダル */}
                <Modal
                    visible={userDetailModalVisible}
                    animationType='slide'
                    onRequestClose={() => setUserDetailModalVisible(false)}
                    statusBarTranslucent={true}
                    presentationStyle='fullScreen'
                    hardwareAccelerated={true}
                >
                    <StatusBar
                        barStyle='dark-content'
                        backgroundColor='transparent'
                        translucent={true}
                        hidden={Platform.OS === 'android'}
                    />
                    {selectedUser &&
                        (Platform.OS === 'ios' ?
                            <SafeAreaView style={styles.fullScreenModal}>
                                <OtherProfile
                                    key={profileKey}
                                    userName={getUserName(selectedUser)}
                                    userId={selectedUser.user_id}
                                    userData={{
                                        today: {
                                            steps: 5000,
                                            contributions: 3,
                                            date: new Date().toISOString().split('T')[0],
                                        },
                                        recent_exercise: [],
                                        recent_contributions: [
                                            { day: 'Mon', count: '2' },
                                            { day: 'Tue', count: '0' },
                                            { day: 'Wed', count: '4' },
                                            { day: 'Thu', count: '3' },
                                            { day: 'Fri', count: '2' },
                                            { day: 'Sat', count: '4' },
                                            { day: 'Sun', count: '3' },
                                        ],
                                    }}
                                    onClose={() => setUserDetailModalVisible(false)}
                                />
                            </SafeAreaView>
                        :   <View
                                style={[
                                    styles.fullScreenModal,
                                    { marginTop: 0, paddingTop: StatusBar.currentHeight || 0 },
                                ]}
                            >
                                <OtherProfile
                                    key={profileKey}
                                    userName={getUserName(selectedUser)}
                                    userId={selectedUser.user_id}
                                    userData={{
                                        today: {
                                            steps: 5000,
                                            contributions: 3,
                                            date: new Date().toISOString().split('T')[0],
                                        },
                                        recent_exercise: [],
                                        recent_contributions: [
                                            { day: 'Mon', count: '2' },
                                            { day: 'Tue', count: '0' },
                                            { day: 'Wed', count: '4' },
                                            { day: 'Thu', count: '3' },
                                            { day: 'Fri', count: '2' },
                                            { day: 'Sat', count: '4' },
                                            { day: 'Sun', count: '3' },
                                        ],
                                    }}
                                    onClose={() => setUserDetailModalVisible(false)}
                                />
                            </View>)}
                </Modal>
            </View>
        </ImageBackground>
    )
}

const styles = StyleSheet.create({
    background: { flex: 1 },
    container: {
        flex: 1,
        paddingTop: 48,
        paddingHorizontal: 16,
        paddingBottom: 64,
    },
    roomTitleContainer: {
        position: 'absolute',
        top: 60,
        left: 16,
        zIndex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backIcon: {
        width: 24,
        height: 24,
        marginTop: 24,
        marginRight: 8,
    },
    roomTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#000',
        marginTop: 24,
    },
    petArea: {
        flex: 1,
        position: 'relative',
        minHeight: 350,
        marginBottom: 24,
    },
    petImage: {
        // borderRadius: 32,
        // borderWidth: 2,
        // borderColor: '#fff',
    },
    loadingContainer: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -100 }, { translateY: -20 }],
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
        fontWeight: 'bold',
        textAlign: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    menuArea: {
        position: 'absolute',
        right: 8,
        bottom: 150,
        alignItems: 'center',
        zIndex: 2000, // ペットよりも高いz-indexを設定
    },
    menuButton: {
        backgroundColor: 'rgba(255,255,255,0.85)',
        borderRadius: 32,
        width: 56,
        height: 56,
        marginRight: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    floatingMenuItem: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        width: 80,
        height: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
    floatingButtonInner: {
        width: 56,
        height: 56,
        backgroundColor: 'transparent',
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    floatingButtonLabel: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
        textAlign: 'center',
    },
    tabBarContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 3000, // ペットよりも高いz-indexを設定
    },
    // モーダル関連のスタイル
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        width: '90%',
        maxHeight: '80%',
        paddingVertical: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    closeButton: {
        padding: 8,
    },
    membersList: {
        paddingHorizontal: 20,
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    memberPetImage: {
        width: 48,
        height: 48,
        marginRight: 12,
    },
    memberInfo: {
        flex: 1,
    },
    memberNameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    memberName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginRight: 8,
    },
    leaderText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#FFD700',
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    memberDetails: {
        fontSize: 14,
        color: '#666',
    },
    fullScreenModal: {
        flex: 1,
        backgroundColor: '#fff',
        position: 'relative',
    },
})

export default RoomScreen
