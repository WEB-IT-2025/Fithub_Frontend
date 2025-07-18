import React, { useState } from 'react';



import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';



import Button from '@/components/common/Button';
import Input from '@/components/common/Input';





const LoginScreen = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const handleLogin = () => {
        // const url = VITE_API_BASE_URL
        // TODO: ログイン処理を実装
        router.replace('/(tabs)/home')
    }

    const handleRegister = () => {
        router.push('/(auth)/register')
    }

    // const handleDevLogin = () => {
    //     router.push('../(tab)/home')
    // }

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
                        placeholderTextColor='#aaa'
                    />
                    <Input
                        label='パスワード'
                        value={password}
                        onChangeText={setPassword}
                        placeholder='パスワードを入力'
                        placeholderTextColor='#aaa'
                        secureTextEntry={true}
                    />
                    <Button
                        title='ログイン'
                        onPress={handleLogin}
                    />
                    <Button
                        title='新規登録'
                        onPress={handleRegister}
                        variant='secondary'
                    />
                    {/* <Button
                        title='開発用ログイン'
                        onPress={handleDevLogin}
                        variant='secondary'
                    /> */}
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