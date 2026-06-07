import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SPREADSHEET_SAMPLE } from '../constants/spreadsheetSample';
import { propertyApi, getApiErrorMessage } from '../services/api';
import { dealApi } from '../services/dealApi';
import { toDealPropertyType } from '../utils/dealPropertyType';
import {
  formatCurrency,
  toPropertyPayload,
  validatePropertyInput,
  validateSearchLocation,
  type PropertyFormInput,
} from '../utils/propertyValidation';
import { router } from 'expo-router';

type FormField = keyof PropertyFormInput;

const EMPTY_FORM: PropertyFormInput = {
  address: '',
  city: '',
  state: '',
  zip: '',
  gross_rental_income: '',
  other_income: '',
  vacancy_percent: '',
  property_taxes: '',
  insurance: '',
  utilities: '',
  repairs_maintenance: '',
  property_management: '',
  other_operating_expenses: '',
  cap_rate: '',
};

function sampleFormStrings(): PropertyFormInput {
  const s = SPREADSHEET_SAMPLE;
  return {
    address: s.address,
    city: s.city,
    state: s.state,
    zip: s.zip,
    gross_rental_income: String(s.gross_rental_income),
    other_income: String(s.other_income),
    vacancy_percent: String(s.vacancy_percent),
    property_taxes: String(s.property_taxes),
    insurance: String(s.insurance),
    utilities: String(s.utilities),
    repairs_maintenance: String(s.repairs_maintenance),
    property_management: String(s.property_management),
    other_operating_expenses: String(s.other_operating_expenses),
    cap_rate: String(s.cap_rate),
  };
}

export default function PropertySearchScreen() {
  const [formData, setFormData] = useState<PropertyFormInput>(
    __DEV__ ? sampleFormStrings() : EMPTY_FORM,
  );
  const [searchExecuted, setSearchExecuted] = useState(false);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isBusy = isSearching || isSaving;

  const handleChange = (field: FormField, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (['address', 'city', 'state', 'zip'].includes(field)) {
      setSearchExecuted(false);
      setSearchMessage(null);
    }
  };

  const handleExecuteSearch = async () => {
    const locationError = validateSearchLocation(formData);
    if (locationError) {
      Alert.alert('Search', locationError);
      return;
    }

    setIsSearching(true);
    try {
      const result = await propertyApi.searchProperty({
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        zip: formData.zip.trim(),
      });
      setSearchExecuted(true);
      setSearchMessage(result.message);
    } catch (error) {
      Alert.alert('Search Failed', getApiErrorMessage(error, 'Could not execute property search'));
    } finally {
      setIsSearching(false);
    }
  };

  const handleSave = async () => {
    if (!searchExecuted) {
      Alert.alert('Search Required', 'Execute a property search before saving.');
      return;
    }

    const validationError = validatePropertyInput(formData);
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    setIsSaving(true);
    try {
      const result = await propertyApi.createProperty(toPropertyPayload(formData));
      try {
        await dealApi.createDeal({
          property_id: result.property.id,
          status: 'pipeline',
          property_type: toDealPropertyType('Multifamily'),
          entry_mode: 'manual',
        });
      } catch {
        // Property saved; deal creation can be retried from Deals.
      }
      Alert.alert(
        'Property Saved',
        `Server calculated results:\n\nNOI: ${formatCurrency(result.property.noi)}\nIndicated Value: ${formatCurrency(result.property.indicated_value)}\n\nA pipeline deal was created when possible.`,
      );
      setFormData(EMPTY_FORM);
      setSearchExecuted(false);
      setSearchMessage(null);
      router.back();
    } catch (error) {
      Alert.alert('Error', getApiErrorMessage(error, 'Failed to save property'));
    } finally {
      setIsSaving(false);
    }
  };

  const InputField = ({
    label,
    field,
    placeholder,
    keyboardType = 'default',
    disabled = false,
  }: {
    label: string;
    field: FormField;
    placeholder: string;
    keyboardType?: 'default' | 'numeric';
    disabled?: boolean;
  }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, disabled && styles.inputDisabled]}
        placeholder={placeholder}
        placeholderTextColor="#64748b"
        value={formData[field]}
        onChangeText={(val) => handleChange(field, val)}
        keyboardType={keyboardType}
        editable={!isBusy && !disabled}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Property Search</Text>
        <Text style={styles.subtitle}>
          Enter search criteria and execute the search. Until ATTOM is integrated, financial fields
          are entered manually after the search runs. Valuation (EGI, NOI, Indicated Value) is
          calculated server-side on save.
        </Text>

        <Text style={styles.sectionTitle}>1. Search criteria</Text>
        <Text style={styles.sectionHint}>Location fields exposed for user-driven property search.</Text>
        <InputField label="Address *" field="address" placeholder="123 Main St" />
        <InputField label="City *" field="city" placeholder="Seattle" />
        <View style={styles.row}>
          <View style={styles.halfField}>
            <InputField label="State *" field="state" placeholder="WA" />
          </View>
          <View style={styles.halfField}>
            <InputField label="ZIP *" field="zip" placeholder="98101" />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.searchButton, isBusy && styles.buttonDisabled]}
          onPress={handleExecuteSearch}
          disabled={isBusy}
        >
          {isSearching ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Execute Search</Text>
          )}
        </TouchableOpacity>

        {searchMessage ? (
          <View style={styles.searchBanner}>
            <Text style={styles.searchBannerTitle}>Search complete</Text>
            <Text style={styles.searchBannerText}>{searchMessage}</Text>
            <Text style={styles.searchBannerText}>
              Complete manual financial entry below, then save.
            </Text>
          </View>
        ) : null}

        {searchExecuted ? (
          <>
            <Text style={styles.sectionTitle}>2. Manual financial entry (until ATTOM)</Text>
            <Text style={styles.sectionHint}>
              These fields match CRE_Valuation_NOI_CapRate. ATTOM will pre-fill them when integrated.
            </Text>

            <Text style={styles.subsectionTitle}>Income</Text>
            <InputField
              label="Gross Rental Income"
              field="gross_rental_income"
              placeholder="177204"
              keyboardType="numeric"
            />
            <InputField label="Other Income" field="other_income" placeholder="4500" keyboardType="numeric" />
            <InputField label="Vacancy % (0–100)" field="vacancy_percent" placeholder="5" keyboardType="numeric" />

            <Text style={styles.subsectionTitle}>Operating Expenses</Text>
            <InputField label="Property Taxes" field="property_taxes" placeholder="12879" keyboardType="numeric" />
            <InputField label="Insurance" field="insurance" placeholder="0" keyboardType="numeric" />
            <InputField label="Utilities" field="utilities" placeholder="0" keyboardType="numeric" />
            <InputField
              label="Repairs & Maintenance"
              field="repairs_maintenance"
              placeholder="0"
              keyboardType="numeric"
            />
            <InputField
              label="Property Management"
              field="property_management"
              placeholder="0"
              keyboardType="numeric"
            />
            <InputField
              label="Other Operating Expenses"
              field="other_operating_expenses"
              placeholder="34664"
              keyboardType="numeric"
            />

            <Text style={styles.subsectionTitle}>Valuation</Text>
            <InputField label="Cap Rate % (> 0)" field="cap_rate" placeholder="6.23" keyboardType="numeric" />

            <TouchableOpacity
              style={[styles.button, isBusy && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={isBusy}
            >
              <Text style={styles.buttonText}>{isSaving ? 'Saving...' : 'Save Property'}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.lockedHint}>Run Execute Search to unlock financial entry fields.</Text>
        )}

        <TouchableOpacity onPress={() => router.back()} disabled={isBusy} style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scrollContent: { padding: 24, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#94a3b8', marginBottom: 24, lineHeight: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginTop: 8, marginBottom: 8 },
  subsectionTitle: { fontSize: 16, fontWeight: '600', color: '#e2e8f0', marginTop: 16, marginBottom: 8 },
  sectionHint: { fontSize: 13, color: '#64748b', marginBottom: 12, lineHeight: 18 },
  lockedHint: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 24,
    fontStyle: 'italic',
  },
  inputGroup: { marginBottom: 16 },
  label: { color: '#cbd5e1', marginBottom: 6, fontSize: 14 },
  input: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 14,
    color: '#fff',
    fontSize: 16,
  },
  inputDisabled: { opacity: 0.5 },
  row: { flexDirection: 'row' },
  halfField: { flex: 1, marginRight: 4 },
  searchButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#22c55e',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  searchBanner: {
    backgroundColor: '#1e3a5f',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  searchBannerTitle: { color: '#93c5fd', fontWeight: '600', marginBottom: 6, fontSize: 15 },
  searchBannerText: { color: '#cbd5e1', fontSize: 14, lineHeight: 20 },
  cancelButton: { marginTop: 16, alignItems: 'center' },
  cancelButtonText: { color: '#ef4444', fontSize: 16 },
});
