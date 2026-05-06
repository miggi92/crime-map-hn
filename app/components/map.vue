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
import { ref } from 'vue'

type LeafletMarker = {
  bindPopup: (content: string) => LeafletMarker
}

type LeafletMarkerCluster = {
  addLayer: (layer: LeafletMarker) => void
}

type LeafletMap = {
  addLayer: (layer: LeafletMarkerCluster) => void
}

type LeafletApi = {
  marker: (latLng: [number, number], options?: { title?: string }) => LeafletMarker
  markerClusterGroup?: (options?: object) => LeafletMarkerCluster
}

type Location = {
  name: string
  lat: number
  lng: number
  popup?: string
}

const zoom = ref(10)

const locations: Location[] = [
  { name: 'Heilbronn', lat: 49.1427, lng: 9.2222, popup: '<h1>This is a test</h1>' },
  { name: 'Weinsberg', lat: 49.1518, lng: 9.2857 },
  { name: 'Weinsberg1', lat: 49.1518, lng: 9.2857 },
  { name: 'Weinsberg2', lat: 49.1518, lng: 9.2857 },
  { name: 'Weinsberg3', lat: 49.1518, lng: 9.2857 },
  { name: 'Weinsberg4', lat: 49.1518, lng: 9.2857 },
]

const onMapReady = async (leafletObject: LeafletMap) => {
  // @ts-expect-error leaflet.markercluster exposes no usable module types here.
  await import('leaflet.markercluster')

  const L = window.L as LeafletApi

  const markerCluster = L.markerClusterGroup?.()

  if (!markerCluster) {
    throw new Error('leaflet.markercluster konnte nicht initialisiert werden.')
  }

  for (const location of locations) {
    const marker = L.marker([location.lat, location.lng], { title: location.name })

    if (location.popup) {
      marker.bindPopup(location.popup)
    }

    markerCluster.addLayer(marker)
  }

  leafletObject.addLayer(markerCluster)
}
</script>

<style></style>