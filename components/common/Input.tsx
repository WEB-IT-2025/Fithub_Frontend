import React from 'react';



import { StyleSheet, Text, TextInput, View } from 'react-native';





type InputProps = {
    label: string
    value: string
    onChangeText: (text: string) => void
    placeholder?: string
    secureTextEntry?: boolean
    placeholderTextColor?: string
}

const Input = ({ label, value, onChangeText, placeholder, secureTextEntry, placeholderTextColor }: InputProps) => {
    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                secureTextEntry={secureTextEntry}
                placeholderTextColor={placeholderTextColor}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 15,
        width: '100%',
    },
    label: {
        fontSize: 16,
        marginBottom: 5,
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
})

export default Input