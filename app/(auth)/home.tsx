import React from 'react'

import { router } from 'expo-router'
import { Image, StyleSheet, View } from 'react-native'

import { ThemedText } from '@/components/ThemedText'
import Button from '@/components/common/Button'

export default function AuthHomeScreen() {
    return (
        <View style={styles.container}>
            <View style={styles.logoContainer}>
                <Image
                    source={require('@/assets/images/react-logo.png')}
                    style={styles.logo}
                    resizeMode='contain'
                />
                <ThemedText
                    type='title'
                    style={styles.title}
                >
                    Fithub
                </ThemedText>
            </View>

            <Button
                title='メイン画面へ'
                onPress={() => router.replace('/(tabs)/home')}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 20,
    },
    logoContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: 150,
        height: 150,
        marginBottom: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 40,
    },
    menuContainer: {
        width: '100%',
        gap: 10,
    },
    menuButton: {
        width: '100%',
    },
    mainButton: {
        marginTop: 20,
    },
})
