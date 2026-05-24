import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ANALYSIS_DOCUMENT_TYPES } from '@/constants/deals';
import { colors } from '@/constants/theme';
import { addDealDocument } from '@/services/api';
import type { DealDocument } from '@/types/deal';
import { integrationImportPlaceholder, pickDocuments } from '@/utils/pickDocuments';
import { lightHaptic } from '@/utils/lightHaptic';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';

type DealDocumentsPanelProps = {
  dealId: string;
  documents: DealDocument[];
};

function CompactDocButton({
  title,
  onPress,
  loading,
  variant = 'primary',
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
}) {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      onPress={() => {
        lightHaptic();
        onPress();
      }}
      disabled={loading}
      className="flex-1 items-center justify-center rounded-sm px-1 py-2"
      style={{
        minHeight: 40,
        backgroundColor: isPrimary ? colors.navy : 'transparent',
        borderWidth: isPrimary ? 0 : 2,
        borderColor: colors.navy,
        opacity: loading ? 0.6 : 1,
      }}
      accessibilityLabel={title}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.white : colors.navy} size="small" />
      ) : (
        <Text
          className="text-center text-micro font-semibold"
          style={{ color: isPrimary ? colors.white : colors.navy }}
          numberOfLines={2}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

export function DealDocumentsPanel({ dealId, documents }: DealDocumentsPanelProps) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);
  const [importSource, setImportSource] = useState<string | null>(null);

  const uploadMutation = useMutation({
    mutationFn: (file: { name: string; type: string; size: string }) => addDealDocument(dealId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal', dealId] });
    },
  });

  const handleUpload = async () => {
    setMessage(null);
    const picked = await pickDocuments();
    if (picked.length === 0) {
      if (Platform.OS !== 'web') {
        setMessage('Document upload is available on web. Use Import on mobile beta.');
      }
      return;
    }
    for (const file of picked) {
      await uploadMutation.mutateAsync(file);
    }
    setMessage(`${picked.length} document${picked.length === 1 ? '' : 's'} uploaded.`);
  };

  const handleImport = async (source: string) => {
    setMessage(null);
    setImportSource(source);
    const file = integrationImportPlaceholder(source);
    await uploadMutation.mutateAsync(file);
    setImportSource(null);
    setMessage(`Imported from ${source}.`);
  };

  const busy = uploadMutation.isPending;

  return (
    <View>
      <Text className="mb-sm text-h4 text-navy">Documents for analysis</Text>
      <Text className="mb-md text-body-small text-text-secondary">
        Upload or import documents required to complete the Rule Engine analysis.
      </Text>

      <View className="mb-md flex-row gap-1">
        <CompactDocButton
          title="Upload"
          onPress={() => void handleUpload()}
          loading={busy && !importSource}
        />
        <CompactDocButton
          title="Import MLS"
          variant="secondary"
          onPress={() => void handleImport('MLS Grid')}
          loading={busy && importSource === 'MLS Grid'}
        />
        <CompactDocButton
          title="Import Assessor"
          variant="secondary"
          onPress={() => void handleImport('County Assessor')}
          loading={busy && importSource === 'County Assessor'}
        />
      </View>

      {message ? (
        <View className="mb-md rounded-sm bg-light-gray p-md">
          <Text className="text-body-small text-navy">{message}</Text>
        </View>
      ) : null}

      <Text className="mb-sm mt-md text-body-small font-semibold text-text-primary">
        Recommended for analysis
      </Text>
      {ANALYSIS_DOCUMENT_TYPES.map((docType) => {
        const matched = documents.some((d) =>
          d.name.toLowerCase().includes(docType.toLowerCase().split(' ')[0]!),
        );
        return (
          <View key={docType} className="mb-2 flex-row items-center gap-2">
            <Text style={{ color: matched ? colors.emerald : colors.textSecondary }}>
              {matched ? '✓' : '○'}
            </Text>
            <Text className="text-caption text-text-secondary">{docType}</Text>
          </View>
        );
      })}

      <Text className="mb-sm mt-lg text-body-small font-semibold text-text-primary">Uploaded files</Text>
      {documents.length === 0 ? (
        <Text className="text-body-small text-text-secondary">No documents yet.</Text>
      ) : (
        documents.map((doc) => (
          <View
            key={doc.id}
            className="mb-sm flex-row items-center justify-between rounded-md bg-white p-md shadow-sm"
          >
            <View className="mr-2 flex-1">
              <Text className="text-body-small font-semibold text-text-primary">{doc.name}</Text>
              <Text className="text-caption uppercase text-text-secondary">{doc.type}</Text>
            </View>
            <Text className="text-caption text-text-secondary">{doc.size}</Text>
          </View>
        ))
      )}
    </View>
  );
}
