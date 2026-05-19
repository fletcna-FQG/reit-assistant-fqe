import { colors, shadows } from '@/constants/theme';
import type { Task } from '@/types/task';
import { Text, View } from 'react-native';

const priorityColors = {
  high: colors.alertRed,
  medium: colors.warningAmber,
  low: colors.emerald,
};

type TaskCardProps = {
  task: Task;
  opacity?: number;
};

export function TaskCard({ task, opacity = 1 }: TaskCardProps) {
  const dueDate = new Date(task.dueDate);
  const isOverdue = dueDate < new Date() && task.status !== 'completed';

  return (
    <View
      className="mb-sm rounded-sm bg-white p-3"
      style={[
        shadows.sm,
        {
          borderLeftWidth: 3,
          borderLeftColor: priorityColors[task.priority],
          opacity: task.status === 'completed' ? 0.7 : opacity,
        },
      ]}
    >
      <Text className="text-body-small font-bold text-text-primary">{task.title}</Text>
      <View className="mt-2 flex-row items-center justify-between">
        <Text
          className="text-micro"
          style={{ color: isOverdue ? colors.alertRed : colors.textSecondary }}
        >
          Due {dueDate.toLocaleDateString()}
        </Text>
        <View
          className="h-6 w-6 items-center justify-center rounded-full bg-navy"
        >
          <Text className="text-micro text-white">{task.assigneeInitials}</Text>
        </View>
      </View>
    </View>
  );
}
