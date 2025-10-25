import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function InventoryScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Inventory</Text>
        <Text style={styles.subtitle}>Your collected items</Text>
        
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Inventory system coming soon...</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 24,
  },
  placeholder: {
    backgroundColor: '#1F2937',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#374151',
    borderStyle: 'dashed',
  },
  placeholderText: {
    color: '#6B7280',
    fontSize: 16,
  },
});