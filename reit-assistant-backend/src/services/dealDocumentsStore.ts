export type DealDocumentRecord = {
  id: string;
  name: string;
  type: string;
  size: string;
};

const documentsByDeal = new Map<string, DealDocumentRecord[]>();

function storeKey(tenantId: string, dealId: string) {
  return `${tenantId}:${dealId}`;
}

export function getDealDocuments(tenantId: string, dealId: string): DealDocumentRecord[] {
  return [...(documentsByDeal.get(storeKey(tenantId, dealId)) ?? [])];
}

export function addDealDocument(
  tenantId: string,
  dealId: string,
  doc: DealDocumentRecord,
): DealDocumentRecord {
  const key = storeKey(tenantId, dealId);
  const existing = documentsByDeal.get(key) ?? [];
  const next = [...existing, doc];
  documentsByDeal.set(key, next);
  return doc;
}
