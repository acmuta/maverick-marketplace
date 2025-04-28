import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Define theme colors
const COLORS = {
  darkBlue: '#0A1929',
  mediumBlue: '#0F2942',
  orange: '#FF6F00',
  brightOrange: '#FF9800',
  white: '#FFFFFF',
  inactive: '#546E7A',
};

// Custom tab bar component to make it floating
function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={styles.container}>
      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom - 15, 5) }]}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          
          // Determine the icon to use based on the route name
          let iconName;
          if (route.name === 'index') {
            iconName = isFocused ? 'home' : 'home-outline';
          } else if (route.name === 'chat') {
            iconName = isFocused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'create-listing') {
            iconName = isFocused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'profile') {
            iconName = isFocused ? 'person' : 'person-outline';
          }
          
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };
          
          return (
            <View 
              key={index} 
              style={[
                styles.tabItem,
                isFocused && styles.activeTabItem
              ]}
            >
              <Ionicons
                name={iconName}
                size={route.name === 'create-listing' ? 28 : 24}
                color={isFocused ? COLORS.brightOrange : COLORS.inactive}
                onPress={onPress}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          display: 'none', // Hide the default tab bar
        },
      }}
      tabBar={props => <CustomTabBar {...props} />}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Messages',
        }}
      />
      <Tabs.Screen
        name="create-listing"
        options={{
          title: 'Create',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 25,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.mediumBlue,
    borderRadius: 25,
    height: 60,
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  tabItem: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
  },
  activeTabItem: {
    backgroundColor: 'rgba(255,152,0,0.15)',
    borderRadius: 20,
    // paddingVertical: 8,
    // paddingHorizontal: 16,
  }
});