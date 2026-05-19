import { StepIndicator } from '@/components/analyzer/StepIndicator';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { TextField } from '@/components/ui/TextField';
import { colors } from '@/constants/theme';
import { analyzeProperty } from '@/services/api';
import type { AnalysisInput } from '@/types/analysis';
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

const STEPS = ['Basic Info', 'Financials', 'Review'];

const defaultInput: AnalysisInput = {
  address: '8800 Wyoming Ave, Cheyenne, WY',
  propertyType: 'Multifamily',
  yearBuilt: 2005,
  sqft: 45000,
  units: 48,
  purchasePrice: 5_200_000,
  estimatedValue: 5_800_000,
  noi: 353_600,
  occupancy: 94,
  loanAmount: 3_640_000,
  interestRate: 5.75,
  loanTerm: 30,
};

export default function AnalyzeScreen() {
  const [step, setStep] = useState(1);
  const [input, setInput] = useState<AnalysisInput>(defaultInput);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');

  const capRate = useMemo(
    () => (input.purchasePrice > 0 ? (input.noi / input.purchasePrice) * 100 : 0),
    [input],
  );
  const dscr = useMemo(() => {
    const annualPayment = input.loanAmount * (input.interestRate / 100) * 0.12 || 1;
    return input.noi / annualPayment;
  }, [input]);

  const mutation = useMutation({
    mutationFn: analyzeProperty,
    onSuccess: (result) => {
      router.push(`/(app)/analysis/${result.id}`);
    },
  });

  const update = (patch: Partial<AnalysisInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const handleSubmit = async () => {
    setLoading(true);
    for (let i = 1; i <= 12; i++) {
      setProgress(`Evaluating rule ${i} of 12...`);
      await new Promise((r) => setTimeout(r, 120));
    }
    mutation.mutate(input, {
      onSettled: () => setLoading(false),
    });
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-light-gray p-xl">
        <ActivityIndicator size="large" color={colors.navy} />
        <Text className="mt-lg text-h3 text-navy">{progress}</Text>
        <Text className="mt-2 text-body-small text-text-secondary">~2 seconds</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-light-gray">
      <ScreenHeader title="Analyze Property" />
      <StepIndicator steps={STEPS} currentStep={step} />
      <ScrollView className="flex-1 px-md" contentContainerClassName="pb-xl">
        {step === 1 ? (
          <>
            <TextField
              label="Property Address"
              value={input.address}
              onChangeText={(v) => update({ address: v })}
              placeholder="Start typing address..."
            />
            <Text className="mb-1 text-body-small font-semibold">Property Type</Text>
            <TextInput
              className="mb-md rounded-sm border-2 border-medium-gray bg-white px-md text-body"
              style={{ height: 48 }}
              value={input.propertyType}
              onChangeText={(v) => update({ propertyType: v })}
            />
            <TextField
              label="Year Built"
              value={String(input.yearBuilt)}
              onChangeText={(v) => update({ yearBuilt: Number(v) || 0 })}
              keyboardType="numeric"
              placeholder="e.g. 2005"
            />
            <TextField
              label="Square Footage"
              value={String(input.sqft)}
              onChangeText={(v) => update({ sqft: Number(v) || 0 })}
              keyboardType="numeric"
            />
            <TextField
              label="Units"
              value={String(input.units)}
              onChangeText={(v) => update({ units: Number(v) || 0 })}
              keyboardType="numeric"
            />
          </>
        ) : null}

        {step === 2 ? (
          <>
            <Text className="mb-1 text-body-small font-semibold">
              Purchase Price: ${input.purchasePrice.toLocaleString()}
            </Text>
            <TextInput
              className="mb-md"
              value={String(input.purchasePrice)}
              onChangeText={(v) => update({ purchasePrice: Number(v) || 0 })}
              keyboardType="numeric"
            />
            <TextField
              label="Estimated Value"
              value={String(input.estimatedValue)}
              onChangeText={(v) => update({ estimatedValue: Number(v) || 0 })}
              keyboardType="numeric"
            />
            <TextField
              label="NOI (Annual)"
              value={String(input.noi)}
              onChangeText={(v) => update({ noi: Number(v) || 0 })}
              keyboardType="numeric"
            />
            <TextField
              label="Occupancy Rate (%)"
              value={String(input.occupancy)}
              onChangeText={(v) => update({ occupancy: Number(v) || 0 })}
              keyboardType="numeric"
            />
            <TextField
              label="Loan Amount"
              value={String(input.loanAmount)}
              onChangeText={(v) => update({ loanAmount: Number(v) || 0 })}
              keyboardType="numeric"
            />
            <TextField
              label="Interest Rate (%)"
              value={String(input.interestRate)}
              onChangeText={(v) => update({ interestRate: Number(v) || 0 })}
              keyboardType="decimal-pad"
            />
            <TextField
              label="Loan Term (years)"
              value={String(input.loanTerm)}
              onChangeText={(v) => update({ loanTerm: Number(v) || 0 })}
              keyboardType="numeric"
            />
          </>
        ) : null}

        {step === 3 ? (
          <View className="rounded-md bg-white p-md shadow-sm">
            <Text className="mb-md text-h4 text-navy">Analysis Summary</Text>
            <SummaryRow label="Address" value={input.address} />
            <SummaryRow label="Type" value={input.propertyType} />
            <SummaryRow label="Purchase Price" value={`$${input.purchasePrice.toLocaleString()}`} />
            <SummaryRow label="NOI" value={`$${input.noi.toLocaleString()}`} />
            <SummaryRow label="Cap Rate" value={`${capRate.toFixed(1)}%`} highlight />
            <SummaryRow label="DSCR" value={dscr.toFixed(2)} highlight />
          </View>
        ) : null}

        <View className="mt-lg flex-row gap-2">
          {step > 1 ? (
            <View className="flex-1">
              <PrimaryButton title="Back" variant="secondary" onPress={() => setStep(step - 1)} />
            </View>
          ) : null}
          <View className="flex-1">
            {step < 3 ? (
              <PrimaryButton title="Continue →" onPress={() => setStep(step + 1)} />
            ) : (
              <PrimaryButton title="Submit for Analysis" onPress={handleSubmit} />
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function SummaryRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View className="mb-2 flex-row justify-between border-b border-light-gray py-2">
      <Text className="text-body-small text-text-secondary">{label}</Text>
      <Text className={`text-body-small font-bold ${highlight ? 'text-navy' : 'text-text-primary'}`}>
        {value}
      </Text>
    </View>
  );
}
