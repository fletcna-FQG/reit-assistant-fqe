import { Badge } from '@/components/ui/Badge';
import { colors, shadows } from '@/constants/theme';
import type { InvestmentRule } from '@/types/rule';
import { Alert, Pressable, Switch, Text, View } from 'react-native';

type RuleListItemProps = {
  rule: InvestmentRule;
  onToggle: (active: boolean) => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function RuleListItem({ rule, onToggle, onEdit, onDelete }: RuleListItemProps) {
  const isSystem = rule.isSystem === true;

  const handleDelete = () => {
    if (isSystem) {
      Alert.alert('Out-of-box rule', 'This rule can be enabled or disabled but not removed.');
      return;
    }
    Alert.alert('Delete rule', `Remove "${rule.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
    ]);
  };

  return (
    <View className="mb-md rounded-md bg-white p-md" style={shadows.sm}>
      <View className="mb-2 flex-row flex-wrap items-center gap-2">
        <Text className="flex-1 text-body-small font-bold text-text-primary">{rule.name}</Text>
        {isSystem ? (
          <Badge label="Out-of-box" variant="navy" />
        ) : (
          <Badge label="Custom" variant="emerald" />
        )}
      </View>
      <Text className="mb-1 text-caption text-text-secondary">{rule.description}</Text>
      <Text className="mb-md text-micro text-navy">Score impact: {rule.scoreImpact >= 0 ? '+' : ''}{rule.scoreImpact}</Text>
      <View className="flex-row items-center justify-between border-t border-light-gray pt-md">
        <View className="flex-row items-center gap-2">
          <Switch
            value={rule.active}
            onValueChange={onToggle}
            trackColor={{ true: colors.emeraldLight, false: colors.mediumGray }}
          />
          <Text className="text-caption text-text-secondary">{rule.active ? 'Enabled' : 'Disabled'}</Text>
        </View>
        <View className="flex-row gap-3">
          {onEdit ? (
            <Pressable onPress={onEdit}>
              <Text className="text-body-small font-semibold text-navy">Edit</Text>
            </Pressable>
          ) : null}
          {!isSystem && onDelete ? (
            <Pressable onPress={handleDelete}>
              <Text className="text-body-small font-semibold text-alert-red">Delete</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}
