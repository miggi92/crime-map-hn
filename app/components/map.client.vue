<template>
    <div class="w-full h-full min-h-[400px]">
        <LMap :zoom="zoom" :max-zoom="15" :center="[49.1417, 9.2222]" :use-global-leaflet="true" @ready="onMapReady">
            <LTileLayer
url="https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png"
                attribution="&amp;copy; <a href=&quot;https://www.openstreetmap.org/copyright&quot;>OpenStreetMap</a> contributors &amp;copy; <a href=&quot;https://carto.com/attributions&quot;>CARTO</a>"
                layer-type="base" name="Dark Map" />
        </LMap>
    </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import { LMap, LTileLayer } from '@vue-leaflet/vue-leaflet'
import type { MapLocation } from '~/types/map-location'

const props = withDefaults(defineProps<{
    locations?: MapLocation[]
}>(), {
    locations: () => [],
})

type LeafletMarker = {
    bindPopup: (content: string) => LeafletMarker
}

type LeafletMarkerCluster = {
    addLayer: (layer: LeafletMarker) => void
    addLayers: (layers: LeafletMarker[]) => void
    clearLayers: () => void
}

type LeafletMap = {
    addLayer: (layer: LeafletMarkerCluster) => void
}

type LeafletApi = {
    marker: (latLng: [number, number], options?: { title?: string }) => LeafletMarker
    markerClusterGroup?: (options?: object) => LeafletMarkerCluster
}

const zoom = ref(9)
const leaflet = ref<LeafletApi | null>(null)
const markerCluster = ref<LeafletMarkerCluster | null>(null)

const leafletModule = await import('leaflet')
const L = ((leafletModule as unknown as { default?: LeafletApi }).default || leafletModule) as unknown as LeafletApi
    ; (window as Window & { L?: LeafletApi }).L = L

// @ts-expect-error leaflet.markercluster exposes no usable module types here.
await import('leaflet.markercluster')

function syncMarkers() {
    if (!leaflet.value || !markerCluster.value) {
        return
    }

    markerCluster.value.clearLayers()

    const markers = props.locations.map(location => {
        const marker = leaflet.value!.marker([location.lat, location.lng], { title: location.name })

        if (location.popup) {
            marker.bindPopup(location.popup)
        }

        return marker
    })

    markerCluster.value.addLayers(markers)
}

const onMapReady = (leafletObject: LeafletMap) => {
    const mapLeaflet = (window as Window & { L?: LeafletApi }).L

    if (!mapLeaflet) {
        throw new Error('Leaflet konnte nicht initialisiert werden.')
    }

    leaflet.value = mapLeaflet

    const cluster = mapLeaflet.markerClusterGroup?.({
        chunkedLoading: true,
        disableClusteringAtZoom: 14,
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
    })

    if (!cluster) {
        throw new Error('leaflet.markercluster konnte nicht initialisiert werden.')
    }

    markerCluster.value = cluster
    leafletObject.addLayer(cluster)
    syncMarkers()
}

watch(() => props.locations, syncMarkers, { deep: true })
</script>

<style></style>