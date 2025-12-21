import React from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Card, Text, useTheme, ActivityIndicator, TouchableRipple } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const GAP = 1; // Tight gap
const COLUMNS = 2;
const ITEM_WIDTH = (width - (GAP * (COLUMNS - 1))) / COLUMNS;

export default function ListingGrid({ listing, isLoading, refreshing, onRefresh, onLoadMore, hasMore, loadingMore }) {
  const router = useRouter();
  const { colors, roundness } = useTheme();

  const renderListingItem = ({ item }) => (
    <TouchableRipple
      onPress={() => router.push(`/listing/${item.$id}`)}
      style={[styles.itemContainer, { borderColor: colors.outline }]}
      rippleColor="rgba(0, 0, 0, 0.1)"
    >
      <View>
        {/* Aspect Ratio 1:1 for main grid */}
        <View style={{ width: '100%', aspectRatio: 1, backgroundColor: colors.secondaryContainer }}>
          <Image
            source={{ uri: item.imageUrl }}
            style={{ flex: 1 }}
            contentFit="cover"
            transition={200}
          />
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.row}>
            <Text variant="titleMedium" style={{ fontWeight: '900', flex: 1 }}>${item.price.toFixed(0)}</Text>
            <Feather name="heart" size={16} color={colors.onSurface} />
          </View>
          <Text variant="bodyMedium" numberOfLines={1} style={{ marginTop: 2 }}>{item.title}</Text>
          <Text variant="labelSmall" style={{ color: colors.secondary, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 }} numberOfLines={1}>
            {item.category} • {item.condition || 'Used'}
          </Text>
        </View>
      </View>
    </TouchableRipple>
  );

  if (listing.length === 0 && !isLoading) {
    return (
      <View style={styles.emptyContainer}>
        <Text variant="bodyLarge" style={{ color: colors.secondary }}>No listings found</Text>
      </View>
    );
  }

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator animating={true} color={colors.primary} size="small" />
      </View>
    );
  };

  return (
    <FlatList
      data={listing}
      renderItem={renderListingItem}
      keyExtractor={item => item.$id}
      numColumns={COLUMNS}
      columnWrapperStyle={{ gap: GAP }}
      contentContainerStyle={{ gap: GAP, paddingBottom: 20 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing || false}
          onRefresh={onRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
      onEndReached={hasMore && !loadingMore ? onLoadMore : null}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
      style={{ backgroundColor: colors.background }}
    />
  );
}

const styles = StyleSheet.create({
  itemContainer: {
    width: ITEM_WIDTH,
    borderRightWidth: 0.5, // Simulate grid lines
    borderBottomWidth: 1,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  infoContainer: {
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});