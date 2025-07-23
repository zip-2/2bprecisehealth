import { test, expect, APIRequestContext } from '@playwright/test';

const BASE_URL = 'https://api.pharmgkb.org';

enum EvidenceLevel {
  LEVEL_1A = "1A",
  LEVEL_1B = "1B",
  LEVEL_2A = "2A",
  LEVEL_2B = "2B",
  LEVEL_3 = "3",
  LEVEL_4 = "4",
  NA = "N/A"
}
const validEvidenceLevels = Object.values(EvidenceLevel);

test.describe.configure({ mode: 'parallel' });

const genes = ['CYP2D6', 'FAKEGENE123', 'CYP2C19'];

for (const gene of genes) {
  test(`Gene ${gene} - should contain Clopidogrel if exists`, async ({ request }) => {
    const res = await request.get(`${BASE_URL}/v1/data/clinicalAnnotation?location.genes.symbol=${gene}`);
    if (res.status() === 404) test.fail(true, `${gene}: non-existent gene or variant`);
    expect(res.ok()).toBeTruthy();
    const data = (await res.json()).data || [];

    const found = data.some(entry =>
      (entry.chemicals || []).some((drug: any) => drug.name?.includes('Clopidogrel'))
    );
    expect(found).toBeTruthy();
  });

  test(`Gene ${gene} - should have at least 5 pediatric drugs`, async ({ request }) => {
    const res = await request.get(`${BASE_URL}/v1/data/clinicalAnnotation?location.genes.symbol=${gene}`);
    if (res.status() === 404) test.fail(true, `${gene}: non-existent gene or variant`);
    expect(res.ok()).toBeTruthy();
    const data = (await res.json()).data || [];

    const count = data.filter(entry => entry.pediatric === true).length;
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test(`Gene ${gene} - should have valid evidence levels`, async ({ request }) => {
    const res = await request.get(`${BASE_URL}/v1/data/clinicalAnnotation?location.genes.symbol=${gene}`);
    if (res.status() === 404) test.fail(true, `${gene}: non-existent gene or variant`);
    expect(res.ok()).toBeTruthy();
    const data = (await res.json()).data || [];

    for (const entry of data) {
      const level = entry.levelOfEvidence?.term || entry.clinicalAnnotationLevel?.term;
      expect(level).toBeTruthy();
      expect(validEvidenceLevels).toContain(level);
    }
  });
}
