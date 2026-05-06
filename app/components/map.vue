<template>
  <div class="w-auto h-[600px]">
    <LMap ref="map" :zoom="zoom" :max-zoom="15" :center="[49.1417, 9.2222]" :use-global-leaflet="true"
      @ready="onMapReady">
      <LTileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&amp;copy; <a href=&quot;https://www.openstreetmap.org/&quot;>OpenStreetMap</a> contributors"
        layer-type="base" name="OpenStreetMap" />
    </LMap>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const zoom = ref(10)
const map = ref(null) as any

const locations = [
  { name: 'Heilbronn', lat: 49.1427, lng: 9.2222 },
  { name: 'Weinsberg', lat: 49.1518, lng: 9.2857 },
  { name: 'Weinsberg1', lat: 49.1518, lng: 9.2857 },
  { name: 'Weinsberg2', lat: 49.1518, lng: 9.2857 },
  { name: 'Weinsberg3', lat: 49.1518, lng: 9.2857 },
  { name: 'Weinsberg4', lat: 49.1518, lng: 9.2857 },
]

const onMapReady = () => {
  console.log('map ready')
  useLMarkerCluster({
    leafletObject: map.value.leafletObject,
    markers: locations
  });
}
</script>

<style></style>