import React from 'react'

import { StyleSheet, Text, View } from 'react-native'

const HomeScreen = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>ホーム</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
})

export default HomeScreen
