import { Text, View } from 'react-native';

type PropertyMapViewProps = {
  lat: number;
  lon: number;
  label?: string;
  interactive?: boolean;
  draggablePin?: boolean;
  onCoordinateChange?: (lat: number, lon: number) => void;
  onMapPress?: (lat: number, lon: number) => void;
};

function WebMapEmbed({ lat, lon }: { lat: number; lon: number }) {
  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.01}%2C${lat - 0.01}%2C${lon + 0.01}%2C${lat + 0.01}&layer=mapnik&marker=${lat}%2C${lon}`;
  return (
    <iframe
      title="Property map"
      src={osmEmbedUrl}
      style={{ width: '100%', height: 260, border: 0 }}
      loading="lazy"
    />
  );
}

export function PropertyMapView({ lat, lon }: PropertyMapViewProps) {
  return (
    <View className="overflow-hidden rounded-md border-2 border-medium-gray bg-white">
      <WebMapEmbed lat={lat} lon={lon} />
      <Text className="px-2 py-1 text-micro text-text-secondary">© OpenStreetMap contributors</Text>
    </View>
  );
}
