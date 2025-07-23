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

type AnnotationEntry = {
  chemicals?: { name?: string }[];
  levelOfEvidence?: { term?: string };
  clinicalAnnotationLevel?: { term?: string };
  pediatric?: boolean;
};

/**
 * Extracts the level of evidence from an annotation entry.
 * It first checks `levelOfEvidence.term`, and falls back to `clinicalAnnotationLevel.term`.
 *
 * @param {AnnotationEntry} entry - A clinical annotation entry object.
 * @returns {string | undefined} The evidence level term, if present.
 */
function getEvidenceLevel(entry: AnnotationEntry): string | undefined {
  return entry.levelOfEvidence?.term || entry.clinicalAnnotationLevel?.term;
}

/**
 * Fetches clinical annotation entries for a given gene using the public API.
 * Asserts that the response is valid (not 404 and successful).
 *
 * @param {APIRequestContext} request - The Playwright API request context.
 * @param {string} gene - The gene symbol to query.
 * @returns {Promise<AnnotationEntry[]>} An array of clinical annotation entries.
 */
async function fetchGeneAnnotations(request: APIRequestContext, gene: string):Promise<AnnotationEntry[]> {
  const res = await request.get(`${BASE_URL}/v1/data/clinicalAnnotation?location.genes.symbol=${gene}`);
  expect(res.status(), `${gene}: non-existent gene or variant`).not.toBe(404);
  expect(res.ok()).toBeTruthy();
  return (await res.json()).data || [];
}

test.describe.configure({ mode: 'parallel' });

const genes = ['CYP2D6', 'FAKEGENE123', 'CYP2C19'];

for (const gene of genes) {
  test.describe('Gene: ${gene}', () => {
    let data: AnnotationEntry[];

    test.beforeAll(async ({request }) => {
      data = await fetchGeneAnnotations(request, gene);
  });
    
  test('Gene ${gene} - should contain Clopidogrel if exists', async ({ request }) => {
    const found = data.some(entry =>
            (entry.chemicals || []).some(drug => {
              if (drug.name?.includes('Clopidogrel')) {
                const level = getEvidenceLevel(entry);
                expect(level).toBeTruthy();
                test.info().log('${gene} → Clopidogrel found with level: ${level}');
                return true;
              }
              return false;
            })
          );
          expect(found).toBeTruthy();
        });

  test(`Gene ${gene} - should have at least 5 pediatric drugs`, async ({ request }) => {
    const count = data.filter(entry => entry.pediatric === true).length;
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test(`Gene ${gene} - should have valid evidence levels`, async ({ request }) => {    
    for (const entry of data) {
      const level = getEvidenceLevel(entry);
      expect(level).toBeTruthy();
      expect(validEvidenceLevels).toContain(level);
    }
  });
}
