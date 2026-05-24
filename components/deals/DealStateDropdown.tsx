import { DEAL_STATE_DROPDOWN_LABELS, DEAL_STATE_DROPDOWN_OPTIONS } from '@/constants/deals';
import { colors } from '@/constants/theme';
import { useDealState } from '@/hooks/useDealState';
import { updateDealStatus } from '@/services/api';
import type { DealStatus } from '@/types/index';
import { lightHaptic } from '@/utils/lightHaptic';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

type DealStateDropdownProps = {
  variant?: 'nav' | 'header';
  dealId?: string | null;
  onUpdated?: (status: DealStatus) => void;
};

export function DealStateDropdown({
  variant = 'nav',
  dealId,
  onUpdated,
}: DealStateDropdownProps) {
  const { dealState, setDealState } = useDealState();
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (status: DealStatus) => (dealId ? updateDealStatus(dealId, status) : Promise.resolve(null)),
    onSuccess: (_data, status) => {
      if (dealId) {
        queryClient.invalidateQueries({ queryKey: ['deal', dealId] });
        queryClient.invalidateQueries({ queryKey: ['deals'] });
      }
      onUpdated?.(status);
    },
  });

  const selectState = (status: DealStatus) => {
    lightHaptic();
    setDealState(status);
    if (dealId) mutation.mutate(status);
    onUpdated?.(status);
    setOpen(false);
  };

  const label = DEAL_STATE_DROPDOWN_LABELS[dealState];
  const isHeader = variant === 'header';

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Deal State: ${label}`}
        // @ts-expect-error web hover title
        title={`Deal State: ${label}`}
        onPress={() => setOpen(true)}
        className="rounded-full px-2.5 py-1"
        style={{
          backgroundColor: isHeader ? colors.emerald : `${colors.navy}14`,
          maxWidth: isHeader ? undefined : 72,
        }}
      >
        <Text
          className="text-caption font-semibold"
          style={{
            color: isHeader ? colors.white : colors.navy,
            fontSize: isHeader ? 12 : 10,
          }}
          numberOfLines={1}
        >
          {isHeader ? `Deal State: ${label} ▾` : `Deal State ▾`}
        </Text>
        {!isHeader ? (
          <Text
            className="text-micro font-bold"
            style={{ color: colors.navy, fontSize: 9 }}
            numberOfLines={1}
          >
            {label}
          </Text>
        ) : null}
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setOpen(false)}>
          <Pressable className="rounded-t-lg bg-white p-md" onPress={(e) => e.stopPropagation()}>
            <Text className="mb-md text-h4 text-navy">Deal State</Text>
            {DEAL_STATE_DROPDOWN_OPTIONS.map((opt) => {
              const selected = dealState === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => selectState(opt.value)}
                  className="mb-2 rounded-sm px-md py-3"
                  style={{ backgroundColor: selected ? `${colors.navy}14` : colors.lightGray }}
                >
                  <Text
                    className="text-body-small font-semibold"
                    style={{ color: selected ? colors.navy : colors.textPrimary }}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
            <Pressable onPress={() => setOpen(false)} className="mt-2 items-center py-2">
              <Text className="text-body-small font-semibold text-text-secondary">Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
