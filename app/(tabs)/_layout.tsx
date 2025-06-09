import React from 'react'

import { FontAwesome } from '@expo/vector-icons'
import { Tabs } from 'expo-router'

export default function TabLayout() {
    return (
        <Tabs
        screenOptions={{
              headerShown: false,
                tabBarActiveTintColor: '#007AFF',
                tabBarInactiveTintColor: '#8E8E93',
                tabBarStyle: {
                    backgroundColor: '#FFFFFF',
                    borderTopWidth: 1,
                    borderTopColor: '#E5E5EA',
                },
            }}
        >
            <Tabs.Screen
                name='home'
                options={{
                    title: 'ホーム',
                    tabBarIcon: ({ color }) => (
                        <FontAwesome
                            name='home'
                            size={24}
                            color={color}
                        />
                    ),
                }}
            />
        </Tabs>
    )
}
