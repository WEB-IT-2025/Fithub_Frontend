import React from 'react'

import { StyleSheet, Text, TouchableOpacity } from 'react-native'

type ButtonProps = {
    title: string
    onPress: () => void
    variant?: 'primary' | 'secondary'
}

const Button = ({ title, onPress, variant = 'primary' }: ButtonProps) => {
    return (
        <TouchableOpacity
            style={[styles.button, variant === 'secondary' && styles.secondaryButton]}
            onPress={onPress}
        >
            <Text style={[styles.text, variant === 'secondary' && styles.secondaryText]}>{title}</Text>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 200,
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    text: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryText: {
        color: '#007AFF',
    },
})

export default Button
