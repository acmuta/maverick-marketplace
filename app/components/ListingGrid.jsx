import React from 'react';
import { View, FlatList, Dimensions, StyleSheet, Pressable } from 'react-native';
import { Card, Text, useTheme, IconButton } from 'react-native-paper';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const GAP = 12;
const ITEM_WIDTH = (width - (GAP * 3)) / COLUMN_COUNT; // Equal spacing logic

export default function ListingGrid({ listing = [], isLoading, onRefresh, refreshing, onLoadMore, hasMore, loadingMore }) {
  const router = useRouter();
  const { colors } = useTheme();

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Pressable
        style={[styles.card, { backgroundColor: colors.surface, borderRadius: 16 }]}
        onPress={() => router.push(`/listing/${item.$id}`)}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
          {/* "New" Badge - Simulated logic (e.g. created within last 3 days) */}
          {isNew(item.$createdAt) && (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>NEW</Text>
            </View>
          )}
          {/* Heart Icon Overlay */}
          {/* <Pressable style={styles.heartBtn}>
                <Ionicons name="heart-outline" size={16} color="white" />
            </Pressable> */}
        </View>

        <View style={styles.infoContainer}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="titleLarge" style={{ color: colors.primary, fontWeight: '800' }}>
              ${item.price}
            </Text>
          </View>

          <Text variant="bodyMedium" numberOfLines={1} style={{ fontWeight: '600', marginTop: 2, color: colors.onSurface }}>
            {item.title}
          </Text>

          <Text variant="labelSmall" style={{ color: colors.secondary, marginTop: 4 }} numberOfLines={1}>
            {item.category} • {item.condition}
          </Text>
        </View>
      </Pressable>
    </View>
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
      contentContainerStyle={{ padding: GAP }}
      columnWrapperStyle={{ gap: GAP }}
      showsVerticalScrollIndicator={false}
      onRefresh={onRefresh}
      refreshing={refreshing}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.5}
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
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    // Subtle shadow (physics)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 0.8, // 4:5 Portrait
    position: 'relative',
    backgroundColor: '#F3F4F6',
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
  heartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 6,
  }
});