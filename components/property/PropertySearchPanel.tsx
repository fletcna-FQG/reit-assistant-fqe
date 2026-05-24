import { PropertyMapView } from '@/components/property/PropertyMapView';
import { PropertyTypePicker } from '@/components/analyzer/PropertySearchOptions';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { type PropertyType } from '@/constants/propertyTypes';
import { colors } from '@/constants/theme';
import { useDebouncedGeocodeSearch } from '@/hooks/useDebouncedGeocodeSearch';
import { geocodeApi, getApiErrorMessage, propertyApi } from '@/services/api';
import type { AttomMarketSnapshot } from '@/types/attom';
import type { GeocodeSearchResult, SelectedPropertyLocation } from '@/types/geocode';
import { addRecentGeocodeSearch, getRecentGeocodeSearches } from '@/utils/recentGeocodeStorage';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

type PropertySearchPanelProps = {
  propertyType: PropertyType;
  onPropertyTypeChange: (type: PropertyType) => void;
  onLocationVerified: (
    location: SelectedPropertyLocation,
    message: string,
    attomData?: AttomMarketSnapshot | null,
  ) => void;
  onManualEntry: () => void;
  onError?: (message: string) => void;
};

function toSelectedLocation(result: GeocodeSearchResult): SelectedPropertyLocation {
  return {
    ...result.address,
    lat: result.lat,
    lon: result.lon,
    display_name: result.display_name,
    osm_id: result.osm_id,
    osm_type: result.osm_type,
  };
}

function formatLocationLine(location: SelectedPropertyLocation): string {
  const parts = [location.address, location.city, location.state, location.zip].filter(Boolean);
  return parts.join(', ');
}

export function PropertySearchPanel({
  propertyType,
  onPropertyTypeChange,
  onLocationVerified,
  onManualEntry,
  onError,
}: PropertySearchPanelProps) {
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<SelectedPropertyLocation[]>([]);
  const [selected, setSelected] = useState<SelectedPropertyLocation | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [sheetMessage, setSheetMessage] = useState<string | null>(null);
  const [placeDetailsLabel, setPlaceDetailsLabel] = useState<string | null>(null);

  const { results, isSearching, error, minQueryLength } = useDebouncedGeocodeSearch(query);

  useEffect(() => {
    void getRecentGeocodeSearches().then(setRecent);
  }, []);

  const reverseGeocodeAt = async (lat: number, lon: number) => {
    setIsReverseGeocoding(true);
    try {
      const reversed = await geocodeApi.reverse(lat, lon);
      const location: SelectedPropertyLocation = {
        ...reversed.address,
        lat: reversed.lat,
        lon: reversed.lon,
        display_name: reversed.display_name,
        osm_id: reversed.osm_id,
        osm_type: reversed.osm_type,
      };
      setSelected(location);
      setQuery(location.display_name);
      await addRecentGeocodeSearch(location);
      setRecent(await getRecentGeocodeSearches());
    } catch (err) {
      onError?.(getApiErrorMessage(err, 'Could not reverse geocode this location'));
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  const handleSelectResult = async (result: GeocodeSearchResult) => {
    const location = toSelectedLocation(result);
    setSelected(location);
    setQuery(formatLocationLine(location));
    await addRecentGeocodeSearch(location);
    setRecent(await getRecentGeocodeSearches());

    if (result.osm_id && result.osm_type) {
      try {
        const details = await geocodeApi.details(result.osm_type, result.osm_id);
        setPlaceDetailsLabel(
          [details.details.category, details.details.type].filter(Boolean).join(' · ') || null,
        );
      } catch {
        setPlaceDetailsLabel(null);
      }
    }
  };

  const handleSelectRecent = (location: SelectedPropertyLocation) => {
    setSelected(location);
    setQuery(location.display_name || formatLocationLine(location));
    setPlaceDetailsLabel(null);
  };

  const handleMapPress = (lat: number, lon: number) => {
    setSelected((prev) =>
      prev
        ? { ...prev, lat, lon }
        : {
            address: '',
            city: '',
            state: '',
            zip: '',
            lat,
            lon,
            display_name: `${lat.toFixed(5)}, ${lon.toFixed(5)}`,
          },
    );
    void reverseGeocodeAt(lat, lon);
  };

  const handlePinMove = (lat: number, lon: number) => {
    setSelected((prev) => (prev ? { ...prev, lat, lon } : prev));
    void reverseGeocodeAt(lat, lon);
  };

  const handleAnalyze = async () => {
    if (!selected) {
      onError?.('Select an address from search results or recent searches.');
      return;
    }

    if (!selected.address.trim() || !selected.city.trim() || !selected.state.trim() || !selected.zip.trim()) {
      onError?.('Selected address is incomplete. Try another result or enter manually.');
      return;
    }

    setIsVerifying(true);
    setSheetMessage(null);
    try {
      const searchResult = await propertyApi.searchProperty({
        address: selected.address.trim(),
        city: selected.city.trim(),
        state: selected.state.trim(),
        zip: selected.zip.trim(),
        lat: selected.lat,
        lon: selected.lon,
      });
      setSheetMessage(searchResult.message);
      onLocationVerified(selected, searchResult.message, searchResult.attom_data);
    } catch (err) {
      onError?.(getApiErrorMessage(err, 'Could not verify property location'));
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <View>
      <Text className="mb-md text-body-small text-text-secondary">
        Search with free OpenStreetMap geocoding first — paid ATTOM market data runs only after you
        confirm a location.
      </Text>

      <PropertyTypePicker value={propertyType} onChange={onPropertyTypeChange} />

      <Text className="mb-1 text-body-small font-semibold text-text-primary">
        Search address or drop a pin <Text className="text-alert-red">*</Text>
      </Text>
      <View className="mb-sm rounded-sm border-2 bg-white px-md" style={{ borderColor: colors.mediumGray }}>
        <TextInput
          className="text-body text-text-primary"
          style={{ height: 48 }}
          placeholder="Search address or drop a pin..."
          placeholderTextColor={colors.darkGray}
          value={query}
          onChangeText={(value) => {
            setQuery(value);
            setSelected(null);
            setSheetMessage(null);
            setPlaceDetailsLabel(null);
          }}
          autoCorrect={false}
          autoCapitalize="words"
        />
      </View>

      {isSearching ? (
        <View className="mb-sm flex-row items-center gap-2">
          <ActivityIndicator color={colors.navy} size="small" />
          <Text className="text-caption text-text-secondary">Searching addresses…</Text>
        </View>
      ) : null}

      {error ? <Text className="mb-sm text-caption text-alert-red">{error}</Text> : null}

      {query.trim().length >= minQueryLength && results.length > 0 && !selected ? (
        <View className="mb-md overflow-hidden rounded-md border border-medium-gray bg-white">
          {results.map((result) => (
            <Pressable
              key={`${result.osm_type}-${result.osm_id}`}
              onPress={() => void handleSelectResult(result)}
              className="border-b border-medium-gray px-md py-3"
            >
              <Text className="text-body-small text-text-primary">{result.display_name}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {selected ? (
        <View className="mb-md">
          <PropertyMapView
            lat={selected.lat}
            lon={selected.lon}
            label={formatLocationLine(selected)}
            interactive
            draggablePin
            onMapPress={handleMapPress}
            onCoordinateChange={handlePinMove}
          />
          {isReverseGeocoding ? (
            <Text className="mt-1 text-caption text-text-secondary">Updating pin location…</Text>
          ) : null}
          {placeDetailsLabel ? (
            <Text className="mt-1 text-caption text-text-secondary">Place details: {placeDetailsLabel}</Text>
          ) : null}
        </View>
      ) : (
        <View className="mb-md">
          <PropertyMapView
            lat={39.8283}
            lon={-98.5795}
            label="Tap the map to drop a pin"
            interactive
            draggablePin={false}
            onMapPress={handleMapPress}
          />
          <Text className="mt-1 text-caption text-text-secondary">
            Or search above, then drag the pin to refine the address.
          </Text>
        </View>
      )}

      {recent.length > 0 ? (
        <View className="mb-md">
          <Text className="mb-2 text-body-small font-semibold text-text-primary">Recent searches</Text>
          {recent.map((item) => (
            <Pressable
              key={`${item.display_name}-${item.lat}`}
              onPress={() => handleSelectRecent(item)}
              className="mb-1 rounded-sm bg-white px-md py-2"
            >
              <Text className="text-body-small text-text-primary" numberOfLines={2}>
                {item.display_name || formatLocationLine(item)}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View className="my-sm items-center">
        <Text className="text-caption text-text-secondary">— OR —</Text>
      </View>

      <PrimaryButton title="+ Enter Manually" variant="secondary" onPress={onManualEntry} />

      {selected ? (
        <View
          className="mt-md rounded-md border-2 bg-white p-md"
          style={{ borderColor: colors.navy }}
        >
          <Text className="mb-1 text-body-small font-semibold text-navy">
            {formatLocationLine(selected)}
          </Text>
          {sheetMessage ? (
            <Text className="mb-md text-body-small text-text-secondary">{sheetMessage}</Text>
          ) : (
            <Text className="mb-md text-body-small text-text-secondary">
              Fetch market data after Nominatim confirms this location. ATTOM runs only when you
              analyze.
            </Text>
          )}
          <PrimaryButton
            title="Analyze Property →"
            onPress={() => void handleAnalyze()}
            loading={isVerifying}
          />
        </View>
      ) : null}
    </View>
  );
}
