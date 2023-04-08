<script>
  import mapboxgl from 'mapbox-gl';

  onMount(() => {
    mapboxgl.accessToken = 'pk.eyJ1IjoibWljYWVsYS1yb3NhZGlvIiwiYSI6ImNsYXF1eXg4azAwZjQzeW92cjJrMDJwOXYifQ.NOmLvhjeSluUXlAlqmuDrgd';
    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-74.5, 40],
      zoom: 9
    });
  });
</script>

<div id="map" style="width: 100%; height: 100%;"></div>
