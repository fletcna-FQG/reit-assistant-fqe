import { DealCard } from '@/components/DealCard';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { DEAL_PROPERTY_FILTERS } from '@/constants/deals';
import { colors } from '@/constants/theme';
import { getDeals } from '@/services/api';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

export default function DealsScreen() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('All');

  const { data: deals = [], isLoading } = useQuery({
    queryKey: ['deals', search, filter],
    queryFn: () => getDeals(search, filter),
  });

  return (
    <View className="flex-1 bg-light-gray">
      <ScreenHeader title="Deals" />
      <View className="border-b border-medium-gray bg-white px-md py-sm">
        <TextInput
          className="mb-sm rounded-sm border-2 border-medium-gray bg-white px-md text-body"
          style={{ height: 48 }}
          placeholder="Search deals by address, city..."
          placeholderTextColor={colors.darkGray}
          value={search}
          onChangeText={setSearch}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 pb-1">
          {DEAL_PROPERTY_FILTERS.map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              className="rounded-full px-3 py-1.5"
              style={{
                backgroundColor: filter === f ? colors.navy : colors.lightGray,
              }}
            >
              <Text
                className="text-caption font-semibold"
                style={{ color: filter === f ? colors.white : colors.textPrimary }}
              >
                {f}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      {isLoading ? (
        <ActivityIndicator color={colors.navy} className="mt-xl" />
      ) : (
        <FlatList
          data={deals}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <DealCard deal={item} />}
          contentContainerClassName="p-md"
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          ListEmptyComponent={
            <Text className="text-center text-body-small text-text-secondary">
              No deals match this property type filter.
            </Text>
          }
        />
      )}
    </View>
  );
}
