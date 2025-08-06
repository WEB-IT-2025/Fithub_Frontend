// 仮データ：本来はDB/APIから取得する想定
export type Mission = {
    id: string
    type: 'daily' | 'weekly'
    title: string // ミッション名
    image: string | null // アイコン画像URL（nullの場合はアイコンなし）
    description: string // 条件
    status: 'completed' | 'not achieved' // 達成状況
    board: 'display' | 'hidden' // ボードに表示するかどうか
    // APIから取得する進捗データ（オプショナル）
    currentStatus?: number // 現在の進捗
    missionGoal?: number // 目標値
    clearTime?: string | null // クリア時刻（nullの場合は未クリア）
    progressPercentage?: number // 進捗率（0-100）
}

// 仮のミッションデータ
const missions: Mission[] = [
    {
        id: '1',
        type: 'daily',
        title: 'またきたよー',
        image: 'https://example.com/running-icon.png', // アイコン画像URL
        description: 'ログインボーナス',
        status: 'completed',
        board: 'display',
    },
    {
        id: '2',
        type: 'daily',
        title: 'Wake up!',
        image: 'https://example.com/running-icon.png', // アイコン画像URL
        description: 'その日初めて50歩あるいた',
        status: 'not achieved',
        board: 'display',
    },
    {
        id: '3',
        type: 'weekly',
        title: 'はじめの100歩',
        image: 'https://example.com/running-icon.png', // アイコン画像URL
        description: '通算100歩を達成する',
        status: 'not achieved',
        board: 'display',
    },
    {
        id: '4',
        type: 'weekly',
        title: 'はじめの1000歩',
        image: 'https://example.com/running-icon.png', // アイコン画像URL
        description: '通算1000歩を達成する',
        status: 'not achieved',
        board: 'display',
    },
]

export default missions
