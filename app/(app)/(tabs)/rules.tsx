import { ReitRulesIcon } from '@/components/navigation/ReitRulesIcon';
import { RuleListItem } from '@/components/rules/RuleListItem';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors } from '@/constants/theme';
import { deleteRule, getRules, updateRule } from '@/services/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

export default function ReitRulesTabScreen() {
  const queryClient = useQueryClient();
  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['rules'],
    queryFn: getRules,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => updateRule(id, { active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rules'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRule,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rules'] }),
  });

  const systemRules = rules.filter((r) => r.isSystem);
  const customRules = rules.filter((r) => !r.isSystem);

  return (
    <View className="flex-1 bg-light-gray">
      <ScreenHeader
        title="REIT Rules Engine"
        right={<ReitRulesIcon size={28} focused />}
      />
      <ScrollView className="flex-1 p-md" contentContainerClassName="pb-28">
        <Text className="mb-md text-body-small text-text-secondary">
          Evaluate acquisitions against Fletcher Quill investment rules. Out-of-box rules ship with the
          product; add custom rules for your portfolio.
        </Text>
        <PrimaryButton title="+ Add Rule" onPress={() => router.push('/(app)/rules/manage')} />
        {isLoading ? (
          <ActivityIndicator color={colors.navy} className="my-lg" />
        ) : (
          <>
            <Text className="mb-sm mt-lg text-h4 text-navy">Out-of-box rules</Text>
            {systemRules.map((rule) => (
              <RuleListItem
                key={rule.id}
                rule={rule}
                onToggle={(active) => toggleMutation.mutate({ id: rule.id, active })}
                onEdit={() => router.push(`/(app)/rules/${rule.id}/edit`)}
              />
            ))}
            {customRules.length > 0 ? (
              <>
                <Text className="mb-sm mt-lg text-h4 text-navy">Your rules</Text>
                {customRules.map((rule) => (
                  <RuleListItem
                    key={rule.id}
                    rule={rule}
                    onToggle={(active) => toggleMutation.mutate({ id: rule.id, active })}
                    onEdit={() => router.push(`/(app)/rules/${rule.id}/edit`)}
                    onDelete={() => deleteMutation.mutate(rule.id)}
                  />
                ))}
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}
