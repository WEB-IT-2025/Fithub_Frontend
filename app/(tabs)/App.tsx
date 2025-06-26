// import React, { useEffect, useState } from 'react'

// import HealthKit, { HKQuantityTypeIdentifier, HealthkitReadAuthorization } from '@kingstinct/react-native-healthkit'
// import { ActivityIndicator, Button, Platform, StyleSheet, Text, View } from 'react-native'

// const App: React.FC = () => {
//     const [steps, setSteps] = useState<number | null>(null)
//     const [loading, setLoading] = useState<boolean>(false)
//     const [error, setError] = useState<string | null>(null)

//     const fetchTodaySteps = async () => {
//         setLoading(true)
//         setError(null)

//         if (Platform.OS !== 'ios') {
//             setError('この機能はiOSデバイス専用です')
//             setLoading(false)
//             return
//         }

//         try {
//             const isAvailable = !!HealthKit
//             if (!isAvailable) {
//                 setError('HealthKitが利用できません')
//                 setLoading(false)
//                 return
//             }

//             // 権限リクエストを修正
//             const granted = await HealthKit.requestAuthorization([HKQuantityTypeIdentifier.stepCount])
//             if (!granted) {
//                 setError('HealthKitの権限が許可されていません')
//                 setLoading(false)
//                 return
//           }
//             const now = new Date()
//             const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            
//             // 正しいオプション構造に修正 - Date オブジェクトをそのまま使用
//             const samples = await HealthKit.queryQuantitySamples(
//                 HKQuantityTypeIdentifier.stepCount, 
//                 {
//                     from: start,
//                     to: now
//                 }
//             )

//             const total = samples.reduce((sum, s) => sum + s.quantity, 0)
//             setSteps(total)  // この行を追加: 歩数をステートに設定
//           setLoading(false)
//         } catch (e: any) {
//             setError('エラーが発生しました: ' + (e.message || String(e)))
//             setLoading(false)
//         }
//     }

//     useEffect(() => {
//         fetchTodaySteps()
//     }, [])

//     return (
//         <View style={styles.container}>
//             <Text style={styles.header}>今日の歩数サンプル</Text>
//             {loading && (
//                 <>
//                     <ActivityIndicator
//                         size='large'
//                         color='#0066cc'
//                     />
//                     <Text style={styles.text}>歩数データを取得中...</Text>
//                 </>
//             )}
//             {error && <Text style={styles.error}>{error}</Text>}
//             {steps !== null && !loading && !error && (
//                 <View style={styles.stepsContainer}>
//                     <Text style={styles.stepsLabel}>今日の歩数</Text>
//                     <Text style={styles.stepsValue}>{steps}</Text>
//                 </View>
//             )}
//             <Button
//                 title='再取得'
//                 onPress={fetchTodaySteps}
//                 disabled={loading}
//             />
//         </View>
//     )
// }

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         backgroundColor: '#f7f7f7',
//         alignItems: 'center',
//         justifyContent: 'center',
//         padding: 24,
//     },
//     header: {
//         fontSize: 26,
//         fontWeight: 'bold',
//         color: '#333',
//         marginBottom: 32,
//     },
//     stepsContainer: {
//         alignItems: 'center',
//         marginBottom: 24,
//         backgroundColor: '#fff',
//         borderRadius: 12,
//         padding: 24,
//         shadowColor: '#000',
//         shadowOpacity: 0.07,
//         shadowRadius: 8,
//         shadowOffset: { width: 0, height: 2 },
//         elevation: 3,
//     },
//     stepsLabel: {
//         fontSize: 16,
//         color: '#888',
//         marginBottom: 10,
//     },
//     stepsValue: {
//         fontSize: 44,
//         fontWeight: 'bold',
//         color: '#0066cc',
//     },
//     text: {
//         fontSize: 16,
//         color: '#666',
//         marginVertical: 12,
//     },
//     error: {
//         color: 'red',
//         fontSize: 16,
//         marginTop: 20,
//         marginBottom: 20,
//         textAlign: 'center',
//     },
// })

// export default App
