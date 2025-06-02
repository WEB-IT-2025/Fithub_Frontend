import React, { useState } from 'react'

import { router } from 'expo-router'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native'

import Button from '@/components/common/Button'
import Input from '@/components/common/Input'

const LoginScreen = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const handleLogin = () => {
        // TODO: ログイン処理を実装
        router.replace('/(tabs)/home')
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.form}>
                    <Input
                        label='メールアドレス'
                        value={email}
                        onChangeText={setEmail}
                        placeholder='example@email.com'
                    />
                    <Input
                        label='パスワード'
                        value={password}
                        onChangeText={setPassword}
                        placeholder='パスワードを入力'
                        secureTextEntry
                    />
                    <Button
                        title='ログイン'
                        onPress={handleLogin}
                    />
                    <Button
                        title='新規登録'
                        onPress={() => router.push('/register')}
                        variant='secondary'
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    form: {
        padding: 20,
        gap: 15,
    },
})

export default LoginScreen
