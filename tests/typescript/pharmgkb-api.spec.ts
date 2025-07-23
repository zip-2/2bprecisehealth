import { test, expect, APIRequestContext } from '@playwright/test';

const BASE_URL = 'https://api.pharmgkb.org';

const validEvidenceLevels = ['1A', '1B', '2A', '2B', '3', '4', 'N/A'];

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
