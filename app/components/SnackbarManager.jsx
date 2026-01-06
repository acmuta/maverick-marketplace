import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, useTheme } from 'react-native-paper';
import { StyleSheet, View } from 'react-native';

const SnackbarContext = createContext({
    showSnackbar: (message, type = 'info') => { },
});

export const useSnackbar = () => useContext(SnackbarContext);

export const SnackbarProvider = ({ children }) => {
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState('');
    const [type, setType] = useState('info'); // info, success, error
    const { colors } = useTheme();

    const showSnackbar = useCallback((msg, msgType = 'info') => {
        setMessage(msg);
        setType(msgType);
        setVisible(true);
    }, []);

    const onDismiss = () => setVisible(false);

    const getBackgroundColor = () => {
        switch (type) {
            case 'success': return colors.primary; // Greenish if we had a success color, but primary works well for premium
            case 'error': return colors.error;
            default: return colors.inverseSurface;
        }
    };

    const getTextColor = () => {
        switch (type) {
            case 'success': return colors.onPrimary;
            case 'error': return colors.onError;
            default: return colors.inverseOnSurface;
        }
    }

    return (
        <SnackbarContext.Provider value={{ showSnackbar }}>
            {children}
            <Snackbar
                visible={visible}
                onDismiss={onDismiss}
                duration={3000}
                style={[styles.snackbar, { backgroundColor: getBackgroundColor() }]}
                theme={{ colors: { inverseOnSurface: getTextColor() } }} // Force text color
                action={{
                    label: 'OK',
                    onPress: onDismiss,
                    textColor: getTextColor()
                }}
            >
                {message}
            </Snackbar>
        </SnackbarContext.Provider>
    );
};

const styles = StyleSheet.create({
    snackbar: {
        borderRadius: 8,
        marginBottom: 20,
    },
});
