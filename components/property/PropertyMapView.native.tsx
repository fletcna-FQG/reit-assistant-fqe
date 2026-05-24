import { Text, View } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import { useMemo } from 'react';

type PropertyMapViewProps = {
  lat: number;
  lon: number;
  label?: string;
  interactive?: boolean;
  draggablePin?: boolean;
  onCoordinateChange?: (lat: number, lon: number) => void;
  onMapPress?: (lat: number, lon: number) => void;
};

const OSM_TILE = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

export function PropertyMapView({
  lat,
  lon,
  label,
  interactive = true,
  draggablePin = true,
  onCoordinateChange,
  onMapPress,
}: PropertyMapViewProps) {
  const region = useMemo(
    () => ({
      latitude: lat,
      longitude: lon,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }),
    [lat, lon],
  );

  return (
    <View className="overflow-hidden rounded-md border-2 border-medium-gray bg-white">
      <MapView
        style={{ width: '100%', height: 260 }}
        initialRegion={region}
        region={region}
        onPress={
          interactive && onMapPress
            ? (event: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => {
                onMapPress(event.nativeEvent.coordinate.latitude, event.nativeEvent.coordinate.longitude);
              }
            : undefined
        }
      >
        <UrlTile urlTemplate={OSM_TILE} maximumZ={19} zIndex={-1} />
        <Marker
          coordinate={{ latitude: lat, longitude: lon }}
          title={label ?? 'Selected property'}
          draggable={interactive && draggablePin}
          onDragEnd={(event: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => {
            onCoordinateChange?.(
              event.nativeEvent.coordinate.latitude,
              event.nativeEvent.coordinate.longitude,
            );
          }}
        />
      </MapView>
      <Text className="px-2 py-1 text-micro text-text-secondary">© OpenStreetMap contributors</Text>
      {interactive ? (
        <Text className="px-2 pb-2 text-micro text-text-secondary">
          Tap the map to move the pin, or drag the pin to refine the address.
        </Text>
      ) : null}
    </View>
  );
}
