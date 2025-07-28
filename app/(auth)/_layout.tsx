import React from 'react'

import { Stack, Tabs } from 'expo-router'

export default function AuthLayout() {
    return (
        // <Tabs initialRouteName='shop'>
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
        // </Tabs>
    )
}
