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
                cachePolicy="disk"
                transition={300}
                onError={(error) => {
                  console.error("Image error:", error);
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
          <RefreshControl 
            refreshing={refreshing || false} 
            onRefresh={onRefresh}
            colors={['#FF8A00']} 
            tintColor="#FF8A00"
          />
        }
        style={styles.flatList}
      />
    );
}

const styles = StyleSheet.create({
    flatList: {
      backgroundColor: '#0A1929',
    },
    listContainer: {
      padding: 8,
    },
    listingCard: {
      flex: 1,
      margin: 8,
      backgroundColor: '#FFFFFF',
      borderRadius: 10,
      overflow: 'hidden',
      elevation: 3,
      shadowColor: '#0F2C5C',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      maxWidth: '47%',
      borderWidth: 1,
      borderColor: '#E0E8F7',
    },
    imageContainer: {
      height: 150,
      width: '100%',
      backgroundColor: '#E0E8F7',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    placeholderImage: {
      width: '100%',
      height: '100%',
      backgroundColor: '#E0E8F7',
      justifyContent: 'center',
      alignItems: 'center',
    },
    placeholderText: {
      color: '#0F2C5C',
      fontWeight: '500',
    },
    infoContainer: {
      padding: 12,
      backgroundColor: '#FFFFFF',
    },
    title: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 6,
      color: '#0F2C5C',
    },
    price: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#FF8A00',
      marginBottom: 6,
    },
    category: {
      fontSize: 12,
      color: '#5A7299',
      fontWeight: '500',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: '#F5F8FF',
    },
    emptyText: {
      fontSize: 16,
      color: '#0F2C5C',
      textAlign: 'center',
      fontWeight: '500',
    },
});