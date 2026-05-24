import { AnalyzeFlowChrome } from '@/components/analyzer/AnalyzeFlowChrome';
import { DataSourceActionButtons, PropertyTypePicker } from '@/components/analyzer/PropertySearchOptions';
import { PropertySearchPanel } from '@/components/property/PropertySearchPanel';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { TextField } from '@/components/ui/TextField';
import { FINANCIAL_LABELS } from '@/constants/financialLabels';
import { type PropertyEntryMode, type PropertyType } from '@/constants/propertyTypes';
import { colors, layout } from '@/constants/theme';
import { getApiErrorMessage, propertyApi } from '@/services/api';
import {
  emptyPropertyForm,
  formToExtendedMeta,
  toPropertyPayload,
  validateFinancials,
  validatePropertyInput,
  validateSearchLocation,
  type PropertyFormInput,
  type ValidationResult,
} from '@/utils/propertyValidation';
import { savePropertyMeta } from '@/utils/propertyMetaStorage';
import { applyAttomPrefill } from '@/utils/attomPrefill';
import type { SelectedPropertyLocation } from '@/types/geocode';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useAuth } from '@/hooks/useAuth';

type FormField = keyof PropertyFormInput;

const EMPTY_FORM = emptyPropertyForm();

function isSessionExpiredMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes('session expired') || lower.includes('invalid or expired token');
}

export default function AnalyzeScreen() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const [step, setStep] = useState(1);
  const [entryMode, setEntryMode] = useState<PropertyEntryMode>('manual');
  const [propertyType, setPropertyType] = useState<PropertyType>('Homes');
  const [formData, setFormData] = useState<PropertyFormInput>(EMPTY_FORM);
  const [searchExecuted, setSearchExecuted] = useState(false);
  const [geocodeLocation, setGeocodeLocation] = useState<SelectedPropertyLocation | null>(null);
  const [pendingAttom, setPendingAttom] = useState<import('@/types/attom').AttomMarketSnapshot | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FormField, string>>>({});
  const [fieldShake, setFieldShake] = useState<Partial<Record<FormField, number>>>({});

  const isBusy = isSaving;

  const applyValidation = (result: ValidationResult): boolean => {
    if (!result.message) {
      setFieldErrors({});
      return true;
    }
    setStepError(result.message);
    setFieldErrors(result.fieldErrors);
    setFieldShake((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(result.fieldErrors) as FormField[]) {
        next[key] = (next[key] ?? 0) + 1;
      }
      return next;
    });
    return false;
  };

  const fieldProps = (field: FormField, required = false) => ({
    required,
    error: fieldErrors[field],
    shakeTrigger: fieldShake[field] ?? 0,
  });

  const handleAuthError = (error: unknown, fallback: string) => {
    const message = getApiErrorMessage(error, fallback);
    if (isSessionExpiredMessage(message) || !isAuthenticated) {
      setStepError('Your session expired. Please sign in again.');
      router.replace('/login');
      return;
    }
    setStepError(message);
  };

  const contextHeader =
    step >= 2 && formData.address.trim()
      ? {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          propertyType,
        }
      : undefined;

  const handleChange = (field: FormField, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setStepError(null);
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    if (['address', 'city', 'state', 'zip'].includes(field)) {
      setSearchExecuted(false);
    }
  };

  const handleHeaderBack = () => {
    setStepError(null);
    setFieldErrors({});
    if (step > 1) {
      setStep(step - 1);
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(app)/(tabs)');
  };

  const handleLocationVerified = (
    location: SelectedPropertyLocation,
    message: string,
    attomData?: import('@/types/attom').AttomMarketSnapshot | null,
  ) => {
    setGeocodeLocation(location);
    setPendingAttom(attomData ?? null);
    setFormData((prev) =>
      applyAttomPrefill(
        {
          ...prev,
          address: location.address,
          city: location.city,
          state: location.state,
          zip: location.zip,
          data_source: attomData ? 'ATTOM + OpenStreetMap Nominatim' : 'OpenStreetMap Nominatim',
        },
        attomData,
      ),
    );
    setSearchExecuted(true);
    setStepError(null);
    setFieldErrors({});
    setStep(2);
  };

  const handleContinue = async () => {
    setStepError(null);

    if (step === 1) {
      const locationResult = validateSearchLocation(formData);
      if (!applyValidation(locationResult)) {
        return;
      }
      if (entryMode === 'automated' && !searchExecuted) {
        setStepError('Search and select an address using Nominatim before continuing.');
        return;
      }
      setFieldErrors({});
      setStep(2);
      return;
    }

    if (step === 2) {
      const validationResult = validateFinancials(formData);
      if (!applyValidation(validationResult)) {
        return;
      }
      setFieldErrors({});
      setStep(3);
      return;
    }

    if (step === 3) {
      const validationResult = validatePropertyInput(formData);
      if (!applyValidation(validationResult)) {
        return;
      }

      setIsSaving(true);
      try {
        const result = await propertyApi.createProperty(toPropertyPayload(formData));
        const meta = formToExtendedMeta(formData, {
          propertyType,
          entryMode,
          lat: geocodeLocation?.lat,
          lon: geocodeLocation?.lon,
          geocode_source: geocodeLocation ? 'nominatim' : undefined,
          attom_snapshot: pendingAttom ?? undefined,
        });
        await savePropertyMeta(result.property.id, meta);

        queryClient.setQueryData(['property', result.property.id], { property: result.property });
        await queryClient.invalidateQueries({ queryKey: ['properties'] });

        router.push({
          pathname: '/(app)/property/[id]',
          params: {
            id: result.property.id,
            propertyType,
            autoRunRules: '1',
            flowStep: '4',
          },
        });
      } catch (error) {
        handleAuthError(error, 'Failed to save property');
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <View className="flex-1 bg-light-gray">
      <AnalyzeFlowChrome
        title="Analyze Property"
        showBack
        onBack={handleHeaderBack}
        currentStep={step}
        context={contextHeader}
      />

      <ScrollView
        className="flex-1 px-md"
        contentContainerClassName="pt-md pb-xl"
        keyboardShouldPersistTaps="handled"
        style={{ flex: 1 }}
      >
        {stepError ? (
          <View
            className="mb-md rounded-md border-2 bg-white p-md"
            style={{ borderColor: colors.alertRed }}
            accessibilityRole="alert"
          >
            <Text className="text-body-small text-alert-red">{stepError}</Text>
          </View>
        ) : null}

        {step === 1 ? (
          <>
            <Text className="mb-md text-body-small text-text-secondary">
              Choose manual entry or automated search. Automated search uses free Nominatim geocoding
              before any paid ATTOM market data calls.
            </Text>
            <DataSourceActionButtons
              value={entryMode}
              onChange={(mode) => {
                setEntryMode(mode);
                setSearchExecuted(false);
                setGeocodeLocation(null);
                setStepError(null);
              }}
            />
            {entryMode === 'automated' ? (
              <PropertySearchPanel
                propertyType={propertyType}
                onPropertyTypeChange={setPropertyType}
                onLocationVerified={handleLocationVerified}
                onManualEntry={() => {
                  setEntryMode('manual');
                  setSearchExecuted(false);
                  setGeocodeLocation(null);
                }}
                onError={(message) => {
                  if (isSessionExpiredMessage(message)) {
                    handleAuthError(new Error(message), message);
                    return;
                  }
                  setStepError(message);
                }}
              />
            ) : (
              <>
                <PropertyTypePicker value={propertyType} onChange={setPropertyType} />
                <Text className="mb-sm text-h4 text-navy">Address</Text>
                <TextField
                  label="Street Address"
                  value={formData.address}
                  onChangeText={(value) => handleChange('address', value)}
                  placeholder="123 Main St"
                  {...fieldProps('address', true)}
                />
                <TextField
                  label="City"
                  value={formData.city}
                  onChangeText={(value) => handleChange('city', value)}
                  placeholder="Seattle"
                  {...fieldProps('city', true)}
                />
                <View className="mb-md flex-row gap-2">
                  <View className="flex-1">
                    <TextField
                      label="State"
                      value={formData.state}
                      onChangeText={(value) => handleChange('state', value)}
                      placeholder="WA"
                      autoCapitalize="characters"
                      {...fieldProps('state', true)}
                    />
                  </View>
                  <View className="flex-1">
                    <TextField
                      label="ZIP Code"
                      value={formData.zip}
                      onChangeText={(value) => handleChange('zip', value)}
                      placeholder="98101"
                      keyboardType="numeric"
                      {...fieldProps('zip', true)}
                    />
                  </View>
                </View>
              </>
            )}
          </>
        ) : null}

        {step === 2 ? (
          <>
            <Text className="mb-md text-body-small text-text-secondary">
              Enter income, operating expenses, and Capitalization Rate (Cap Rate). Effective Gross Income (EGI),
              Net Operating Income (NOI), and Indicated Value are calculated when you continue from step 3.
            </Text>
            <Text className="mb-sm text-h4 text-navy">Income</Text>
            <TextField
              label={FINANCIAL_LABELS.grossRentalIncome}
              value={formData.gross_rental_income}
              onChangeText={(value) => handleChange('gross_rental_income', value)}
              placeholder="177204"
              keyboardType="numeric"
              {...fieldProps('gross_rental_income', true)}
            />
            <TextField
              label={FINANCIAL_LABELS.otherIncome}
              value={formData.other_income}
              onChangeText={(value) => handleChange('other_income', value)}
              placeholder="4500"
              keyboardType="numeric"
              {...fieldProps('other_income', true)}
            />
            <TextField
              label={`${FINANCIAL_LABELS.vacancy} % (0–100)`}
              value={formData.vacancy_percent}
              onChangeText={(value) => handleChange('vacancy_percent', value)}
              placeholder="5"
              keyboardType="numeric"
              {...fieldProps('vacancy_percent', true)}
            />
            <Text className="mb-sm mt-md text-h4 text-navy">Operating expenses</Text>
            <TextField label="Property Taxes" value={formData.property_taxes} onChangeText={(v) => handleChange('property_taxes', v)} placeholder="12879" keyboardType="numeric" {...fieldProps('property_taxes', true)} />
            <TextField label="Insurance" value={formData.insurance} onChangeText={(v) => handleChange('insurance', v)} placeholder="0" keyboardType="numeric" {...fieldProps('insurance', true)} />
            <TextField label="Utilities" value={formData.utilities} onChangeText={(v) => handleChange('utilities', v)} placeholder="0" keyboardType="numeric" {...fieldProps('utilities', true)} />
            <TextField label="Repairs & Maintenance" value={formData.repairs_maintenance} onChangeText={(v) => handleChange('repairs_maintenance', v)} placeholder="0" keyboardType="numeric" {...fieldProps('repairs_maintenance', true)} />
            <TextField label="Property Management" value={formData.property_management} onChangeText={(v) => handleChange('property_management', v)} placeholder="0" keyboardType="numeric" {...fieldProps('property_management', true)} />
            <TextField label="Other Operating Expenses" value={formData.other_operating_expenses} onChangeText={(v) => handleChange('other_operating_expenses', v)} placeholder="34664" keyboardType="numeric" {...fieldProps('other_operating_expenses', true)} />
            <Text className="mb-sm mt-md text-h4 text-navy">Valuation input</Text>
            <TextField
              label={`${FINANCIAL_LABELS.capRate} % (> 0)`}
              value={formData.cap_rate}
              onChangeText={(value) => handleChange('cap_rate', value)}
              placeholder="6.23"
              keyboardType="decimal-pad"
              {...fieldProps('cap_rate', true)}
            />
          </>
        ) : null}

        {step === 3 ? (
          <>
            <Text className="mb-md text-body-small text-text-secondary">
              Enter property details. Continue saves your entry and opens the Property Summary with calculated
              valuation.
            </Text>
            <TextField label={FINANCIAL_LABELS.yearBuilt} value={formData.year_built} onChangeText={(v) => handleChange('year_built', v)} placeholder="1998" keyboardType="numeric" {...fieldProps('year_built')} />
            <TextField label={FINANCIAL_LABELS.lotSize} value={formData.lot_size} onChangeText={(v) => handleChange('lot_size', v)} placeholder="8500" keyboardType="numeric" {...fieldProps('lot_size')} />
            <TextField label={FINANCIAL_LABELS.price} value={formData.price} onChangeText={(v) => handleChange('price', v)} placeholder="2000000" keyboardType="numeric" {...fieldProps('price')} />
            <TextField label={FINANCIAL_LABELS.pricePerSqFt} value={formData.price_per_sqft} onChangeText={(v) => handleChange('price_per_sqft', v)} placeholder="235" keyboardType="decimal-pad" {...fieldProps('price_per_sqft')} />
            <TextField label={FINANCIAL_LABELS.hoaDues} value={formData.hoa_dues} onChangeText={(v) => handleChange('hoa_dues', v)} placeholder="0" keyboardType="numeric" {...fieldProps('hoa_dues')} />
            <TextField label={FINANCIAL_LABELS.parking} value={formData.parking} onChangeText={(v) => handleChange('parking', v)} placeholder="Garage, surface, count" />
            <TextField label={FINANCIAL_LABELS.mlsGridNumber} value={formData.mls_grid_number} onChangeText={(v) => handleChange('mls_grid_number', v)} placeholder="MLS-1234567" />
            <TextField label={FINANCIAL_LABELS.dataSource} value={formData.data_source} onChangeText={(v) => handleChange('data_source', v)} placeholder="Manual entry, county assessor, MLS…" />
            <TextField label={FINANCIAL_LABELS.loanDetails} value={formData.loan_details} onChangeText={(v) => handleChange('loan_details', v)} placeholder="Loan amount, rate, term" />
          </>
        ) : null}

        {step === 1 && entryMode === 'manual' ? (
          <View className="mt-lg" style={{ paddingBottom: layout.bottomNavHeight }}>
            <PrimaryButton
              title="Continue"
              onPress={() => void handleContinue()}
              loading={isSaving}
              disabled={isBusy}
            />
          </View>
        ) : step > 1 ? (
          <View className="mt-lg" style={{ paddingBottom: layout.bottomNavHeight }}>
            <PrimaryButton
              title="Continue"
              onPress={() => void handleContinue()}
              loading={isSaving}
              disabled={isBusy}
            />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
