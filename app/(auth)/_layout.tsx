import React from 'react'

import { Stack } from 'expo-router'

export default function AuthLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen
                name='login'
                options={{
                    title: 'ログイン',
                }}
            />
            <Stack.Screen
                name='register'
                options={{
                    title: '新規登録',
                }}
            />
        </Stack>
    )
}
