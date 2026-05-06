export interface FixedCoordinates {
    lat: number
    lng: number
}

export const locationCoordinateMap: Record<string, FixedCoordinates> = {
    Heilbronn: { lat: 49.1427, lng: 9.2222 },
    'Landkreis Heilbronn': { lat: 49.1399, lng: 9.2205 },
    Weinsberg: { lat: 49.1518, lng: 9.2876 },
    Neckarsulm: { lat: 49.1892, lng: 9.2253 },
    'Bad Friedrichshall': { lat: 49.2298, lng: 9.2109 },
    'Bad Rappenau': { lat: 49.2404, lng: 9.1014 },
    Eppingen: { lat: 49.1365, lng: 8.9123 },
    Schwaigern: { lat: 49.1374, lng: 9.0537 },
    Leingarten: { lat: 49.1468, lng: 9.1159 },
    'Lauffen am Neckar': { lat: 49.0756, lng: 9.1458 },
    Brackenheim: { lat: 49.0797, lng: 9.0647 },
    Obersulm: { lat: 49.1377, lng: 9.4227 },
    Ilsfeld: { lat: 49.0566, lng: 9.2455 },
    Möckmühl: { lat: 49.3245, lng: 9.3585 },
    'Hardthausen am Kocher': { lat: 49.2476, lng: 9.3904 },
    'Mosbach': { lat: 49.3528, lng: 9.1506 },
    'Hardheim': { lat: 49.6106, lng: 9.4739 },
    'Walldürn': { lat: 49.5578, lng: 9.4505 },
    'Neudenau': { lat: 49.2548, lng: 9.4907 },
    'Oberstenfeld': { lat: 49.0795, lng: 9.3166 },
    'Neckarwestheim': { lat: 49.0982, lng: 9.2041 },
}

function normalizeLocationName(value: string): string {
    return value
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/^stadt\s+/i, '')
        .replace(/^gemeinde\s+/i, '')
}

export function getCoordinatesForLocation(place: string): FixedCoordinates | undefined {
    const normalizedPlace = normalizeLocationName(place)

    if (locationCoordinateMap[normalizedPlace]) {
        return locationCoordinateMap[normalizedPlace]
    }

    const matchedEntry = Object.entries(locationCoordinateMap).find(([key]) => {
        return normalizeLocationName(key).toLowerCase() === normalizedPlace.toLowerCase()
    })

    return matchedEntry?.[1]
}