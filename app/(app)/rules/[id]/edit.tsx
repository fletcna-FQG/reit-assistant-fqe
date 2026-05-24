import { RuleListItem } from '@/components/rules/RuleListItem';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { TextField } from '@/components/ui/TextField';
import { getRules, updateRule } from '@/services/api';
import type { RuleCondition } from '@/types/rule';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { colors } from '@/constants/theme';

export default function EditRuleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { data: rules = [], isLoading } = useQuery({ queryKey: ['rules'], queryFn: getRules });
  const rule = rules.find((r) => r.id === id);

  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [fieldShake, setFieldShake] = useState<Record<string, number>>({});
  const [form, setForm] = useState({
    name: '',
    field: 'capRate',
    operator: '>=' as RuleCondition['operator'],
    value: '6.0',
    scoreImpact: 10,
    active: true,
  });

  useEffect(() => {
    if (!rule) return;
    const cond = rule.conditions[0];
    setForm({
      name: rule.name,
      field: cond?.field ?? 'capRate',
      operator: cond?.operator ?? '>=',
      value: cond?.value ?? '6.0',
      scoreImpact: rule.scoreImpact,
      active: rule.active,
    });
  }, [rule]);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateRule(id!, {
        name: form.name,
        description: `${form.field} ${form.operator} ${form.value}`,
        conditions: [{ field: form.field, operator: form.operator, value: form.value }],
        scoreImpact: form.scoreImpact,
        active: form.active,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
      router.back();
    },
  });

  if (isLoading || !rule) {
    return (
      <View className="flex-1 items-center justify-center bg-light-gray">
        <ActivityIndicator color={colors.navy} />
      </View>
    );
  }

  const isSystem = rule.isSystem === true;

  const validateForm = (): boolean => {
    if (isSystem) return true;
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = 'Please enter a rule name.';
    if (!form.field.trim()) errors.field = 'Please enter a field.';
    if (!form.operator.trim()) errors.operator = 'Please enter an operator.';
    if (!form.value.trim()) errors.value = 'Please enter a value.';
    if (Number.isNaN(form.scoreImpact)) errors.scoreImpact = 'Please enter a score impact.';

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setFormError('Please complete all required fields marked with * before saving.');
      setFieldShake((prev) => {
        const next = { ...prev };
        for (const key of Object.keys(errors)) {
          next[key] = (next[key] ?? 0) + 1;
        }
        return next;
      });
      return false;
    }
    setFormError('');
    return true;
  };

  const updateField = (key: keyof typeof form, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setFormError('');
  };

  const handleSave = () => {
    if (!validateForm()) return;
    saveMutation.mutate();
  };

  return (
    <View className="flex-1 bg-light-gray">
      <ScreenHeader
        title={isSystem ? 'View / Enable Rule' : 'Edit Rule'}
        right={
          <Pressable onPress={() => router.back()}>
            <Text className="font-semibold text-navy">Cancel</Text>
          </Pressable>
        }
      />
      <ScrollView className="flex-1 p-md">
        {isSystem ? (
          <Text className="mb-md text-body-small text-text-secondary">
            Out-of-box rule — you can enable/disable and adjust score impact. Name and conditions are read-only.
          </Text>
        ) : null}
        {formError ? (
          <Text className="mb-md text-body-small text-alert-red">{formError}</Text>
        ) : null}
        <TextField
          label="Rule Name"
          value={form.name}
          onChangeText={(v) => updateField('name', v)}
          editable={!isSystem}
          required={!isSystem}
          error={fieldErrors.name}
          shakeTrigger={fieldShake.name ?? 0}
        />
        <TextField
          label="Field"
          value={form.field}
          onChangeText={(v) => updateField('field', v)}
          editable={!isSystem}
          required={!isSystem}
          error={fieldErrors.field}
          shakeTrigger={fieldShake.field ?? 0}
        />
        <TextField
          label="Operator"
          value={form.operator}
          onChangeText={(v) => updateField('operator', v as RuleCondition['operator'])}
          editable={!isSystem}
          required={!isSystem}
          error={fieldErrors.operator}
          shakeTrigger={fieldShake.operator ?? 0}
        />
        <TextField
          label="Value"
          value={form.value}
          onChangeText={(v) => updateField('value', v)}
          editable={!isSystem}
          required={!isSystem}
          error={fieldErrors.value}
          shakeTrigger={fieldShake.value ?? 0}
        />
        <TextField
          label="Score Impact"
          value={String(form.scoreImpact)}
          onChangeText={(v) => updateField('scoreImpact', Number(v) || 0)}
          keyboardType="numeric"
          required
          error={fieldErrors.scoreImpact}
          shakeTrigger={fieldShake.scoreImpact ?? 0}
        />
        <PrimaryButton
          title="Save Changes"
          onPress={handleSave}
          loading={saveMutation.isPending}
        />
      </ScrollView>
    </View>
  );
}
