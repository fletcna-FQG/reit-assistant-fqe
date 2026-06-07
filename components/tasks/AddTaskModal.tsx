import { Modal } from '@/components/ui/Modal';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { TextField } from '@/components/ui/TextField';
import { colors } from '@/constants/theme';
import { createTask, getDeals } from '@/services/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

type AddTaskModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function AddTaskModal({ visible, onClose }: AddTaskModalProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);

  const { data: deals = [], isLoading } = useQuery({
    queryKey: ['deals', 'add-task-modal'],
    queryFn: () => getDeals(),
    enabled: visible,
  });

  const activeDealId = selectedDealId ?? deals[0]?.id ?? null;

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!activeDealId) throw new Error('Create a deal first by saving a property.');
      if (!title.trim()) throw new Error('Enter a task title.');
      return createTask({
        title: title.trim(),
        assignee: 'Unassigned',
        assigneeInitials: 'UA',
        dueDate: new Date().toISOString().slice(0, 10),
        priority: 'medium',
        status: 'pending',
        dealId: activeDealId,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
      void queryClient.invalidateQueries({ queryKey: ['portfolio', 'kpis'] });
      setTitle('');
      setSelectedDealId(null);
      onClose();
    },
  });

  return (
    <Modal
      visible={visible}
      title="Add Task"
      onClose={onClose}
      footer={
        <View className="flex-row justify-end gap-2">
          <PrimaryButton title="Cancel" variant="secondary" onPress={onClose} />
          <PrimaryButton
            title={createMutation.isPending ? 'Saving...' : 'Create Task'}
            onPress={() => createMutation.mutate()}
            disabled={!activeDealId || !title.trim() || createMutation.isPending}
          />
        </View>
      }
    >
      <TextField label="Task title" value={title} onChangeText={setTitle} placeholder="Schedule inspection" />

      <Text className="mb-2 mt-md text-body-small font-semibold text-navy">Linked deal</Text>
      {isLoading ? (
        <ActivityIndicator color={colors.navy} />
      ) : deals.length === 0 ? (
        <Text className="text-body-small text-text-secondary">
          No deals yet. Save a property from Analyze to create a pipeline deal automatically.
        </Text>
      ) : (
        <View className="gap-2">
          {deals.map((deal) => {
            const selected = deal.id === activeDealId;
            return (
              <Pressable
                key={deal.id}
                onPress={() => setSelectedDealId(deal.id)}
                className="rounded-md border-2 px-md py-sm"
                style={{
                  borderColor: selected ? colors.navy : colors.mediumGray,
                  backgroundColor: selected ? `${colors.navy}10` : colors.white,
                }}
              >
                <Text className="text-body-small font-semibold text-text-primary">{deal.address}</Text>
                <Text className="text-caption text-text-secondary">
                  {deal.city}, {deal.state}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {createMutation.isError ? (
        <Text className="mt-md text-body-small text-alert-red">
          {createMutation.error instanceof Error ? createMutation.error.message : 'Could not create task'}
        </Text>
      ) : null}
    </Modal>
  );
}
