import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useTheme, Text } from 'react-native-paper';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: colors.outline,
          height: 65, // Taller for pills + labels
          paddingBottom: 8,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.secondary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              focused={focused}
              icon={focused ? "home" : "home-outline"}
              color={color}
              library="Ionicons"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              focused={focused}
              icon={focused ? "magnify" : "magnify"}
              color={color}
              library="MaterialCommunityIcons"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="create-listing"
        options={{
          title: 'Sell',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{
              width: 48,
              height: 32,
              borderRadius: 16,
              backgroundColor: focused ? colors.primaryContainer : 'transparent',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Ionicons name="add-circle" size={28} color={focused ? colors.primary : colors.secondary} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Inbox',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              focused={focused}
              icon={focused ? "chatbubble-ellipses" : "chatbubble-ellipses-outline"}
              color={color}
              library="Ionicons"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              focused={focused}
              icon={focused ? "person" : "person-outline"}
              color={color}
              library="Ionicons"
            />
          ),
        }}
      />
    </Tabs>
  );
}

// Custom Icon Component to handle the pill shape logic
function TabIcon({ focused, icon, color, library }) {
  const { colors } = useTheme();
  const IconLib = library === 'MaterialCommunityIcons' ? MaterialCommunityIcons : Ionicons;

  return (
    <View style={{
      alignItems: 'center',
      justifyContent: 'center',
      width: 50,
      height: 30,
      borderRadius: 15, // Pill shape
      backgroundColor: focused ? colors.primaryContainer : 'transparent',
    }}>
      <IconLib name={icon} size={22} color={color} />
    </View>
  );
}