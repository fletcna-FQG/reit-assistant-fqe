import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { FINANCIAL_LABELS } from '@/constants/financialLabels';
import { colors } from '@/constants/theme';
import type { AttomMarketSnapshot } from '@/types/attom';
import type { PropertyRecord } from '@/services/api';
import { attomFieldSource } from '@/utils/attomPrefill';
import { formatCurrency } from '@/utils/propertyValidation';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

type AttomMarketDataPanelProps = {
  property: PropertyRecord;
  snapshot: AttomMarketSnapshot | null;
  attomEnabled: boolean;
  loading?: boolean;
  message?: string | null;
  onRefresh: () => void;
};

function SourceBadge({ source }: { source: 'attom' | 'manual' | 'estimated' }) {
  const label = source === 'attom' ? 'ATTOM' : source === 'estimated' ? 'Est.' : 'Manual';
  const backgroundColor =
    source === 'attom' ? `${colors.navy}18` : source === 'estimated' ? `${colors.warningAmber}22` : `${colors.darkGray}18`;
  const color = source === 'attom' ? colors.navy : source === 'estimated' ? colors.warningAmber : colors.textSecondary;

  return (
    <View className="ml-2 rounded-full px-2 py-0.5" style={{ backgroundColor }}>
      <Text className="text-micro font-semibold" style={{ color }}>
        {label}
      </Text>
    </View>
  );
}

function DataRow({
  label,
  value,
  field,
  snapshot,
}: {
  label: string;
  value: string;
  field: string;
  snapshot: AttomMarketSnapshot | null;
}) {
  return (
    <View className="mb-2 flex-row items-center justify-between border-b border-light-gray py-2">
      <Text className="mr-2 flex-1 text-body-small text-text-secondary">{label}</Text>
      <View className="flex-row items-center">
        <Text className="text-body-small font-semibold text-text-primary">{value}</Text>
        <SourceBadge source={attomFieldSource(field, snapshot)} />
      </View>
    </View>
  );
}

export function AttomMarketDataPanel({
  property,
  snapshot,
  attomEnabled,
  loading,
  message,
  onRefresh,
}: AttomMarketDataPanelProps) {
  const fetchedLabel = snapshot?.fetched_at
    ? new Date(snapshot.fetched_at).toLocaleString()
    : 'Not loaded';

  return (
    <View className="mb-md rounded-md bg-white p-md shadow-sm">
      <View className="mb-sm flex-row items-start justify-between gap-2">
        <View className="flex-1">
          <Text className="text-h4 text-navy">ATTOM market data</Text>
          <Text className="mt-1 text-caption text-text-secondary">
            Source: {snapshot ? (snapshot.cached ? 'ATTOM (cached)' : 'ATTOM') : attomEnabled ? 'ATTOM (pending)' : 'Manual entry'}
            {snapshot ? ` · Updated ${fetchedLabel}` : ''}
          </Text>
        </View>
        <Pressable
          onPress={onRefresh}
          disabled={loading || !attomEnabled}
          className="rounded-sm px-3 py-2"
          style={{ backgroundColor: `${colors.navy}12`, opacity: loading || !attomEnabled ? 0.5 : 1 }}
        >
          {loading ? (
            <ActivityIndicator color={colors.navy} size="small" />
          ) : (
            <Text className="text-caption font-semibold text-navy">Refresh</Text>
          )}
        </Pressable>
      </View>

      {message ? <Text className="mb-md text-body-small text-text-secondary">{message}</Text> : null}

      {!attomEnabled ? (
        <Text className="mb-md text-body-small text-text-secondary">
          Connect ATTOM API keys in backend environment variables to auto-fill property taxes, AVM,
          and building details.
        </Text>
      ) : null}

      <DataRow
        label={FINANCIAL_LABELS.grossRentalIncome}
        value={snapshot?.gross_rental_income != null ? formatCurrency(snapshot.gross_rental_income) : formatCurrency(property.gross_rental_income)}
        field="gross_rental_income"
        snapshot={snapshot}
      />
      <DataRow
        label={FINANCIAL_LABELS.otherIncome}
        value={snapshot?.other_income != null ? formatCurrency(snapshot.other_income) : formatCurrency(property.other_income)}
        field="other_income"
        snapshot={snapshot}
      />
      <DataRow
        label={`${FINANCIAL_LABELS.vacancy} %`}
        value={`${snapshot?.vacancy_percent ?? property.vacancy_percent}%`}
        field="vacancy_percent"
        snapshot={snapshot}
      />
      <DataRow
        label="Property Taxes"
        value={formatCurrency(snapshot?.property_taxes ?? property.property_taxes)}
        field="property_taxes"
        snapshot={snapshot}
      />
      <DataRow
        label="Insurance"
        value={formatCurrency(snapshot?.insurance ?? property.insurance)}
        field="insurance"
        snapshot={snapshot}
      />
      <DataRow
        label="Utilities"
        value={formatCurrency(snapshot?.utilities ?? property.utilities)}
        field="utilities"
        snapshot={snapshot}
      />
      <DataRow
        label="Repairs & Maintenance"
        value={formatCurrency(snapshot?.repairs_maintenance ?? property.repairs_maintenance)}
        field="repairs_maintenance"
        snapshot={snapshot}
      />
      <DataRow
        label="Property Management"
        value={formatCurrency(snapshot?.property_management ?? property.property_management)}
        field="property_management"
        snapshot={snapshot}
      />
      <DataRow
        label="Other Operating Expenses"
        value={formatCurrency(snapshot?.other_operating_expenses ?? property.other_operating_expenses)}
        field="other_operating_expenses"
        snapshot={snapshot}
      />
      <DataRow
        label={FINANCIAL_LABELS.capRate}
        value={`${snapshot?.cap_rate ?? property.cap_rate}%`}
        field="cap_rate"
        snapshot={snapshot}
      />
      {snapshot?.avm != null ? (
        <DataRow label="AVM / Indicated Value" value={formatCurrency(snapshot.avm)} field="avm" snapshot={snapshot} />
      ) : (
        <DataRow
          label={FINANCIAL_LABELS.indicatedValue}
          value={formatCurrency(property.indicated_value)}
          field="avm"
          snapshot={snapshot}
        />
      )}

      {!snapshot && attomEnabled ? (
        <PrimaryButton title="Fetch ATTOM Market Data" variant="secondary" onPress={onRefresh} loading={loading} />
      ) : null}
    </View>
  );
}
