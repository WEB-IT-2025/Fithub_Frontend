import React from 'react'

import { useColorScheme } from '@/hooks/useColorScheme'
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { useFonts } from 'expo-font'
import { Redirect, Stack, usePathname } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { View } from 'react-native'
import 'react-native-reanimated'

import TabBar from './components/TabBar'

export default function RootLayout() {
    const colorScheme = useColorScheme()
    const pathname = usePathname()
    const [loaded] = useFonts({
        SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    })

    if (!loaded) {
        // Async font loading only occurs in development.
        return null
    }

    const showTabBar = !pathname.startsWith('/(auth)')

    return (
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen
                
                    name='(auth)'
                    options={{
                        headerShown: false,
                    }}
                />
                <Stack.Screen
                    name='(tabs)'
                    options={{
                        headerShown: false,
                    }}
                />
                <Stack.Screen name='+not-found' />
            </Stack>
            <StatusBar style='auto' />
      </ThemeProvider>
      
    )
}
