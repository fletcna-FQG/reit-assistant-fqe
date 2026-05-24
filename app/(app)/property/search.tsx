import { PropertySearchPanel } from '@/components/property/PropertySearchPanel';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { type PropertyType } from '@/constants/propertyTypes';
import { layout } from '@/constants/theme';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { SelectedPropertyLocation } from '@/types/geocode';

/** Dedicated property search entry — Nominatim first, ATTOM later. */
export default function PropertySearchScreen() {
  const [propertyType, setPropertyType] = useState<PropertyType>('Homes');

  const handleVerified = (location: SelectedPropertyLocation) => {
    router.push({
      pathname: '/(app)/(tabs)/analyze',
      params: {
        mode: 'automated',
        propertyType,
        address: location.address,
        city: location.city,
        state: location.state,
        zip: location.zip,
        lat: String(location.lat),
        lon: String(location.lon),
      },
    });
  };

  return (
    <View className="flex-1 bg-light-gray">
      <ScreenHeader title="Property Search" />
      <ScrollView
        className="flex-1 px-md pt-md"
        contentContainerStyle={{ paddingBottom: layout.bottomNavHeight + 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <PropertySearchPanel
          propertyType={propertyType}
          onPropertyTypeChange={setPropertyType}
          onLocationVerified={(location, _message, _attom) => handleVerified(location)}
          onManualEntry={() =>
            router.push({
              pathname: '/(app)/(tabs)/analyze',
              params: { mode: 'manual', propertyType },
            })
          }
        />
      </ScrollView>
    </View>
  );
}
