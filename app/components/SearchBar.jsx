import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const COLORS = {
  darkBlue: '#0A1929',
  mediumBlue: '#0F2942',
  lightBlue: '#1565C0',
  orange: '#FF6F00', 
  brightOrange: '#FF9800',
  white: '#FFFFFF',
  lightGray: '#F5F7FA',
  mediumGray: '#B0BEC5',
  darkGray: '#546E7A',
};

export default function SearchBar({ onSearch, placeholder, initialValue = '', inlineStyle = false }) {
  const [searchQuery, setSearchQuery] = React.useState(initialValue);
  const router = useRouter();

  const handleSearch = () => {
    if (onSearch) {
      onSearch(searchQuery);
    } else {
      // Navigate to search screen with query parameter
      router.push({
        pathname: '/search',
        params: { query: searchQuery }
      });
    }
  };

  return (
    <View style={[
      styles.container,
      inlineStyle ? styles.inlineContainer : null
    ]}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.mediumGray} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={placeholder || "Search listings..."}
          placeholderTextColor={COLORS.mediumGray}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={16} color={COLORS.mediumGray} />
          </TouchableOpacity>
        )}
      </View>
      {!inlineStyle && (
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Ionicons name="search" size={20} color={COLORS.white} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 16,
  },
  inlineContainer: {
    paddingHorizontal: 0,
    marginVertical: 0,
  },
  searchContainer: {
    flex: 1,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.mediumBlue,
    borderRadius: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: COLORS.white,
    fontSize: 14,
  },
  clearButton: {
    padding: 4,
  },
  searchButton: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.brightOrange,
    borderRadius: 8,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});