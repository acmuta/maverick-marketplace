import { Alert } from 'react-native';

const DEBUG = __DEV__;

export function showError(userMessage, debugInfo = null) {
    if (DEBUG && debugInfo) {
        console.log('DEBUG_ERROR:', debugInfo);
        // Format debug info for alert if it's an object
        const debugText = typeof debugInfo === 'object' ? JSON.stringify(debugInfo, null, 2) : debugInfo;
        Alert.alert('Error', `${userMessage}\n\nDebug Info:\n${debugText}`);
    } else {
        Alert.alert('Error', userMessage);
    }
}

// Pre-defined user-friendly messages
export const ErrorMessages = {
    NETWORK: 'Please check your internet connection and try again.',
    UPLOAD_FAILED: 'Failed to upload image. Please check your connection.',
    NO_IMAGES: 'Please add at least one image for your listing.',
    LOGIN_REQUIRED: 'Please log in to continue.',
    PERMISSION_DENIED: 'You do not have permission to perform this action.',
    SERVER_ERROR: 'Something went wrong on our end. Please try again later.',
    DELETE_FAILED: 'Failed to delete item. Please try again.',
    UPDATE_FAILED: 'Failed to update item. Please try again.',
};
