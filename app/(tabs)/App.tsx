import React from 'react'

import { StyleSheet, Text, View } from 'react-native'

const App: React.FC = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>アプリ</Text>
            <Text style={styles.text}>このページは開発中です。</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    text: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
})

export default App
