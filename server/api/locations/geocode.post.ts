interface GeocodeRequestBody {
    places?: string[]
}

interface NominatimResult {
    lat: string
    lon: string
}

interface GeocodeResponseItem {
    lat: number
    lng: number
}

function normalizePlace(place: string): string {
    return place.trim().replace(/\s+/g, ' ')
}

async function geocodePlace(place: string): Promise<GeocodeResponseItem | null> {
    const storage = useStorage('data')
    const normalizedPlace = normalizePlace(place)
    const cacheKey = `geocode:${normalizedPlace.toLowerCase()}`
    const cached = await storage.getItem<GeocodeResponseItem | null>(cacheKey)

    if (cached !== null && cached !== undefined) {
        return cached
    }

    const result = await $fetch<NominatimResult[]>('https://nominatim.openstreetmap.org/search', {
        query: {
            format: 'jsonv2',
            limit: 1,
            countrycodes: 'de',
            q: `${normalizedPlace}, Baden-Wuerttemberg, Deutschland`,
        },
        headers: {
            'accept-language': 'de',
            'user-agent': 'crime-map-hn/0.0.1 (nuxt app geocoding)',
        },
    })

    const firstResult = result[0]
    const coordinates = firstResult
        ? {
            lat: Number(firstResult.lat),
            lng: Number(firstResult.lon),
        }
        : null

    await storage.setItem(cacheKey, coordinates)

    return coordinates
}

export default defineEventHandler(async (event) => {
    const body = await readBody<GeocodeRequestBody>(event)
    const uniquePlaces = Array.from(new Set((body.places || []).map(normalizePlace).filter(Boolean)))

    const entries = await Promise.all(uniquePlaces.map(async (place) => {
        const coordinates = await geocodePlace(place)
        return [place, coordinates] as const
    }))

    return Object.fromEntries(entries.filter((entry): entry is [string, GeocodeResponseItem] => Boolean(entry[1])))
})