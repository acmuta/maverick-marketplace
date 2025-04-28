import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Pressable,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Define consistent theme colors
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

export default function SearchFilters({
  visible,
  onClose,
  filters,
  onApplyFilters,
  availableCategories,
  availableConditions,
}) {
  // Initialize state with current filters
  const [category, setCategory] = useState(filters?.category || 'All');
  const [minPrice, setMinPrice] = useState(
    filters?.minPrice !== null ? filters.minPrice.toString() : ''
  );
  const [maxPrice, setMaxPrice] = useState(
    filters?.maxPrice !== null ? filters.maxPrice.toString() : ''
  );
  const [condition, setCondition] = useState(filters?.condition || 'All');
  const [sortBy, setSortBy] = useState(filters?.sortBy || 'recent');

  // Apply filters and close modal
  const handleApply = () => {
    onApplyFilters({
      category,
      minPrice: minPrice !== '' ? parseFloat(minPrice) : null,
      maxPrice: maxPrice !== '' ? parseFloat(maxPrice) : null,
      condition,
      sortBy,
    });
    onClose();
  };

  // Reset filters to default values
  const handleReset = () => {
    setCategory('All');
    setMinPrice('');
    setMaxPrice('');
    setCondition('All');
    setSortBy('recent');
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Search Filters</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent}>
            {/* Category Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Category</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryChips}
              >
                {['All', ...(availableCategories || [])].map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.categoryChip,
                      category === item && styles.categoryChipActive,
                    ]}
                    onPress={() => setCategory(item)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        category === item && styles.categoryChipTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Price Range Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Price Range</Text>
              <View style={styles.priceInputsContainer}>
                <View style={styles.priceInputWrapper}>
                  <Text style={styles.dollarSign}>$</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="Min"
                    placeholderTextColor={COLORS.mediumGray}
                    value={minPrice}
                    onChangeText={setMinPrice}
                    keyboardType="numeric"
                    selectTextOnFocus
                  />
                </View>
                <Text style={styles.priceSeparator}>to</Text>
                <View style={styles.priceInputWrapper}>
                  <Text style={styles.dollarSign}>$</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="Max"
                    placeholderTextColor={COLORS.mediumGray}
                    value={maxPrice}
                    onChangeText={setMaxPrice}
                    keyboardType="numeric"
                    selectTextOnFocus
                  />
                </View>
              </View>
            </View>

            {/* Condition Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Condition</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryChips}
              >
                {['All', ...(availableConditions || [])].map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.categoryChip,
                      condition === item && styles.categoryChipActive,
                    ]}
                    onPress={() => setCondition(item)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        condition === item && styles.categoryChipTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Sort Options */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Sort By</Text>
              <View style={styles.sortOptions}>
                <TouchableOpacity
                  style={[
                    styles.sortOption,
                    sortBy === 'recent' && styles.sortOptionActive,
                  ]}
                  onPress={() => setSortBy('recent')}
                >
                  <Text
                    style={[
                      styles.sortOptionText,
                      sortBy === 'recent' && styles.sortOptionTextActive,
                    ]}
                  >
                    Most Recent
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sortOption,
                    sortBy === 'priceAsc' && styles.sortOptionActive,
                  ]}
                  onPress={() => setSortBy('priceAsc')}
                >
                  <Text
                    style={[
                      styles.sortOptionText,
                      sortBy === 'priceAsc' && styles.sortOptionTextActive,
                    ]}
                  >
                    Price: Low to High
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sortOption,
                    sortBy === 'priceDesc' && styles.sortOptionActive,
                  ]}
                  onPress={() => setSortBy('priceDesc')}
                >
                  <Text
                    style={[
                      styles.sortOptionText,
                      sortBy === 'priceDesc' && styles.sortOptionTextActive,
                    ]}
                  >
                    Price: High to Low
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    maxHeight: '70%',
  },
  filterSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.white,
    marginBottom: 12,
  },
  categoryChips: {
    paddingBottom: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  categoryChipActive: {
    backgroundColor: COLORS.brightOrange,
    borderColor: COLORS.brightOrange,
  },
  categoryChipText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  categoryChipTextActive: {
    color: COLORS.white,
    fontWeight: '500',
  },
  priceInputsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceInputWrapper: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  dollarSign: {
    color: COLORS.mediumGray,
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    color: COLORS.white,
    fontSize: 16,
  },
  priceSeparator: {
    paddingHorizontal: 12,
    color: COLORS.mediumGray,
  },
  sortOptions: {
    flexDirection: 'column',
  },
  sortOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sortOptionActive: {
    backgroundColor: 'rgba(255,152,0,0.2)',
    borderColor: COLORS.brightOrange,
  },
  sortOptionText: {
    color: COLORS.textPrimary,
    fontSize: 14,
  },
  sortOptionTextActive: {
    color: COLORS.brightOrange,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    marginTop: 8,
  },
  resetButton: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginRight: 12,
  },
  resetButtonText: {
    fontSize: 16,
    color: COLORS.mediumGray,
  },
  applyButton: {
    flex: 2,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: COLORS.brightOrange,
  },
  applyButtonText: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: 'bold',
  },
});