import { RuleListItem } from '@/components/rules/RuleListItem';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Modal } from '@/components/ui/Modal';
import { TextField } from '@/components/ui/TextField';
import { colors } from '@/constants/theme';
import { createRule, deleteRule, getRules, updateRule } from '@/services/api';
import type { RuleCondition } from '@/types/rule';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

export default function ManageRulesScreen() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [fieldShake, setFieldShake] = useState<Record<string, number>>({});
  const [form, setForm] = useState({
    name: '',
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
    mutationFn: ({ id, active }: { id: string; active: boolean }) => updateRule(id, { active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rules'] }),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createRule({
        name: form.name,
        category: 'financial',
        description: `${form.field} ${form.operator} ${form.value}`,
        conditions: [{ field: form.field, operator: form.operator, value: form.value }],
        scoreImpact: form.scoreImpact,
        active: true,
        priority: rules.length + 1,
        isSystem: false,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
      setCreateOpen(false);
      setForm({ name: '', field: 'capRate', operator: '>=', value: '6.0', scoreImpact: 10 });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRule,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rules'] }),
  });

  const systemRules = rules.filter((r) => r.isSystem);
  const customRules = rules.filter((r) => !r.isSystem);

  const validateCreateForm = (): boolean => {
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

  const handleSaveRule = () => {
    if (!validateCreateForm()) return;
    createMutation.mutate();
  };

  const updateField = (key: keyof typeof form, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setFormError('');
  };

  return (
    <View className="flex-1 bg-light-gray">
      <ScreenHeader
        title="Manage Rules"
        right={
          <Pressable onPress={() => router.back()}>
            <Text className="font-semibold text-navy">Done</Text>
          </Pressable>
        }
      />
      <ScrollView className="flex-1 p-md">
        <PrimaryButton title="+ Create Custom Rule" onPress={() => setCreateOpen(true)} />
        {isLoading ? (
          <ActivityIndicator color={colors.navy} className="my-lg" />
        ) : (
          <>
            <Text className="mb-sm mt-lg text-h4 text-navy">Out-of-box (enable / disable only)</Text>
            {systemRules.map((rule) => (
              <RuleListItem
                key={rule.id}
                rule={rule}
                onToggle={(active) => toggleMutation.mutate({ id: rule.id, active })}
                onEdit={() => router.push(`/(app)/rules/${rule.id}/edit`)}
              />
            ))}
            <Text className="mb-sm mt-lg text-h4 text-navy">Your custom rules</Text>
            {customRules.length === 0 ? (
              <Text className="text-body-small text-text-secondary">No custom rules yet.</Text>
            ) : (
              customRules.map((rule) => (
                <RuleListItem
                  key={rule.id}
                  rule={rule}
                  onToggle={(active) => toggleMutation.mutate({ id: rule.id, active })}
                  onEdit={() => router.push(`/(app)/rules/${rule.id}/edit`)}
                  onDelete={() => deleteMutation.mutate(rule.id)}
                />
              ))
            )}
          </>
        )}
      </ScrollView>

      <Modal
        visible={createOpen}
        title="Create Custom Rule"
        onClose={() => setCreateOpen(false)}
        footer={
          <PrimaryButton title="Save Rule" onPress={handleSaveRule} loading={createMutation.isPending} />
        }
      >
        {formError ? (
          <Text className="mb-md text-body-small text-alert-red">{formError}</Text>
        ) : null}
        <TextField
          label="Rule Name"
          value={form.name}
          onChangeText={(v) => updateField('name', v)}
          required
          error={fieldErrors.name}
          shakeTrigger={fieldShake.name ?? 0}
        />
        <TextField
          label="Field"
          value={form.field}
          onChangeText={(v) => updateField('field', v)}
          required
          error={fieldErrors.field}
          shakeTrigger={fieldShake.field ?? 0}
        />
        <TextField
          label="Operator"
          value={form.operator}
          onChangeText={(v) => updateField('operator', v as RuleCondition['operator'])}
          required
          error={fieldErrors.operator}
          shakeTrigger={fieldShake.operator ?? 0}
        />
        <TextField
          label="Value"
          value={form.value}
          onChangeText={(v) => updateField('value', v)}
          required
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
      </Modal>
    </View>
  );
}
