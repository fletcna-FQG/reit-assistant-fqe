import { PROPERTY_TYPES, type PropertyEntryMode, type PropertyType } from '@/constants/propertyTypes';
import { colors } from '@/constants/theme';
import { lightHaptic } from '@/utils/lightHaptic';
import { Pressable, Text, View } from 'react-native';

type DataSourceActionButtonsProps = {
  value: PropertyEntryMode;
  onChange: (mode: PropertyEntryMode) => void;
};

export function DataSourceActionButtons({ value, onChange }: DataSourceActionButtonsProps) {
  return (
    <View className="mb-md">
      <Text className="mb-2 text-body-small font-semibold text-text-primary">
        Data source <Text className="text-alert-red">*</Text>
      </Text>
      <View className="gap-2">
        <DataSourceButton
          label="Manual entry"
          hint="Enter property and financial data yourself"
          icon="✎"
          selected={value === 'manual'}
          onPress={() => onChange('manual')}
        />
        <DataSourceButton
          label="Automated search"
          hint="Validate address via property search (ATTOM / integrations)"
          icon="⌕"
          selected={value === 'automated'}
          onPress={() => onChange('automated')}
        />
      </View>
    </View>
  );
}

/** @deprecated Use DataSourceActionButtons */
export const EntryModeSelector = DataSourceActionButtons;

function DataSourceButton({
  label,
  hint,
  icon,
  selected,
  onPress,
}: {
  label: string;
  hint: string;
  icon: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      // @ts-expect-error web hover title
      title={label}
      onPress={() => {
        lightHaptic();
        onPress();
      }}
      className="flex-row items-center rounded-sm border-2 px-md py-3"
      style={{
        borderColor: selected ? colors.navy : colors.mediumGray,
        backgroundColor: selected ? colors.navy : colors.white,
        minHeight: 56,
      }}
    >
      <Text
        className="mr-3 text-xl"
        style={{ color: selected ? colors.white : colors.navy }}
        accessibilityElementsHidden
      >
        {icon}
      </Text>
      <View className="flex-1">
        <Text
          className="text-body-small font-bold"
          style={{ color: selected ? colors.white : colors.textPrimary }}
        >
          {label}
        </Text>
        <Text
          className="mt-0.5 text-micro"
          style={{ color: selected ? `${colors.white}CC` : colors.textSecondary }}
        >
          {hint}
        </Text>
      </View>
    </Pressable>
  );
}

type PropertyTypePickerProps = {
  value: PropertyType;
  onChange: (type: PropertyType) => void;
};

export function PropertyTypePicker({ value, onChange }: PropertyTypePickerProps) {
  return (
    <View className="mb-md">
      <Text className="mb-2 text-body-small font-semibold text-text-primary">
        Property type <Text className="text-alert-red">*</Text>
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {PROPERTY_TYPES.map((type) => {
          const selected = value === type;
          return (
            <Pressable
              key={type}
              onPress={() => {
                lightHaptic();
                onChange(type);
              }}
              className="rounded-sm border-2 px-3 py-2"
              style={{
                borderColor: selected ? colors.navy : colors.mediumGray,
                backgroundColor: selected ? `${colors.navy}12` : colors.white,
              }}
            >
              <Text
                className="text-caption"
                style={{ color: selected ? colors.navy : colors.textPrimary, fontWeight: selected ? '700' : '600' }}
              >
                {type}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
