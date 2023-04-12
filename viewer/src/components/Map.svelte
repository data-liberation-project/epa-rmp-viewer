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

    // Add zoom control to the map
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    item.counties.forEach(county => {
        county.facilities.forEach(facility => {
          let lat = Number(facility.sub_last.lat_sub);
          let lon = Number(facility.sub_last.lon_sub);
          console.log([lat, lon]);

          const el = document.createElement('div');
          el.className = 'marker';

          // Add marker to the map
          const marker = new mapboxgl.Marker()
            .setLngLat([lon, lat])
            .addTo(map);

          // Add popup to the marker
          const popup = new mapboxgl.Popup({
              closeOnClick: false,
              closeButton: false
          });

          // Show popup on marker hover
          marker.getElement().addEventListener('mouseenter', () => {
              map.getCanvas().style.cursor = 'pointer';
              popup.setLngLat(marker.getLngLat()).setHTML(`<p>${facility.name}</p>`).addTo(map);
          });

          // Hide popup on marker leave
          marker.getElement().addEventListener('mouseleave', () => {
              map.getCanvas().style.cursor = '';
              popup.remove();
          });
        })
    });
  });
</script>

<div id="map">
  <!-- <div id="left" class="sidebar flex-center left collapsed">
    <div class="sidebar-content rounded-rect flex-center">
    Left Sidebar
      <div class="sidebar-toggle rounded-rect left" onclick="toggleSidebar('left')">
      &rarr;
      </div>
    </div>
  </div> -->
</div>
  
<style>
  :global(.marker) {
    background-image: url("/viewer/public/images/mapbox-marker-icon-blue.svg");
    background-size:  cover;
    width:            20px;
    height:           20px;
    border-radius:    10%;
    cursor:           pointer !important;
  }

  #map { 
    position: absolute; 
    top: 0; 
    bottom: 0; 
    width: 100%;
  }
  
</style>