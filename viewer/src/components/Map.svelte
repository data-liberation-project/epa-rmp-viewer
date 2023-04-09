<script>
  import { Map, Geocoder, Marker, controls } from '@beyonk/svelte-mapbox'
  import facility from './../../public/data/facilities/by-state/AK.json';
  export let item;
  
  let mapComponent;
  const { GeolocateControl, NavigationControl, ScaleControl } = controls
  console.log('coordinates:', item.counties)

  /*
  onMount(() => {
    mapboxgl.accessToken = 'pk.eyJ1IjoibWljYWVsYS1yb3NhZGlvIiwiYSI6ImNsYXF1eXg4azAwZjQzeW92cjJrMDJwOXYifQ.NOmLvhjeSluUXlAlqmuDrgd';
    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-74.5, 40],
      zoom: 9
    });
  });
  */
</script>


<Map
accessToken="pk.eyJ1IjoibWljYWVsYS1yb3NhZGlvIiwiYSI6ImNsZzlsN2s1eTBxZXIzZHJ2YTI1YjJ1ejkifQ.bT9A2q8RKkiKPfCMVh63jQ" 
  bind:this={mapComponent} 
  options={{ scrollZoom: false }}
>

</Map>

<style>
  :global(.mapboxgl-map) {
      height: 200px;
  }
</style>
