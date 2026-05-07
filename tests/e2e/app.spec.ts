import { test, expect } from '@playwright/test';

test.describe('App functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the news API request to avoid timeouts/rate-limits in tests
    await page.route('/api/prp/news*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          title: 'Mock News Feed',
          category: 'Mock Category',
          item: [
            {
              title: 'Mock Article',
              guid: '123',
              link: 'http://example.com/123',
              articleCategories: {
                places: ['Heilbronn'],
                topics: ['Mock Topic']
              }
            }
          ]
        })
      });
    });

    // Mock geocoding to return dummy coordinates
    await page.route('/api/locations/geocode*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          Heilbronn: { lat: 49.1427, lng: 9.2109 }
        })
      });
    });
  });

  test('should load successfully and display the map on homepage', async ({ page }) => {
    // Navigate to the main page
    await page.goto('/');

    const heading = page.locator('h1', { hasText: 'Crime map Heilbronn' });
    await expect(heading).toBeVisible();
  });

  test('should load the map page successfully', async ({ page }) => {
    // Navigate with a specific timeout and bypass SSR issues if they exist
    // and wait until domcontentloaded
    await page.goto('/map', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Wait for the map container to appear eventually, indicating the page mounted
    // (We also bumped the playwright test timeout in case of slow dev server builds)
    const categorySelect = page.locator('button', { hasText: 'Kategorien filtern' });
    await expect(categorySelect).toBeVisible({ timeout: 30000 });

    // Wait until leaflet mapping code instantiates the map and it's visible.
    const mapContainer = page.locator('.vue-leaflet-map').first();
    await expect(mapContainer).toBeVisible();

    // Since map data rendering goes through layers/clusters, we check for marker cluster
    // or standard leaflet marker classes that indicate our markers have populated.
    const marker = page.locator('.leaflet-marker-icon, .marker-cluster').first();
    await expect(marker).toBeVisible({ timeout: 15000 });
  });
});
