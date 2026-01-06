import React from 'react';
import { View, FlatList, Dimensions, StyleSheet, Pressable } from 'react-native';
import { Card, Text, useTheme, IconButton } from 'react-native-paper';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const GAP = 12;
const ITEM_WIDTH = (width - (GAP * 3)) / COLUMN_COUNT; // Equal spacing logic

export default function ListingGrid({ listing = [], isLoading, onRefresh, refreshing, onLoadMore, hasMore, loadingMore }) {
  const router = useRouter();
  const { colors } = useTheme();

  const renderItem = ({ item, index }) => (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 500, delay: index * 100 }}
      style={styles.itemContainer}
    >
      <Card
        style={[styles.card, { backgroundColor: colors.surface }]}
        onPress={() => router.push(`/listing/${item.$id}`)}
        mode="elevated"
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
          {/* "New" Badge */}
          {isNew(item.$createdAt) && (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>NEW</Text>
            </View>
          )}
        </View>

        <Card.Content style={styles.infoContainer}>
          <Text variant="titleMedium" style={{ color: colors.primary, fontWeight: '800' }}>
            ${item.price}
          </Text>

          <Text variant="bodyMedium" numberOfLines={1} style={{ fontWeight: '600', marginTop: 2, color: colors.onSurface }}>
            {item.title}
          </Text>

          <Text variant="labelSmall" style={{ color: colors.secondary, marginTop: 4 }} numberOfLines={1}>
            {item.category} • {item.condition}
          </Text>
        </Card.Content>
      </Card>
    </MotiView>
  );

  const isNew = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3;
  };

  return (
    <FlatList
      data={listing}
      renderItem={renderItem}
      keyExtractor={(item) => item.$id}
      numColumns={COLUMN_COUNT}
      contentContainerStyle={{ padding: GAP, flexGrow: 1 }}
      columnWrapperStyle={listing.length > 0 ? { gap: GAP } : null}
      showsVerticalScrollIndicator={false}
      onRefresh={onRefresh}
      refreshing={refreshing}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.5}
      ListEmptyComponent={
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80, paddingHorizontal: 32 }}>
          <MotiView
            from={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 700 }}
          >
            <Ionicons name="bag-handle-outline" size={80} color={colors.surfaceVariant} />
          </MotiView>
          <Text variant="titleLarge" style={{ marginTop: 24, fontWeight: 'bold', color: colors.secondary }}>No listings found</Text>
          <Text variant="bodyMedium" style={{ textAlign: 'center', color: colors.outline, marginTop: 8 }}>
            There are no items matching your criteria right now. Check back later or try different filters.
          </Text>
        </View>
      }
      ListFooterComponent={loadingMore && <View style={{ padding: 20 }}><Text style={{ textAlign: 'center', color: colors.secondary }}>Loading more...</Text></View>}
    />
  );
}

const styles = StyleSheet.create({
  itemContainer: {
    width: ITEM_WIDTH,
    marginBottom: GAP,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 0.8,
    position: 'relative',
    backgroundColor: '#F3F4F6',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    padding: 12,
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});