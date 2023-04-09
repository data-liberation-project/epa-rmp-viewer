<script>
  import { Map, Geocoder, Marker, controls } from '@beyonk/svelte-mapbox'
  export let item;
  const { GeolocateControl, NavigationControl, ScaleControl } = controls
  
  let mapComponent;
  let coordinates = []; // store coordinates as object
  
  for (let county of item.counties) {
    for (let facility of county.facilities) {
      //console.log('latitute: ', facility.sub_last.lat_sub)
      //console.log('longitude: ', facility.sub_last.lon_sub)
      coordinates.push([Number(facility.sub_last.lon_sub), Number(facility.sub_last.lat_sub)])
    }
  }
  //console.log(coordinates)
  
</script>


<Map
  accessToken="pk.eyJ1IjoibWljYWVsYS1yb3NhZGlvIiwiYSI6ImNsZzlsN2s1eTBxZXIzZHJ2YTI1YjJ1ejkifQ.bT9A2q8RKkiKPfCMVh63jQ" 
  style="mapbox://styles/mapbox/outdoors-v11"
  bind:this={mapComponent}
  center={[-74.5, 40]}
  zoom={7}
>
  <div class='mapboxgl-map'> 
    {#each item.counties as location}
      {#each location.facilities as facility}
        <Marker
          lat = {facility.sub_last.lat_sub} 
          lng = {facility.sub_last.lon_sub}>
            <div>{facility.name}: {facility.sub_last.lat_sub}, {facility.sub_last.lon_sub}</div>
        </Marker>
      {/each}
    {/each}
  </div>
</Map>

<style>
  :global(.mapboxgl-map) {
    height: 400px;
  }
  :global(.marker) {
    background-color: red;
    width: 20px;
    height: 20px;
    border-radius: 50%;
  }
  
</style>
