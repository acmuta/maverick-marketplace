import React, { useState } from 'react';
import { View, FlatList, TouchableOpacity, StatusBar, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { Appbar, Text, useTheme, Avatar, ActivityIndicator, Divider } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import LoginPrompt from '../components/LoginPrompt';

export default function ChatTab() {
  const { user: currentUser } = useAuth();
  const { chats, isLoadingChats, refreshChats } = useChat();
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  useFocusEffect(
    React.useCallback(() => {
      if (currentUser) {
        refreshChatsWithLoading();
      }
    }, [currentUser])
  );

  const refreshChatsWithLoading = async () => {
    try {
      await refreshChats();
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    refreshChatsWithLoading();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const messageDate = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
  };

  const renderChatItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.chatItem, { borderBottomColor: colors.outline }]}
      onPress={() => router.push(`/chat/${item.$id}`)}
    >
      <Avatar.Text
        size={48}
        label={item.otherUser.displayName.charAt(0).toUpperCase()}
        style={{ backgroundColor: colors.secondaryContainer, marginRight: 16 }}
        color={colors.primary}
      />

      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text variant="titleMedium" style={{ fontWeight: '600' }} numberOfLines={1}>
            {item.otherUser.displayName}
          </Text>
          <Text variant="bodySmall" style={{ color: colors.secondary }}>
            {formatDate(item.updatedAt)}
          </Text>
        </View>
        <Text variant="bodyMedium" style={{ color: colors.secondary }} numberOfLines={1}>
          Re: {item.listingTitle}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (!currentUser) {
    return <LoginPrompt message="Log in to view your messages" icon="chatbubbles-outline" />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* Minimal Header */}
      <View style={[styles.header, { borderBottomColor: colors.outline }]}>
        <Text variant="headlineSmall" style={{ fontWeight: '900' }}>Messages</Text>
      </View>

      {isLoadingChats && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : chats.length === 0 ? (
        <View style={styles.centerContainer}>
          <Feather name="message-square" size={48} color={colors.outline} />
          <Text variant="bodyLarge" style={{ color: colors.secondary, marginTop: 16 }}>No messages yet</Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          renderItem={renderChatItem}
          keyExtractor={item => item.$id}
          contentContainerStyle={{ flexGrow: 1 }}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, borderBottomWidth: 1, backgroundColor: 'white' },
  chatItem: { flexDirection: 'row', padding: 16, alignItems: 'center', backgroundColor: 'white', borderBottomWidth: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});