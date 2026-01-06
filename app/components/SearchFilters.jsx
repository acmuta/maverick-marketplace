import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { Text, useTheme, Chip, Button, IconButton } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

export default function SearchFilters({
  visible,
  onClose,
  filters,
  onApplyFilters,
  availableCategories,
  availableConditions,
}) {
  const { colors } = useTheme();

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
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.outline }]}>
            <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>Search Filters</Text>
            <IconButton icon="close" onPress={onClose} />
          </View>

          <ScrollView style={styles.scrollContent}>
            {/* Category Filter */}
            <View style={styles.filterSection}>
              <Text variant="titleSmall" style={styles.filterLabel}>Category</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipContainer}
              >
                {['All', ...(availableCategories || [])].map((item) => (
                  <Chip
                    key={item}
                    selected={category === item}
                    onPress={() => setCategory(item)}
                    style={styles.chip}
                    showSelectedOverlay
                  >
                    {item}
                  </Chip>
                ))}
              </ScrollView>
            </View>

            {/* Price Range Filter */}
            <View style={styles.filterSection}>
              <Text variant="titleSmall" style={styles.filterLabel}>Price Range</Text>
              <View style={styles.priceInputsContainer}>
                <View style={[styles.priceInputWrapper, { backgroundColor: colors.surfaceVariant }]}>
                  <Text style={[styles.dollarSign, { color: colors.onSurfaceVariant }]}>$</Text>
                  <TextInput
                    style={[styles.priceInput, { color: colors.onSurface }]}
                    placeholder="Min"
                    placeholderTextColor={colors.onSurfaceVariant}
                    value={minPrice}
                    onChangeText={setMinPrice}
                    keyboardType="numeric"
                    selectTextOnFocus
                  />
                </View>
                <Text style={{ marginHorizontal: 12, color: colors.onSurfaceVariant }}>to</Text>
                <View style={[styles.priceInputWrapper, { backgroundColor: colors.surfaceVariant }]}>
                  <Text style={[styles.dollarSign, { color: colors.onSurfaceVariant }]}>$</Text>
                  <TextInput
                    style={[styles.priceInput, { color: colors.onSurface }]}
                    placeholder="Max"
                    placeholderTextColor={colors.onSurfaceVariant}
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
              <Text variant="titleSmall" style={styles.filterLabel}>Condition</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipContainer}
              >
                {['All', ...(availableConditions || [])].map((item) => (
                  <Chip
                    key={item}
                    selected={condition === item}
                    onPress={() => setCondition(item)}
                    style={styles.chip}
                    showSelectedOverlay
                  >
                    {item}
                  </Chip>
                ))}
              </ScrollView>
            </View>

            {/* Sort Options */}
            <View style={styles.filterSection}>
              <Text variant="titleSmall" style={styles.filterLabel}>Sort By</Text>
              <View style={styles.chipContainer}>
                {[
                  { label: 'Most Recent', value: 'recent' },
                  { label: 'Price: Low to High', value: 'priceAsc' },
                  { label: 'Price: High to Low', value: 'priceDesc' }
                ].map((option) => (
                  <Chip
                    key={option.value}
                    selected={sortBy === option.value}
                    onPress={() => setSortBy(option.value)}
                    style={styles.chip}
                    showSelectedOverlay
                  >
                    {option.label}
                  </Chip>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={[styles.actionButtons, { borderTopColor: colors.outline }]}>
            <Button
              mode="outlined"
              onPress={handleReset}
              style={{ flex: 1, marginRight: 8 }}
            >
              Reset
            </Button>
            <Button
              mode="contained"
              onPress={handleApply}
              style={{ flex: 2 }}
            >
              Apply Filters
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  scrollContent: {
    maxHeight: '80%',
  },
  filterSection: {
    padding: 16,
  },
  filterLabel: {
    marginBottom: 12,
  },
  chipContainer: {
    paddingBottom: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  priceInputsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceInputWrapper: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  dollarSign: {
    marginRight: 4,
    fontSize: 16,
    fontWeight: 'bold',
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
  },
});