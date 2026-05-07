import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchNewsChannel, buildNewsItem } from '../../../../../server/utils/presseportal-news'

// Auto-import functions are provided globally in Nuxt context or imported from #imports
// In tests, we need to mock these globals or imports.
vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
vi.stubGlobal('getQuery', vi.fn())
vi.stubGlobal('createError', (err: unknown) => err)

// We also mock h3 just in case it's explicitly imported
vi.mock('h3', async () => {
  return {
    defineEventHandler: (handler: unknown) => handler,
    getQuery: vi.fn(),
    createError: (err: unknown) => err,
  }
})

// Mock the dependencies
vi.mock('../../../../../server/utils/presseportal-news', () => ({
  fetchNewsChannel: vi.fn(),
  buildNewsItem: vi.fn()
}))

describe('api/prp/news', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let handler: any

  beforeEach(async () => {
    vi.clearAllMocks()

    // We dynamically import the handler after mocks are set up
    const route = await import('../../../../../server/api/prp/news')
    handler = route.default
  })

  it('should return successfully parsed news items', async () => {
    // Setup getQuery mock
    vi.stubGlobal('getQuery', () => ({ full: '0', categories: '0' }))

    // Setup fetchNewsChannel mock
    vi.mocked(fetchNewsChannel).mockResolvedValue({
      channel: {
        title: ['Mock Feed Title'],
        link: ['http://mock.link'],
        description: ['Mock Description'],
        language: ['de'],
        item: [{ raw: 'item1' }, { raw: 'item2' }]
      },
      channelCategory: 'Mock Category'
    })

    // Setup buildNewsItem mock
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(buildNewsItem).mockImplementation(async (rawItem: any) => ({
      title: `Processed ${rawItem.raw}`,
      // other fields would normally be mapped here...
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const event = { context: {} } as any
    const response = await handler(event)

    expect(response.title).toBe('Mock Feed Title')
    expect(response.category).toBe('Mock Category')
    expect(response.item).toHaveLength(2)
    expect(response.item[0].title).toBe('Processed item1')
    expect(response.item[1].title).toBe('Processed item2')

    // Verify buildNewsItem was called with false for options
    expect(buildNewsItem).toHaveBeenCalledWith(
      { raw: 'item1' },
      'Mock Category',
      { includeFullArticle: false, includeArticleCategories: false }
    )
  })

  it('should parse boolean options from query', async () => {
    vi.stubGlobal('getQuery', () => ({ full: 'true', categories: '1' }))

    vi.mocked(fetchNewsChannel).mockResolvedValue({
      channel: { item: [{ raw: 'item1' }] },
      channelCategory: 'Mock Category'
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(buildNewsItem).mockResolvedValue({} as any)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await handler({} as any)

    expect(buildNewsItem).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      { includeFullArticle: true, includeArticleCategories: true }
    )
  })

  it('should throw an error if fetchNewsChannel fails', async () => {
    vi.stubGlobal('getQuery', () => ({}))

    vi.mocked(fetchNewsChannel).mockRejectedValue(new Error('Network error'))

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await handler({} as any)
      expect.fail('Should have thrown')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((e as any).statusCode).toBe(500)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((e as any).statusMessage).toBe('Error fetching RSS feed')
    }
  })
})
