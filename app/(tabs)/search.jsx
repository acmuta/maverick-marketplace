import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';

import SearchBar from '../components/SearchBar';
import ListingGrid from '../components/ListingGrid';
import SearchFilters from '../components/SearchFilters';
import * as SearchUtils from '../utils/searchUtils';

export default function SearchScreen() {
  const { query } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

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
      const searchResults = await SearchUtils.searchListings({
        query: searchQuery,
        category: activeFilters.category,
        minPrice: activeFilters.minPrice,
        maxPrice: activeFilters.maxPrice,
        condition: activeFilters.condition,
        sortBy: activeFilters.sortBy
      });

      setResults(searchResults);

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
    setActiveFilters(prev => ({ ...prev, category }));
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
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.outline }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
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
      <View style={[styles.filterBar, { backgroundColor: colors.background, borderBottomColor: colors.outline }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterBarContent}
        >
          {/* Category Filter */}
          <TouchableOpacity
            style={[
              styles.filterChip,
              { borderColor: colors.outline, backgroundColor: colors.surface },
              activeFilters.category !== 'All' && { backgroundColor: colors.primaryContainer, borderColor: colors.primary }
            ]}
            onPress={() => setFiltersVisible(true)}
          >
            <Ionicons
              name="apps-outline"
              size={18}
              color={activeFilters.category !== 'All' ? colors.primary : colors.secondary}
              style={styles.filterIcon}
            />
            <Text
              style={[
                styles.filterText,
                { color: colors.onSurface },
                activeFilters.category !== 'All' && { color: colors.primary, fontWeight: '600' }
              ]}
            >
              {activeFilters.category === 'All' ? 'Category' : activeFilters.category}
            </Text>
          </TouchableOpacity>

          {/* Price Filter */}
          <TouchableOpacity
            style={[
              styles.filterChip,
              { borderColor: colors.outline, backgroundColor: colors.surface },
              (activeFilters.minPrice !== null || activeFilters.maxPrice !== null) && { backgroundColor: colors.primaryContainer, borderColor: colors.primary }
            ]}
            onPress={() => setFiltersVisible(true)}
          >
            <Ionicons
              name="cash-outline"
              size={18}
              color={(activeFilters.minPrice !== null || activeFilters.maxPrice !== null) ? colors.primary : colors.secondary}
              style={styles.filterIcon}
            />
            <Text
              style={[
                styles.filterText,
                { color: colors.onSurface },
                (activeFilters.minPrice !== null || activeFilters.maxPrice !== null) && { color: colors.primary, fontWeight: '600' }
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
              { borderColor: colors.outline, backgroundColor: colors.surface },
              activeFilters.condition !== 'All' && { backgroundColor: colors.primaryContainer, borderColor: colors.primary }
            ]}
            onPress={() => setFiltersVisible(true)}
          >
            <Ionicons
              name="star-outline"
              size={18}
              color={activeFilters.condition !== 'All' ? colors.primary : colors.secondary}
              style={styles.filterIcon}
            />
            <Text
              style={[
                styles.filterText,
                { color: colors.onSurface },
                activeFilters.condition !== 'All' && { color: colors.primary, fontWeight: '600' }
              ]}
            >
              {activeFilters.condition === 'All' ? 'Condition' : activeFilters.condition}
            </Text>
          </TouchableOpacity>

          {/* Sort Filter */}
          <TouchableOpacity
            style={[
              styles.filterChip,
              { borderColor: colors.outline, backgroundColor: colors.surface },
              activeFilters.sortBy !== 'recent' && { backgroundColor: colors.primaryContainer, borderColor: colors.primary }
            ]}
            onPress={() => setFiltersVisible(true)}
          >
            <Ionicons
              name="options-outline"
              size={18}
              color={activeFilters.sortBy !== 'recent' ? colors.primary : colors.secondary}
              style={styles.filterIcon}
            />
            <Text
              style={[
                styles.filterText,
                { color: colors.onSurface },
                activeFilters.sortBy !== 'recent' && { color: colors.primary, fontWeight: '600' }
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
          style={[styles.allFiltersButton, { backgroundColor: colors.primary }]}
          onPress={() => setFiltersVisible(true)}
        >
          <Ionicons name="filter" size={18} color="white" />
        </TouchableOpacity>
      </View>

      {/* Active Filters Summary */}
      {(activeFilters.category !== 'All' ||
        activeFilters.condition !== 'All' ||
        activeFilters.minPrice !== null ||
        activeFilters.maxPrice !== null ||
        activeFilters.sortBy !== 'recent') && (
          <View style={[styles.activeFiltersBar, { backgroundColor: colors.background, borderBottomColor: colors.outline }]}>
            <Text style={[styles.activeFiltersText, { color: colors.secondary }]}>
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
              <Text style={[styles.clearFiltersText, { color: colors.primary }]}>Clear All</Text>
            </TouchableOpacity>
          </View>
        )}

      {/* Main Content */}
      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.secondary }]}>Searching...</Text>
          </View>
        ) : searchQuery ||
          activeFilters.category !== 'All' ||
          activeFilters.condition !== 'All' ||
          activeFilters.minPrice !== null ||
          activeFilters.maxPrice !== null ? (
          <>
            {/* Search Results */}
            <View style={[styles.resultsHeader, { backgroundColor: colors.background }]}>
              <Text style={[styles.resultsTitle, { color: colors.onSurface }]}>
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
                <Ionicons name="search-outline" size={60} color={colors.outline} />
                <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>No listings found</Text>
                <Text style={[styles.emptyText, { color: colors.secondary }]}>
                  We couldn't find any listings matching your search criteria.
                </Text>
                <TouchableOpacity
                  style={[styles.clearButton, { backgroundColor: colors.primary }]}
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
                <Text style={[styles.recentTitle, { color: colors.onSurface }]}>Recent Searches</Text>
                {recentSearches.length > 0 && (
                  <TouchableOpacity onPress={handleClearRecentSearches}>
                    <Text style={[styles.clearRecent, { color: colors.primary }]}>Clear</Text>
                  </TouchableOpacity>
                )}
              </View>

              {recentSearches.length > 0 ? (
                <View style={[styles.recentList, { backgroundColor: colors.surface }]}>
                  {recentSearches.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.recentItem, { borderBottomColor: colors.outline }]}
                      onPress={() => handleRecentSearchSelect(item)}
                    >
                      <Ionicons name="time-outline" size={16} color={colors.secondary} style={styles.recentIcon} />
                      <Text style={[styles.recentText, { color: colors.onSurface }]}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={[styles.noRecentText, { color: colors.secondary, backgroundColor: colors.surface }]}>No recent searches</Text>
              )}
            </View>

            {/* Popular Categories */}
            <View style={styles.popularContainer}>
              <Text style={[styles.popularTitle, { color: colors.onSurface }]}>Popular Categories</Text>
              <View style={styles.popularGrid}>
                {categories.slice(0, 4).map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={styles.popularItem}
                    onPress={() => {
                      handleCategorySelect(category);
                    }}
                  >
                    <View style={[styles.popularIcon, { backgroundColor: colors.surface }]}>
                      <Ionicons
                        name={
                          category === 'Electronics' ? 'laptop-outline' :
                            category === 'Textbooks' ? 'book-outline' :
                              category === 'Furniture' ? 'bed-outline' :
                                category === 'Clothing' ? 'shirt-outline' :
                                  'grid-outline'
                        }
                        size={24}
                        color={colors.primary}
                      />
                    </View>
                    <Text style={[styles.popularText, { color: colors.onSurface }]}>{category}</Text>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
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
    borderBottomWidth: 1,
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
    borderWidth: 1,
  },
  filterIcon: {
    marginRight: 6,
  },
  filterText: {
    fontSize: 14,
  },
  allFiltersButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeFiltersBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  activeFiltersText: {
    fontSize: 13,
    flex: 1,
  },
  clearFiltersText: {
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
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '500',
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
    marginTop: 12,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    maxWidth: '80%',
  },
  clearButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  clearButtonText: {
    color: 'white',
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
  },
  clearRecent: {
    fontSize: 14,
  },
  recentList: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  recentIcon: {
    marginRight: 12,
  },
  recentText: {
    fontSize: 14,
  },
  noRecentText: {
    padding: 16,
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
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  popularText: {
    fontSize: 14,
    textAlign: 'center',
  },
});