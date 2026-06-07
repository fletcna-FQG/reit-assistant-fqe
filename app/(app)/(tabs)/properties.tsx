import { PropertyCard } from '@/components/property/PropertyCard';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors } from '@/constants/theme';
import { getApiErrorMessage, propertyApi } from '@/services/api';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TextInput, View } from 'react-native';

export default function PropertiesScreen() {
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['properties'],
    queryFn: () => propertyApi.getProperties(),
  });

  const properties = useMemo(() => {
    const list = data?.properties ?? [];
    const query = search.trim().toLowerCase();
    if (!query) return list;
    return list.filter((property) => {
      const haystack = `${property.address} ${property.city} ${property.state} ${property.zip}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [data?.properties, search]);

  return (
    <View className="flex-1 bg-light-gray">
      <ScreenHeader title="Properties" />
      <View className="border-b border-medium-gray bg-white px-md py-sm">
        <TextInput
          className="mb-sm rounded-sm border-2 border-medium-gray bg-white px-md text-body"
          style={{ height: 48 }}
          placeholder="Search by address, city, state..."
          placeholderTextColor={colors.darkGray}
          value={search}
          onChangeText={setSearch}
        />
        <PrimaryButton title="Add Property" onPress={() => router.push('/(app)/(tabs)/analyze')} />
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.navy} className="mt-xl" />
      ) : isError ? (
        <View className="mx-md mt-md rounded-md bg-white p-lg">
          <Text className="text-center text-body-small text-text-secondary">
            {getApiErrorMessage(error, 'Could not load properties. Check that the backend is running.')}
          </Text>
          <Text
            className="mt-2 text-center text-body-small font-semibold text-navy"
            onPress={() => void refetch()}
          >
            Retry
          </Text>
        </View>
      ) : (
        <FlatList
          data={properties}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PropertyCard property={item} />}
          contentContainerClassName="p-md"
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          ListEmptyComponent={
            <View className="rounded-md bg-white p-lg">
              <Text className="text-center text-body-small text-text-secondary">
                {search.trim()
                  ? 'No properties match your search.'
                  : 'No saved properties yet. Use Analyze to add your first property.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
