export interface ArticleCategories {
    places: string[]
    topics: string[]
    keywords: string[]
}

export interface NewsItem {
    guid: string
    title: string
    description?: string
    content?: string
    articleCategories?: ArticleCategories
    category?: string
    source?: {
        name: string
        url?: string
    }
    link?: string
    date?: string
    authors?: [{
        name: string
        description?: string
        avatar?: {
            src: string
            alt: string
        }
    }]
}

export interface NewsFeed {
    title: string
    link: string
    description: string
    language: string
    category: string
    item: NewsItem[]
}
