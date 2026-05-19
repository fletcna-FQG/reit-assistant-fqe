import { TaskCard } from '@/components/TaskCard';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Modal } from '@/components/ui/Modal';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { TextField } from '@/components/ui/TextField';
import { colors } from '@/constants/theme';
import { createTask, getTasks, updateTaskStatus } from '@/services/api';
import type { Task } from '@/types/task';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

const COLUMNS: { key: Task['status']; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function TasksScreen() {
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: getTasks,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Task['status'] }) =>
      updateTaskStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createTask({
        title: newTitle,
        assignee: 'Nancy Fletcher',
        assigneeInitials: 'NF',
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        priority: 'medium',
        status: 'pending',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setModalVisible(false);
      setNewTitle('');
    },
  });

  const cycleStatus = (task: Task) => {
    const order: Task['status'][] = ['pending', 'in_progress', 'completed', 'cancelled'];
    const idx = order.indexOf(task.status);
    const next = order[(idx + 1) % order.length];
    statusMutation.mutate({ id: task.id, status: next });
  };

  return (
    <View className="flex-1 bg-light-gray">
      <ScreenHeader
        title="Tasks"
        right={
          <Pressable onPress={() => setModalVisible(true)}>
            <Text className="font-semibold text-navy">+ Add</Text>
          </Pressable>
        }
      />
      {isLoading ? (
        <ActivityIndicator color={colors.navy} className="mt-xl" />
      ) : (
        <ScrollView horizontal className="flex-1" contentContainerClassName="p-md">
          {COLUMNS.map((column) => {
            const columnTasks = tasks.filter((t) => t.status === column.key);
            return (
              <View key={column.key} className="mr-md w-72">
                <Text className="mb-sm text-h4 text-navy">
                  {column.label} ({columnTasks.length})
                </Text>
                <View className="min-h-[200px] rounded-md bg-white/50 p-2">
                  {columnTasks.map((task) => (
                    <Pressable key={task.id} onLongPress={() => cycleStatus(task)}>
                      <TaskCard task={task} />
                    </Pressable>
                  ))}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      <Modal
        visible={modalVisible}
        title="Add New Task"
        onClose={() => setModalVisible(false)}
        footer={
          <PrimaryButton
            title="Create Task"
            onPress={() => createMutation.mutate()}
            loading={createMutation.isPending}
          />
        }
      >
        <TextField label="Task Title" value={newTitle} onChangeText={setNewTitle} />
        <Text className="text-caption text-text-secondary">
          Long-press a task card to move it to the next column
        </Text>
      </Modal>
    </View>
  );
}
