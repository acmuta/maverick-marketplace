import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

export default function ListingGrid({ listing, isLoading, refreshing, onRefresh }){
    const router = useRouter();
  
    const renderListingItem = ({ item }) => (
      <TouchableOpacity
        style={styles.listingCard}
        onPress={() => router.push(`/listing/${item.$id}`)}
      >
        <View style={styles.imageContainer}>
        {item.imageUrl ? (
            <Image 
                source={{ 
                    uri: item.imageUrl
                }}
                style={{...styles.image, minWidth: 150, minHeight: 150}}
                contentFit="cover"
                cachePolicy="none"
                transition={300}
                onError={(error) => {
                  console.error("Image error:", error);
                  // If in a real app, you could set a fallback image here
                }}
            />
        ) : (
            <View style={styles.placeholderImage}>
                <Text style={styles.placeholderText}>No Image</Text>
            </View>
        )}
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.price}>${item.price.toFixed(2)}</Text>
          <Text style={styles.category} numberOfLines={1}>{item.category}</Text>
        </View>
      </TouchableOpacity>
    );
    
    if (listing.length === 0 && !isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No listings found</Text>
        </View>
      );
    }
    
    return (
      <FlatList
        data={listing}
        renderItem={renderListingItem}
        keyExtractor={item => item.$id}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing || false} onRefresh={onRefresh} />
        }
      />
    );
}

const styles = StyleSheet.create({
    listContainer: {
      padding: 8,
    },
    listingCard: {
      flex: 1,
      margin: 8,
      backgroundColor: 'white',
      borderRadius: 8,
      overflow: 'hidden',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 1.5,
      maxWidth: '47%',
    },
    imageContainer: {
      height: 150,
      width: '100%',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    placeholderImage: {
      width: '100%',
      height: '100%',
      backgroundColor: '#f0f0f0',
      justifyContent: 'center',
      alignItems: 'center',
    },
    placeholderText: {
      color: '#888',
    },
    infoContainer: {
      padding: 10,
    },
    title: {
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 4,
    },
    price: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#2196F3',
      marginBottom: 4,
    },
    category: {
      fontSize: 12,
      color: '#666',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    emptyText: {
      fontSize: 16,
      color: '#666',
      textAlign: 'center',
    },
  });