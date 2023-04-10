<script>
  import mapboxgl from 'mapbox-gl';
  import { onMount } from 'svelte';
  export let item;

  let map;

  onMount(() => {
    mapboxgl.accessToken = 'pk.eyJ1IjoibWljYWVsYS1yb3NhZGlvIiwiYSI6ImNsZzlsN2s1eTBxZXIzZHJ2YTI1YjJ1ejkifQ.bT9A2q8RKkiKPfCMVh63jQ';

    map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [Number(item.counties[0].facilities[0].sub_last.lon_sub), Number(item.counties[0].facilities[0].sub_last.lat_sub)],
      zoom: 6
    });

    item.counties.forEach(county => {
        county.facilities.forEach(facility => {
          const lat = Number(facility.sub_last.lat_sub);
          const lon = Number(facility.sub_last.lon_sub);
          console.log([lat, lon]);

          const el = document.createElement('div');
          el.className = 'marker';
          // el.textContent = facility.name;

          new mapboxgl.Marker(el)
            .setLngLat([lon, lat])
            .setPopup(
                    new mapboxgl.Popup({ offset: 25 }) // add popups
                          .setHTML(`<h3>${facility.name}</h3>`))
            .addTo(map);
          
            el.addEventListener('click', () => {
              alert(`Clicked on ${facility.name}`);
            });
        })
    });
  });
</script>

<div id="map" style="height: 400px;"></div>
  
<style>
  :global(.marker) {
    background-color: #3366ff;
    background-image: url("/viewer/images/mapbox-marker-icon-blue.svg");
    background-size:  cover;
    width:            20px;
    height:           20px;
    border-radius:    10%;
    cursor:           pointer;
  }

  .mapboxgl-popup {
    max-width:        200px;
  }

  .mapboxgl-popup-content h3 {
    text-align:       center;
    font-size:        22px;
  }
</style>