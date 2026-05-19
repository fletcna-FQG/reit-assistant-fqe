import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Modal } from '@/components/ui/Modal';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { TextField } from '@/components/ui/TextField';
import { colors, shadows } from '@/constants/theme';
import { createRule, getRules, updateRule } from '@/services/api';
import type { InvestmentRule, RuleCondition } from '@/types/rule';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';

export default function RulesScreen() {
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    category: 'financial' as InvestmentRule['category'],
    field: 'capRate',
    operator: '>=' as RuleCondition['operator'],
    value: '6.0',
    scoreImpact: 10,
  });

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['rules'],
    queryFn: getRules,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      updateRule(id, { active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rules'] }),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createRule({
        name: form.name,
        category: form.category,
        description: `${form.field} ${form.operator} ${form.value}`,
        conditions: [{ field: form.field, operator: form.operator, value: form.value }],
        scoreImpact: form.scoreImpact,
        active: true,
        priority: rules.length + 1,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
      setModalVisible(false);
    },
  });

  const handleTest = () => {
    setTestResult(
      `Test: ${form.field} ${form.operator} ${form.value} → Score impact +${form.scoreImpact} (sandbox, no DB write)`,
    );
  };

  return (
    <View className="flex-1 bg-light-gray">
      <ScreenHeader
        title="Investment Rules"
        right={
          <Pressable onPress={() => router.back()}>
            <Text className="font-semibold text-navy">Back</Text>
          </Pressable>
        }
      />
      <ScrollView className="flex-1 p-md">
        <PrimaryButton title="+ Add Rule" onPress={() => setModalVisible(true)} />
        {isLoading ? (
          <ActivityIndicator color={colors.navy} className="my-lg" />
        ) : (
          rules.map((rule) => (
            <View
              key={rule.id}
              className="mb-md flex-row items-center justify-between rounded-md bg-white p-md"
              style={shadows.sm}
            >
              <View className="mr-md flex-1">
                <Text className="text-body-small font-bold text-text-primary">{rule.name}</Text>
                <Text className="text-caption text-text-secondary">{rule.description}</Text>
                <Text className="mt-1 text-micro text-navy">Impact: +{rule.scoreImpact}</Text>
              </View>
              <Switch
                value={rule.active}
                onValueChange={(v) => toggleMutation.mutate({ id: rule.id, active: v })}
                trackColor={{ true: colors.emeraldLight, false: colors.mediumGray }}
              />
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        title="Create Investment Rule"
        onClose={() => setModalVisible(false)}
        footer={
          <View className="gap-2">
            <PrimaryButton title="Test Rule" variant="secondary" onPress={handleTest} />
            <PrimaryButton
              title="Save Rule"
              onPress={() => createMutation.mutate()}
              loading={createMutation.isPending}
            />
          </View>
        }
      >
        <TextField label="Rule Name" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
        <TextField label="Field" value={form.field} onChangeText={(v) => setForm({ ...form, field: v })} />
        <TextField label="Operator" value={form.operator} onChangeText={(v) => setForm({ ...form, operator: v as RuleCondition['operator'] })} />
        <TextField label="Value" value={form.value} onChangeText={(v) => setForm({ ...form, value: v })} />
        <TextField
          label="Score Impact (-100 to +100)"
          value={String(form.scoreImpact)}
          onChangeText={(v) => setForm({ ...form, scoreImpact: Number(v) || 0 })}
          keyboardType="numeric"
        />
        {testResult ? (
          <Text className="mt-md text-body-small text-emerald">{testResult}</Text>
        ) : null}
      </Modal>
    </View>
  );
}
