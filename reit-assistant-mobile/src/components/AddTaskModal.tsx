import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mobileTheme } from '../constants/mobileTheme';
import { dealApi } from '../services/dealApi';
import { taskApi } from '../services/taskApi';

type AddTaskModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function AddTaskModal({ visible, onClose }: AddTaskModalProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');

  const { data: deals = [], isLoading: dealsLoading } = useQuery({
    queryKey: ['deals', 'task-modal'],
    queryFn: () => dealApi.fetchDeals(),
    enabled: visible,
  });

  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const activeDealId = selectedDealId ?? deals[0]?.id ?? null;

  const createMutation = useMutation({
    mutationFn: () => {
      if (!activeDealId) {
        throw new Error('Select a deal first');
      }
      if (!title.trim()) {
        throw new Error('Enter a task title');
      }
      return taskApi.createTask({
        deal_id: activeDealId,
        title: title.trim(),
        status: 'pending',
        priority: 'medium',
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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(event) => event.stopPropagation()}>
          <Text style={styles.title}>Add Task</Text>
          <Text style={styles.label}>Task title</Text>
          <TextInput
            style={styles.input}
            placeholder="Schedule inspection, review lease..."
            placeholderTextColor={mobileTheme.textSubtle}
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Linked deal</Text>
          {dealsLoading ? (
            <ActivityIndicator color={mobileTheme.accentGreen} style={styles.loader} />
          ) : deals.length === 0 ? (
            <Text style={styles.helper}>
              No deals yet. Save a property from Analyze to create a pipeline deal first.
            </Text>
          ) : (
            <View style={styles.dealList}>
              {deals.map((deal) => {
                const selected = deal.id === activeDealId;
                return (
                  <TouchableOpacity
                    key={deal.id}
                    style={[styles.dealChip, selected && styles.dealChipSelected]}
                    onPress={() => setSelectedDealId(deal.id)}
                  >
                    <Text style={[styles.dealChipText, selected && styles.dealChipTextSelected]}>
                      {deal.address}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {createMutation.isError ? (
            <Text style={styles.error}>
              {createMutation.error instanceof Error
                ? createMutation.error.message
                : 'Could not create task'}
            </Text>
          ) : null}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, (!activeDealId || !title.trim()) && styles.saveButtonDisabled]}
              disabled={!activeDealId || !title.trim() || createMutation.isPending}
              onPress={() => createMutation.mutate()}
            >
              <Text style={styles.saveText}>
                {createMutation.isPending ? 'Saving...' : 'Create Task'}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: mobileTheme.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: mobileTheme.surfaceBorder,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: mobileTheme.text,
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: mobileTheme.textMuted,
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: mobileTheme.surfaceBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: mobileTheme.text,
    backgroundColor: mobileTheme.bg,
  },
  helper: {
    fontSize: 13,
    color: mobileTheme.textSubtle,
    lineHeight: 18,
  },
  loader: {
    marginVertical: 8,
  },
  dealList: {
    gap: 8,
  },
  dealChip: {
    borderWidth: 1,
    borderColor: mobileTheme.surfaceBorder,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: mobileTheme.bg,
  },
  dealChipSelected: {
    borderColor: mobileTheme.accent,
    backgroundColor: '#1e3a5f',
  },
  dealChipText: {
    fontSize: 13,
    color: mobileTheme.textMuted,
  },
  dealChipTextSelected: {
    color: mobileTheme.text,
    fontWeight: '600',
  },
  error: {
    marginTop: 10,
    color: mobileTheme.accentRed,
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  cancelButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  cancelText: {
    color: mobileTheme.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: mobileTheme.accent,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveText: {
    color: mobileTheme.text,
    fontSize: 14,
    fontWeight: '700',
  },
});
