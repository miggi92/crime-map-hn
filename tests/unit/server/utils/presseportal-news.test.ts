import { describe, it, expect, vi } from 'vitest'
import { buildNewsItem, fetchNewsChannel, findRawItemById } from '../../../../server/utils/presseportal-news'

// Mock $fetch globally for testing
global.$fetch = vi.fn()

describe('presseportal-news util', () => {

  describe('findRawItemById', () => {
    it('should find item by guid', () => {
      const items = [{ guid: ['http://example.com/123'] }, { guid: ['http://example.com/456'] }]
      const found = findRawItemById(items, '123')
      expect(found).toEqual(items[0])
    })

    it('should find item by link', () => {
      const items = [{ link: ['http://example.com/123'] }, { link: ['http://example.com/456'] }]
      const found = findRawItemById(items, '456')
      expect(found).toEqual(items[1])
    })

    it('should return undefined if not found', () => {
      const items = [{ link: ['http://example.com/123'] }]
      const found = findRawItemById(items, '999')
      expect(found).toBeUndefined()
    })
  })

  describe('buildNewsItem', () => {
    it('should map basic fields correctly', async () => {
      const rawItem = {
        title: ['Test Title'],
        description: ['Test Description'],
        guid: ['http://guid.com'],
        link: ['http://link.com'],
        pubDate: ['Thu, 01 Jan 1970 00:00:00 GMT'],
        author: ['Test Author']
      }

      const item = await buildNewsItem(rawItem, 'Test Category')

      expect(item.title).toBe('Test Title')
      expect(item.description).toBe('Test Description')
      expect(item.guid).toBe('http://guid.com')
      expect(item.link).toBe('http://link.com')
      expect(item.date).toBe('Thu, 01 Jan 1970 00:00:00 GMT')
      expect(item.category).toBe('Test Category')
      expect(item.authors[0].description).toBe('Test Author')
    })

    it('should fetch full article and categories when options are set', async () => {
      const rawItem = { link: ['http://example.com'] }

      // Mock the HTML response for full article and categories
      const mockHtml = `
        <script type="application/ld+json">
          {"@type": "NewsArticle", "articleBody": "This is the full article body"}
        </script>
        <h3>Orte in dieser Meldung</h3>
        <ul class="tags"><li data-label="Berlin">Berlin</li></ul>
        <h3>Themen in dieser Meldung</h3>
        <ul class="tags"><li data-label="Crime">Crime</li></ul>
        <meta name="news_keywords" content="Polizei, Diebstahl">
      `

      // Setup the mock implementation just for this test
      vi.mocked(global.$fetch).mockResolvedValueOnce(mockHtml)

      const item = await buildNewsItem(rawItem, 'Test Category', {
        includeFullArticle: true,
        includeArticleCategories: true
      })

      expect(global.$fetch).toHaveBeenCalledWith('http://example.com', { responseType: 'text' })
      expect(item.content).toBe('This is the full article body')
      expect(item.articleCategories?.places).toContain('Berlin')
      expect(item.articleCategories?.topics).toContain('Crime')
      expect(item.articleCategories?.keywords).toEqual(['Polizei', 'Diebstahl'])
    })
  })

  describe('fetchNewsChannel', () => {
    it('should fetch and parse RSS channel correctly', async () => {
      const mockXml = `
        <?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <title>Test Channel</title>
            <category>Test Category</category>
            <item>
              <title>Test Item</title>
            </item>
          </channel>
        </rss>
      `

      vi.mocked(global.$fetch).mockResolvedValueOnce(mockXml)

      const result = await fetchNewsChannel()

      expect(result.channel.title?.[0]).toBe('Test Channel')
      expect(result.channelCategory).toBe('Test Category')
      expect(result.channel.item?.length).toBe(1)
    })

    it('should throw error if channel is missing', async () => {
      vi.mocked(global.$fetch).mockResolvedValueOnce('<rss></rss>')

      // Nuxt createError will be thrown, need to catch and verify it
      try {
        await fetchNewsChannel()
        expect.fail('Should have thrown')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((e as any).statusCode).toBe(500)
      }
    })
  })
})
