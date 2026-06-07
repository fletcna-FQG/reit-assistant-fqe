import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AddTaskModal } from '../components/AddTaskModal';
import { ErrorState } from '../components/ErrorState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { mobileTheme } from '../constants/mobileTheme';
import { taskApi, type TaskRecord, type TaskStatus } from '../services/taskApi';

type KanbanColumn = {
  key: TaskStatus;
  title: string;
  statuses: TaskStatus[];
};

const COLUMNS: KanbanColumn[] = [
  { key: 'pending', title: 'Pending', statuses: ['pending'] },
  { key: 'in_progress', title: 'In Progress', statuses: ['in_progress'] },
  { key: 'completed', title: 'Done', statuses: ['completed', 'cancelled'] },
];

function nextStatus(current: TaskStatus): TaskStatus {
  if (current === 'pending') return 'in_progress';
  if (current === 'in_progress') return 'completed';
  return 'pending';
}

function TaskCard({
  task,
  onPress,
  isUpdating,
}: {
  task: TaskRecord;
  onPress: () => void;
  isUpdating: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.taskCard, isUpdating && styles.taskCardUpdating]}
      onPress={onPress}
      disabled={isUpdating}
    >
      <Text style={styles.taskTitle}>{task.title}</Text>
      <Text style={styles.taskMeta}>
        {task.assignee} · Due {task.dueDate}
      </Text>
      <Text style={styles.taskHint}>Tap to advance status</Text>
    </TouchableOpacity>
  );
}

export default function TasksScreen() {
  const queryClient = useQueryClient();
  const [addTaskVisible, setAddTaskVisible] = useState(false);

  const {
    data: tasks = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => taskApi.fetchTasks(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      taskApi.updateTask(id, { status }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
      void queryClient.invalidateQueries({ queryKey: ['portfolio', 'kpis'] });
    },
  });

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const grouped = useMemo(() => {
    const map: Record<string, TaskRecord[]> = {
      pending: [],
      in_progress: [],
      completed: [],
    };
    for (const task of tasks) {
      if (task.status === 'pending') map.pending.push(task);
      else if (task.status === 'in_progress') map.in_progress.push(task);
      else map.completed.push(task);
    }
    return map;
  }, [tasks]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Tasks</Text>
          <Text style={styles.subtitle}>Kanban board — tap a card to move it forward</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setAddTaskVisible(true)}>
          <Text style={styles.addButtonText}>+ Add Task</Text>
        </TouchableOpacity>
      </View>

      <AddTaskModal visible={addTaskVisible} onClose={() => setAddTaskVisible(false)} />

      {isLoading ? (
        <LoadingSkeleton rows={4} />
      ) : isError ? (
        <ErrorState
          message="Could not load tasks. Run the Supabase migration and ensure deals exist."
          onRetry={() => void refetch()}
        />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.board}>
          {COLUMNS.map((column) => (
            <View key={column.key} style={styles.column}>
              <View style={styles.columnHeader}>
                <Text style={styles.columnTitle}>{column.title}</Text>
                <Text style={styles.columnCount}>{grouped[column.key]?.length ?? 0}</Text>
              </View>
              <ScrollView nestedScrollEnabled contentContainerStyle={styles.columnBody}>
                {(grouped[column.key] ?? []).length === 0 ? (
                  <Text style={styles.emptyColumn}>No tasks</Text>
                ) : (
                  (grouped[column.key] ?? []).map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      isUpdating={updateMutation.isPending && updateMutation.variables?.id === task.id}
                      onPress={() =>
                        updateMutation.mutate({ id: task.id, status: nextStatus(task.status) })
                      }
                    />
                  ))
                )}
              </ScrollView>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: mobileTheme.bg,
    paddingTop: 56,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 12,
  },
  addButton: {
    backgroundColor: mobileTheme.accent,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 4,
  },
  addButtonText: {
    color: mobileTheme.text,
    fontSize: 13,
    fontWeight: '700',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: mobileTheme.text,
  },
  subtitle: {
    fontSize: 13,
    color: mobileTheme.textMuted,
    marginTop: 4,
  },
  board: {
    paddingHorizontal: 12,
    paddingBottom: 24,
    gap: 12,
  },
  column: {
    width: 280,
    maxHeight: '100%',
    backgroundColor: mobileTheme.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: mobileTheme.surfaceBorder,
    padding: 10,
  },
  columnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  columnTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: mobileTheme.text,
  },
  columnCount: {
    fontSize: 12,
    fontWeight: '700',
    color: mobileTheme.textMuted,
    backgroundColor: mobileTheme.bg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  columnBody: {
    paddingBottom: 8,
    gap: 8,
  },
  taskCard: {
    backgroundColor: mobileTheme.bg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: mobileTheme.surfaceBorder,
    padding: 12,
  },
  taskCardUpdating: {
    opacity: 0.6,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: mobileTheme.text,
  },
  taskMeta: {
    marginTop: 4,
    fontSize: 12,
    color: mobileTheme.textMuted,
  },
  taskHint: {
    marginTop: 6,
    fontSize: 11,
    color: mobileTheme.textSubtle,
  },
  emptyColumn: {
    fontSize: 13,
    color: mobileTheme.textSubtle,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
});
