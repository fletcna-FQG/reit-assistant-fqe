import { DealStateTile } from '@/components/tasks/DealStateTile';
import { DealsTable } from '@/components/tasks/DealsTable';
import { AddTaskModal } from '@/components/tasks/AddTaskModal';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import {
  DEFAULT_TASK_DEAL_STATES,
  TASK_DEAL_STATE_TILES,
} from '@/constants/deals';
import { colors, layout } from '@/constants/theme';
import { useDealState } from '@/hooks/useDealState';
import { getDeals, getTasks } from '@/services/api';
import type { DealStatus } from '@/types/index';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

export default function TasksScreen() {
  const { setDealState } = useDealState();
  const [selectedState, setSelectedState] = useState<DealStatus | null>(null);
  const [addTaskVisible, setAddTaskVisible] = useState(false);

  const {
    data: deals = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['deals', 'tasks-view'],
    queryFn: () => getDeals(),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: getTasks,
  });

  const pendingTaskCount = tasks.filter((task) => task.status === 'pending').length;

  const activeStates = selectedState ? [selectedState] : DEFAULT_TASK_DEAL_STATES;

  const filteredDeals = useMemo(
    () => deals.filter((deal) => activeStates.includes(deal.status)),
    [deals, activeStates],
  );

  const dealCounts = useMemo(() => {
    const counts: Record<DealStatus, number> = {
      pipeline: 0,
      review: 0,
      approved: 0,
      closed: 0,
    };
    for (const deal of deals) {
      counts[deal.status] += 1;
    }
    return counts;
  }, [deals]);

  const activeLabel = selectedState
    ? TASK_DEAL_STATE_TILES.find((tile) => tile.dealStatus === selectedState)?.label ??
      TASK_DEAL_STATE_TILES.find((tile) => tile.dealStatus === selectedState)?.subtitle
    : 'New / Pending';

  const handleSelectState = (status: DealStatus) => {
    if (selectedState === status) {
      setSelectedState(null);
      return;
    }
    setSelectedState(status);
    setDealState(status);
  };

  return (
    <View className="flex-1 bg-light-gray">
      <ScreenHeader
        title="Tasks"
        right={
          <Pressable onPress={() => setAddTaskVisible(true)} accessibilityRole="button">
            <Text className="text-body-small font-semibold text-navy">+ Add Task</Text>
          </Pressable>
        }
      />
      <AddTaskModal visible={addTaskVisible} onClose={() => setAddTaskVisible(false)} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: layout.bottomNavHeight + 16 }}
      >
        <View className="border-b border-medium-gray bg-white px-md py-md">
          <Text className="mb-3 text-body-small text-text-secondary">
            Select a deal state to filter deals. When none is selected, New / Pending deals are shown.
          </Text>
          <View className="flex-row gap-2">
            {TASK_DEAL_STATE_TILES.map((tile) => (
              <View key={tile.dealStatus} className="min-w-0 flex-1">
                <DealStateTile
                  dealStatus={tile.dealStatus}
                  label={tile.label}
                  subtitle={tile.subtitle}
                  count={dealCounts[tile.dealStatus]}
                  selected={selectedState === tile.dealStatus}
                  onPress={() => handleSelectState(tile.dealStatus)}
                />
              </View>
            ))}
          </View>
        </View>

        <View className="flex-row items-center justify-between px-md pt-md">
          <Text className="text-h4 text-navy">{activeLabel} Deals</Text>
          <Text className="text-caption text-text-secondary">
            {filteredDeals.length} deal{filteredDeals.length === 1 ? '' : 's'} · {pendingTaskCount} open task
            {pendingTaskCount === 1 ? '' : 's'}
          </Text>
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.navy} className="mt-xl" />
        ) : isError ? (
          <View className="mx-md mt-md rounded-md bg-white p-lg">
            <Text className="text-center text-body-small text-text-secondary">
              Could not load deals. Check that the backend is running, then try again.
            </Text>
            <Text
              className="mt-2 text-center text-body-small font-semibold text-navy"
              onPress={() => void refetch()}
            >
              Retry
            </Text>
          </View>
        ) : (
          <DealsTable
            deals={filteredDeals}
            emptyMessage={`No ${activeLabel?.toLowerCase()} deals yet.`}
          />
        )}
      </ScrollView>
    </View>
  );
}
