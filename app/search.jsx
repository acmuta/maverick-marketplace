import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import SearchBar from './components/SearchBar';
import ListingGrid from './components/ListingGrid';
import SearchFilters from './components/SearchFilters';
import * as SearchUtils from './utils/searchUtils';

// Define consistent theme colors - matching the home page
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
  error: '#FF5252',
  background: '#0A1929',
  cardBackground: '#0F2942',
  textPrimary: '#FFFFFF',
  textSecondary: '#B0BEC5',
};

export default function SearchScreen() {
  const { query } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [searchQuery, setSearchQuery] = useState(query || '');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [categories, setCategories] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [filtersVisible, setFiltersVisible] = useState(false);
  
  // Active filters
  const [activeFilters, setActiveFilters] = useState({
    category: 'All',
    minPrice: null,
    maxPrice: null,
    condition: 'All',
    sortBy: 'recent'
  });
  
  // Load recent searches from AsyncStorage on first render
  useEffect(() => {
    const fetchRecentSearches = async () => {
      try {
        const searches = await SearchUtils.loadRecentSearches();
        setRecentSearches(searches);
      } catch (error) {
        console.error('Error loading recent searches:', error);
      }
    };
    
    fetchRecentSearches();
  }, []);
  
  // Load categories and conditions on first render
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        // For now, we'll use hard-coded values matching your existing categories
        setCategories([
          'Electronics',
          'Textbooks',
          'Furniture',
          'Clothing',
          'Sports Equipment',
          'Home Appliances',
          'School Supplies',
          'Other'
        ]);
        
        setConditions([
          'New',
          'Like New',
          'Good',
          'Fair',
          'Poor'
        ]);
      } catch (error) {
        console.error('Error loading filter options:', error);
      }
    };
    
    loadFilterOptions();
  }, []);
  
  // Execute search when query or filters change
  useEffect(() => {
    if (searchQuery || activeFilters.category !== 'All' || 
        activeFilters.condition !== 'All' || 
        activeFilters.minPrice !== null || 
        activeFilters.maxPrice !== null) {
      performSearch();
    }
  }, [searchQuery, activeFilters]);
  
  const performSearch = async () => {
    setIsLoading(true);
    
    try {
      // Use our searchUtils function
      const searchResults = await SearchUtils.searchListings({
        query: searchQuery,
        category: activeFilters.category,
        minPrice: activeFilters.minPrice,
        maxPrice: activeFilters.maxPrice,
        condition: activeFilters.condition,
        sortBy: activeFilters.sortBy
      });
      
      // Process results
      setResults(searchResults);
      
      // Update recent searches
      if (searchQuery.trim() !== '') {
        const updatedSearches = await SearchUtils.saveSearchTerm(searchQuery);
        if (updatedSearches) {
          setRecentSearches(updatedSearches);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSearch = (query) => {
    setSearchQuery(query);
  };
  
  const handleCategorySelect = (category) => {
    setActiveFilters(prev => ({
      ...prev,
      category
    }));
  };
  
  const handleRecentSearchSelect = (term) => {
    setSearchQuery(term);
  };
  
  const handleClearRecentSearches = async () => {
    await SearchUtils.clearRecentSearches();
    setRecentSearches([]);
  };
  
  const handleApplyFilters = (newFilters) => {
    setActiveFilters(newFilters);
  };
  
  const handleClearFilters = () => {
    setActiveFilters({
      category: 'All',
      minPrice: null,
      maxPrice: null,
      condition: 'All',
      sortBy: 'recent'
    });
  };
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.darkBlue} />
      
      <Stack.Screen 
        options={{
          title: "Search",
          headerShown: false,
        }}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        
        <View style={styles.searchBarContainer}>
          <SearchBar 
            onSearch={handleSearch} 
            initialValue={searchQuery} 
            inlineStyle={true}
          />
        </View>
      </View>
      
      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterBarContent}
        >
          {/* Category Filter */}
          <TouchableOpacity
            style={[
              styles.filterChip,
              activeFilters.category !== 'All' && styles.filterChipActive
            ]}
            onPress={() => {
              // Toggle category dropdown or similar
              setFiltersVisible(true);
            }}
          >
            <Ionicons 
              name="apps-outline" 
              size={18} 
              color={activeFilters.category !== 'All' ? COLORS.brightOrange : COLORS.mediumGray} 
              style={styles.filterIcon}
            />
            <Text 
              style={[
                styles.filterText,
                activeFilters.category !== 'All' && styles.filterTextActive
              ]}
            >
              {activeFilters.category === 'All' ? 'Category' : activeFilters.category}
            </Text>
          </TouchableOpacity>
          
          {/* Price Filter */}
          <TouchableOpacity
            style={[
              styles.filterChip,
              (activeFilters.minPrice !== null || activeFilters.maxPrice !== null) && styles.filterChipActive
            ]}
            onPress={() => setFiltersVisible(true)}
          >
            <Ionicons 
              name="cash-outline" 
              size={18} 
              color={(activeFilters.minPrice !== null || activeFilters.maxPrice !== null) ? COLORS.brightOrange : COLORS.mediumGray} 
              style={styles.filterIcon}
            />
            <Text 
              style={[
                styles.filterText,
                (activeFilters.minPrice !== null || activeFilters.maxPrice !== null) && styles.filterTextActive
              ]}
            >
              {(activeFilters.minPrice !== null || activeFilters.maxPrice !== null) 
                ? `$${activeFilters.minPrice || 0} - $${activeFilters.maxPrice || '∞'}` 
                : 'Price'}
            </Text>
          </TouchableOpacity>
          
          {/* Condition Filter */}
          <TouchableOpacity
            style={[
              styles.filterChip,
              activeFilters.condition !== 'All' && styles.filterChipActive
            ]}
            onPress={() => setFiltersVisible(true)}
          >
            <Ionicons 
              name="star-outline" 
              size={18} 
              color={activeFilters.condition !== 'All' ? COLORS.brightOrange : COLORS.mediumGray} 
              style={styles.filterIcon}
            />
            <Text 
              style={[
                styles.filterText,
                activeFilters.condition !== 'All' && styles.filterTextActive
              ]}
            >
              {activeFilters.condition === 'All' ? 'Condition' : activeFilters.condition}
            </Text>
          </TouchableOpacity>
          
          {/* Sort Filter */}
          <TouchableOpacity
            style={[
              styles.filterChip,
              activeFilters.sortBy !== 'recent' && styles.filterChipActive
            ]}
            onPress={() => setFiltersVisible(true)}
          >
            <Ionicons 
              name="options-outline" 
              size={18} 
              color={activeFilters.sortBy !== 'recent' ? COLORS.brightOrange : COLORS.mediumGray} 
              style={styles.filterIcon}
            />
            <Text 
              style={[
                styles.filterText,
                activeFilters.sortBy !== 'recent' && styles.filterTextActive
              ]}
            >
              {activeFilters.sortBy === 'recent' 
                ? 'Sort' 
                : activeFilters.sortBy === 'priceAsc' 
                  ? 'Price: Low to High' 
                  : 'Price: High to Low'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
        
        {/* Show "All Filters" Button */}
        <TouchableOpacity 
          style={styles.allFiltersButton}
          onPress={() => setFiltersVisible(true)}
        >
          <Ionicons name="filter" size={18} color={COLORS.white} />
        </TouchableOpacity>
      </View>
      
      {/* Active Filters Summary */}
      {(activeFilters.category !== 'All' || 
        activeFilters.condition !== 'All' || 
        activeFilters.minPrice !== null || 
        activeFilters.maxPrice !== null ||
        activeFilters.sortBy !== 'recent') && (
        <View style={styles.activeFiltersBar}>
          <Text style={styles.activeFiltersText}>
            Filtered by: {' '}
            {activeFilters.category !== 'All' ? `${activeFilters.category}, ` : ''}
            {activeFilters.condition !== 'All' ? `${activeFilters.condition}, ` : ''}
            {(activeFilters.minPrice !== null || activeFilters.maxPrice !== null) 
              ? `$${activeFilters.minPrice || 0} - $${activeFilters.maxPrice || '∞'}, ` 
              : ''}
            {activeFilters.sortBy !== 'recent' 
              ? activeFilters.sortBy === 'priceAsc' 
                ? 'Price: Low to High' 
                : 'Price: High to Low' 
              : ''}
          </Text>
          <TouchableOpacity onPress={handleClearFilters}>
            <Text style={styles.clearFiltersText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Main Content */}
      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.brightOrange} />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : searchQuery || 
            activeFilters.category !== 'All' || 
            activeFilters.condition !== 'All' || 
            activeFilters.minPrice !== null || 
            activeFilters.maxPrice !== null ? (
          <>
            {/* Search Results */}
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>
                {results.length === 0 
                  ? 'No results found' 
                  : `Found ${results.length} result${results.length !== 1 ? 's' : ''}`}
              </Text>
            </View>
            
            {results.length > 0 ? (
              <ListingGrid 
                listing={results} 
                isLoading={false}
                refreshing={false}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={60} color={COLORS.mediumGray} />
                <Text style={styles.emptyTitle}>No listings found</Text>
                <Text style={styles.emptyText}>
                  We couldn't find any listings matching your search criteria.
                </Text>
                <TouchableOpacity 
                  style={styles.clearButton} 
                  onPress={() => {
                    setSearchQuery('');
                    handleClearFilters();
                  }}
                >
                  <Text style={styles.clearButtonText}>Clear All</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : (
          <>
            {/* Recent Searches */}
            <View style={styles.recentContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.recentTitle}>Recent Searches</Text>
                {recentSearches.length > 0 && (
                  <TouchableOpacity onPress={handleClearRecentSearches}>
                    <Text style={styles.clearRecent}>Clear</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              {recentSearches.length > 0 ? (
                <View style={styles.recentList}>
                  {recentSearches.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.recentItem}
                      onPress={() => handleRecentSearchSelect(item)}
                    >
                      <Ionicons name="time-outline" size={16} color={COLORS.mediumGray} style={styles.recentIcon} />
                      <Text style={styles.recentText}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={styles.noRecentText}>No recent searches</Text>
              )}
            </View>
            
            {/* Popular Categories */}
            <View style={styles.popularContainer}>
              <Text style={styles.popularTitle}>Popular Categories</Text>
              <View style={styles.popularGrid}>
                {categories.slice(0, 4).map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={styles.popularItem}
                    onPress={() => {
                      handleCategorySelect(category);
                    }}
                  >
                    <View style={styles.popularIcon}>
                      <Ionicons 
                        name={
                          category === 'Electronics' ? 'laptop-outline' :
                          category === 'Textbooks' ? 'book-outline' :
                          category === 'Furniture' ? 'bed-outline' :
                          category === 'Clothing' ? 'shirt-outline' :
                          'grid-outline'
                        } 
                        size={24} 
                        color={COLORS.brightOrange} 
                      />
                    </View>
                    <Text style={styles.popularText}>{category}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}
      </View>
      
      {/* SearchFilters Modal */}
      <SearchFilters
        visible={filtersVisible}
        onClose={() => setFiltersVisible(false)}
        filters={activeFilters}
        onApplyFilters={handleApplyFilters}
        availableCategories={categories}
        availableConditions={conditions}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.mediumBlue,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  searchBarContainer: {
    flex: 1,
  },
  // Filter bar styles
  filterBar: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingLeft: 12,
    paddingRight: 4,
    backgroundColor: COLORS.mediumBlue,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  filterBarContent: {
    flexGrow: 1,
    paddingRight: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  filterChipActive: {
    backgroundColor: 'rgba(255,152,0,0.15)',
    borderColor: COLORS.brightOrange,
  },
  filterIcon: {
    marginRight: 6,
  },
  filterText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  filterTextActive: {
    color: COLORS.brightOrange,
    fontWeight: '500',
  },
  allFiltersButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.brightOrange,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeFiltersBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.mediumBlue,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  activeFiltersText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    flex: 1,
  },
  clearFiltersText: {
    color: COLORS.brightOrange,
    fontSize: 13,
    marginLeft: 16,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.mediumBlue,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.white,
  },
  clearFilters: {
    fontSize: 14,
    color: COLORS.brightOrange,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: COLORS.white,
    marginTop: 12,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    maxWidth: '80%',
  },
  clearButton: {
    backgroundColor: COLORS.lightBlue,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  clearButtonText: {
    color: COLORS.white,
    fontWeight: '500',
  },
  recentContainer: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: COLORS.white,
  },
  clearRecent: {
    color: COLORS.brightOrange,
    fontSize: 14,
  },
  recentList: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 8,
    overflow: 'hidden',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  recentIcon: {
    marginRight: 12,
  },
  recentText: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  noRecentText: {
    color: COLORS.textSecondary,
    padding: 16,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 8,
    fontStyle: 'italic',
  },
  popularContainer: {
    padding: 16,
    paddingTop: 8,
  },
  popularTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: COLORS.white,
    marginBottom: 12,
  },
  popularGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  popularItem: {
    width: '50%',
    padding: 8,
  },
  popularIcon: {
    width: '100%',
    aspectRatio: 2,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  popularText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
});