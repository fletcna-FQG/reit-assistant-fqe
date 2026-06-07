export type PropertyMapViewProps = {
  lat: number;
  lon: number;
  label?: string;
  interactive?: boolean;
  draggablePin?: boolean;
  onCoordinateChange?: (lat: number, lon: number) => void;
  onMapPress?: (lat: number, lon: number) => void;
};
