import { supabaseAdmin } from '../src/config/db';
import { evaluateProperty, recommendationToDb } from '../src/services/analysisEngine';

const token = process.argv[2];
const propertyId = process.argv[3];

if (!token || !propertyId) {
  console.error('Usage: npx tsx scripts/trace-analyze-insert.ts <jwt> <property_id>');
  process.exit(1);
}

async function main() {
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    console.log('AUTH ERROR:', authError?.message);
    return;
  }

  const tenantId = user.user_metadata?.tenant_id as string | undefined;
  console.log('tenantId from JWT user:', tenantId);

  const { data: property, error: propertyError } = await supabaseAdmin
    .from('properties')
    .select('id, tenant_id')
    .eq('tenant_id', tenantId ?? '')
    .eq('id', propertyId)
    .maybeSingle();

  console.log('property lookup:', property, 'error:', propertyError?.message);

  if (!property) {
    console.log('STOP: property not found for tenant — insert skipped in analyze route');
    return;
  }

  const input = {
    address: 'Trace',
    propertyType: 'Multifamily',
    yearBuilt: 2000,
    sqft: 10000,
    units: 20,
    purchasePrice: 1369230,
    estimatedValue: 1369230,
    noi: 89000,
    occupancy: 90,
    loanAmount: 500000,
    interestRate: 5.75,
    loanTerm: 30,
  };

  const result = evaluateProperty(input);

  const { data, error } = await supabaseAdmin
    .from('analysis_results')
    .insert({
      tenant_id: tenantId,
      property_id: propertyId,
      score: result.score,
      recommendation: recommendationToDb(result.recommendation),
      triggered_rules: {
        triggered: result.triggeredRules,
        passed: result.passedRules,
        risks: result.risks,
        opportunities: result.opportunities,
        input,
        reasoning: result.reasoning,
        dscr: result.dscr,
      },
      indicated_value: input.estimatedValue,
      noi: input.noi,
      cap_rate: result.capRate,
    })
    .select('id, created_at')
    .single();

  if (error) {
    console.log('INSERT FAILED:', error.message);
    console.log('code:', error.code, 'details:', error.details, 'hint:', error.hint);
  } else {
    console.log('INSERT OK:', data);
  }
}

main().catch((err) => console.error(err));
