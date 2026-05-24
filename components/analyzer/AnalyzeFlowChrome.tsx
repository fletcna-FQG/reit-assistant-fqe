import { PropertyContextHeader } from '@/components/analyzer/PropertyContextHeader';
import { StepIndicator } from '@/components/analyzer/StepIndicator';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { ANALYZE_FLOW_STEP_SHORT, ANALYZE_FLOW_STEPS } from '@/constants/analyzeFlow';
import { View } from 'react-native';

type AnalyzeFlowChromeProps = {
  title: string;
  currentStep: number;
  showBack?: boolean;
  onBack?: () => void;
  /** Property context — omit on data-entry steps where address fields are on the form. */
  context?: {
    address: string;
    city: string;
    state: string;
    zip: string;
    propertyType: string;
  };
};

/** Sticky, compact header block: title → steps → optional property context. */
export function AnalyzeFlowChrome({
  title,
  currentStep,
  showBack = true,
  onBack,
  context,
}: AnalyzeFlowChromeProps) {
  return (
    <View style={{ flexGrow: 0, flexShrink: 0 }}>
      <ScreenHeader title={title} showBack={showBack} onBack={onBack} />
      <StepIndicator
        steps={ANALYZE_FLOW_STEPS}
        shortSteps={ANALYZE_FLOW_STEP_SHORT}
        currentStep={currentStep}
      />
      {context ? (
        <PropertyContextHeader
          address={context.address}
          city={context.city}
          state={context.state}
          zip={context.zip}
          propertyType={context.propertyType}
        />
      ) : null}
    </View>
  );
}
