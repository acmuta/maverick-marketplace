import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Searchbar, useTheme } from 'react-native-paper';

export default function SearchBar({ onSearch, placeholder, initialValue = '', inlineStyle = false }) {
  const [searchQuery, setSearchQuery] = React.useState(initialValue);
  const router = useRouter();
  const { colors, roundness } = useTheme();

  const handleSearch = () => {
    if (onSearch) {
      onSearch(searchQuery);
    } else {
      router.push({
        pathname: '/search',
        params: { query: searchQuery }
      });
    }
  };

  const onChangeSearch = query => setSearchQuery(query);

  return (
    <View style={[styles.container, inlineStyle && styles.inlineContainer]}>
      <Searchbar
        placeholder={placeholder || "Search..."}
        onChangeText={onChangeSearch}
        value={searchQuery}
        onSubmitEditing={handleSearch}
        onIconPress={handleSearch}
        style={{
          backgroundColor: colors.secondaryContainer,
          borderRadius: 8,
          height: 48,
          elevation: 0,
        }}
        inputStyle={{
          color: colors.primary,
          fontSize: 16,
          includeFontPadding: false,
        }}
        iconColor={colors.secondary}
        placeholderTextColor={colors.secondary}
        rippleColor="transparent"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  inlineContainer: {
    paddingHorizontal: 0,
    marginVertical: 0,
  },
});