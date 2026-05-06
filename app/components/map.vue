<template>
  <div class="w-auto h-[600px]">
    <LMap :zoom="zoom" :max-zoom="15" :center="[49.1417, 9.2222]" :use-global-leaflet="true" @ready="onMapReady">
      <LTileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&amp;copy; <a href=&quot;https://www.openstreetmap.org/&quot;>OpenStreetMap</a> contributors"
        layer-type="base" name="OpenStreetMap" />
    </LMap>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'

export type MapLocation = {
  name: string
  lat: number
  lng: number
  popup?: string
}

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
  clearLayers: () => void
}

type LeafletMap = {
  addLayer: (layer: LeafletMarkerCluster) => void
}

type LeafletApi = {
  marker: (latLng: [number, number], options?: { title?: string }) => LeafletMarker
  markerClusterGroup?: (options?: object) => LeafletMarkerCluster
}

const zoom = ref(10)
const leaflet = ref<LeafletApi | null>(null)
const markerCluster = ref<LeafletMarkerCluster | null>(null)

function syncMarkers() {
  if (!leaflet.value || !markerCluster.value) {
    return
  }

  markerCluster.value.clearLayers()

  for (const location of props.locations) {
    const marker = leaflet.value.marker([location.lat, location.lng], { title: location.name })

    if (location.popup) {
      marker.bindPopup(location.popup)
    }

    markerCluster.value.addLayer(marker)
  }
}

const onMapReady = async (leafletObject: LeafletMap) => {
  // @ts-expect-error leaflet.markercluster exposes no usable module types here.
  await import('leaflet.markercluster')

  const L = window.L as LeafletApi
  leaflet.value = L

  const cluster = L.markerClusterGroup?.()

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