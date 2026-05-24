import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { router } from 'expo-router';
import { propertyApi, getApiErrorMessage, type PropertyRecord } from '../services/api';
import { useAuthStore } from '../store/authStore';

function formatCurrency(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return '—';
  return `$${Math.round(value).toLocaleString()}`;
}

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadProperties = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const data = await propertyApi.getProperties();
      setProperties(data.properties ?? []);
    } catch (err) {
      Alert.alert('Error', getApiErrorMessage(err, 'Failed to load properties'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProperties();
    }, [loadProperties]),
  );

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const renderProperty = ({ item }: { item: PropertyRecord }) => (
    <View style={styles.propertyCard}>
      <Text style={styles.propertyAddress}>{item.address}</Text>
      <Text style={styles.propertyLocation}>
        {item.city}, {item.state} {item.zip}
      </Text>
      <View style={styles.propertyStats}>
        <Text style={styles.propertyStat}>NOI: {formatCurrency(item.noi)}</Text>
        <Text style={styles.propertyStat}>Value: {formatCurrency(item.indicated_value)}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>REIT Assistant</Text>
        <Text style={styles.welcome}>Welcome, {user?.full_name || 'User'}</Text>
        <Text style={styles.info}>Role: {user?.role || 'N/A'}</Text>
      </View>

      <TouchableOpacity
        style={styles.searchButton}
        onPress={() => router.push('/(app)/property-search')}
      >
        <Text style={styles.searchButtonText}>Search Property</Text>
      </TouchableOpacity>

        <Text style={styles.sectionTitle}>Your Properties</Text>
        <Text style={styles.hint}>
          Search → manual financial entry until ATTOM is integrated into the UI.
        </Text>

      <View style={styles.listArea}>
        {isLoading ? (
          <ActivityIndicator color="#22c55e" style={styles.loader} />
        ) : (
          <FlatList
            data={properties}
            keyExtractor={(item) => item.id}
            renderItem={renderProperty}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => loadProperties(true)}
                tintColor="#22c55e"
              />
            }
            ListEmptyComponent={
              <Text style={styles.emptyText}>No properties yet. Add your first property above.</Text>
            }
            contentContainerStyle={properties.length === 0 ? styles.emptyList : styles.listContent}
          />
        )}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 24,
    paddingTop: 56,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  welcome: {
    fontSize: 20,
    color: '#e2e8f0',
    marginBottom: 8,
  },
  info: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  hint: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 12,
  },
  searchButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  listArea: {
    flex: 1,
    minHeight: 120,
  },
  listContent: {
    paddingBottom: 16,
  },
  propertyCard: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  propertyAddress: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  propertyLocation: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 8,
  },
  propertyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  propertyStat: {
    color: '#cbd5e1',
    fontSize: 13,
  },
  loader: {
    marginTop: 24,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
    fontSize: 14,
    paddingVertical: 24,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
