import { View, Text, StyleSheet } from 'react-native';

export default function MessagingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Messages</Text>
      {/* Add your messaging content here */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});