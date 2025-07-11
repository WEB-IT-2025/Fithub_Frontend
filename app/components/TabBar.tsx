import React from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faPerson, faDog, faScroll, faHome, faUserGroup, faShop, faG, faStore } from '@fortawesome/free-solid-svg-icons'
import { useRouter, usePathname } from 'expo-router'

const TabBar = () => {
    const router = useRouter()
    const pathname = usePathname()

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.tabButton}
                onPress={() => router.replace('/(tabs)/home')} // ← ここを修正
            >
                <FontAwesomeIcon
                    icon={faHome}
                    size={30}
                    color="#000"
                />
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.tabButton}
                onPress={() => router.push('/group')}
            >
                <FontAwesomeIcon
                    icon={faUserGroup}
                    size={30}
                    color="#000"
                />
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.tabButton}
                // onPress={() => router.push('遷移先のパス')}
            >
                <FontAwesomeIcon
                    icon={faShop}
                    size={30}
                    color="#000"
                />
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        height: 120,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E5E5EA',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingBottom: 48,
        paddingTop: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 5,
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
    },
})

export default TabBar
