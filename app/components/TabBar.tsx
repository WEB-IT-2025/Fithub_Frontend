import { Ionicons } from '@expo/vector-icons'
import { usePathname, useRouter } from 'expo-router'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export default function TabBar() {
    const router = useRouter()
    const pathname = usePathname()

    const tabs = [
        {
            name: 'ホーム',
            icon: 'home',
            path: '/home',
        },
        {
            name: 'コミュニティ',
            icon: 'people-circle-outline',
            path: '/community',
        },
        {
            name: 'ストア',
            icon: 'store',
            path: '/store',
        },
    ]

    return (
        <View style={styles.container}>
            {tabs.map((tab) => (
                <TouchableOpacity
                    key={tab.path}
                    style={styles.tab}
                    onPress={() => router.push(tab.path as any)}
                >
                    <Ionicons
                        name={tab.icon as keyof typeof Ionicons.glyphMap}
                        size={24}
                        color={pathname === tab.path ? '#007AFF' : '#8E8E93'}
                    />
                    <Text style={[styles.tabText, pathname === tab.path && styles.activeTabText]}>{tab.name}</Text>
                </TouchableOpacity>
            ))}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        height: 120,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E5EA',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 5,
    },
    tab: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabText: {
        fontSize: 12,
        marginTop: 4,
        color: '#8E8E93',
    },
    activeTabText: {
        color: '#007AFF',
    },
})
