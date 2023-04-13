<script>
  import { Accordion, AccordionItem } from 'svelte-collapsible';
  import { onMount, onDestroy } from 'svelte';
  import mapboxgl from 'mapbox-gl';
  export let item;

  // Hide deregistered facilities
  let showDeregistered = true;
  function toggleDeregistered() {
    showDeregistered = !showDeregistered;
  }
  onDestroy(() => {
    // Cleanup
  });

  // Create facility map by state
  let map;
  // Add or remove the 'collapsed' CSS class from the sidebar element.
  function toggleSidebar(id) {
      const elem = document.getElementById(id);
      const collapsed = elem.classList.toggle('collapsed');
      const padding = {};
      // 'id' is 'left'. When run at start, this object looks like: '{left: 300}';
      padding[id] = collapsed ? 0 : 410; // 0 if collapsed, 300 px if not. This matches the width of the sidebars in the .sidebar CSS class.
      console.log('function works', collapsed)
      // // Adjust the map's center accounting for the position of sidebars.
      // map.easeTo({
      //   padding: padding,
      //   duration: 1000 // In ms. This matches the CSS transition duration property.
      // });
      
    }

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
    map.on('load', () => {
      toggleSidebar('left');
    });
  });
</script>

<div id="map">
  <div id="left" class="sidebar flex-center left collapsed">
    <div class="sidebar-content rounded-rect flex-center">
      <button on:click={() => toggleSidebar('left')} class="sidebar-toggle rounded-rect left">
        &rarr;
      </button>
      <Accordion>
        <section id="state-facilities">
          <h2>Facilities in {item.name}</h2>
          <button on:click={toggleDeregistered}>
            {showDeregistered ? 'Hide Deregistered Facilities' : 'Show Deregistered Facilities'}
          </button>
          <div>⭠ <a href="#/list:states">View all states</a></div>
          <div id="counties-list">
              {#each item.counties as county}
                  <AccordionItem key={county.fips}>
                    <div slot='header' class='header'>
                      <h3>{county.name}</h3>
                    </div>
                    <ul id="facilities-list" slot="body">
                      {#each county.facilities as fac}
                        {#if showDeregistered || fac.sub_last.date_dereg === null}
                          <li class="facility" class:deregistered={fac.sub_last.date_dereg}>
                            <a href="#/facility:{fac.EPAFacilityID}">{fac.name}</a> 
                            <div class="facility-info">
                              <ul>
                                {#if fac.names_prev.length}
                                  <li><b>Has also appeared as:</b> {fac.names_prev.join(" • ")}</li>
                                {/if}
                                <li><b>City:</b> {fac.city}</li>
                                <li><b>Address:</b> {fac.address}</li>
                                <li><b>EPA Facility ID:</b> {fac.EPAFacilityID}</li>
                                <li><b>Latest RMP validation:</b> {fac.sub_last.date_val}</li>
                                <li><b># Accidents in latest 5-year history:</b> {fac.sub_last.num_accidents || "None"}</li>
                              </ul>
                            </div>
                          </li>
                        {/if}
                      {/each} 
                    </ul>
                  </AccordionItem>
              {/each}  
          </div>
        </section>
      </Accordion>
    </div>
  </div> 
</div>

<style>
  .facility + .facility {
    margin-top: 0.5em;
  }
  .deregistered:before {
    content: "[Deregistered] "
  }

  #facilities-list {
    oveflow: auto;
  }

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
    display: flex;
  }
  :global(.accordion) {
		width: 100%;
		max-width: 450px;
		margin: 0 auto;
    -webkit-box-flex: 1;
    flex: 1 1 auto;
	}  
	:global(.accordion-item) {
		border-bottom: 1px solid rgb(100, 120, 140);
	}
	.header {
		display: flex;
		align-items: center;
		padding: 0.5em;
	}
  :global(.header p) {
		font-size: 18px;
		margin: 0;
	}
  .left.collapsed {
    transform: translateX(-295px);
  }
  .rounded-rect {
    /* background: white; */
    border-radius: 10px;
    box-shadow: 0 0 50px -25px black;
  }
  .flex-center {
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .flex-center.left {
    left: 0px;
  }
  .sidebar-content {
    position: absolute;
    width: 95%;
    height: 95%;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 18px;
    color: gray;
  }
  .sidebar-toggle {
    position: absolute;
    width: 1.3em;
    height: 1.3em;
    overflow: visible;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .sidebar-toggle.left {
    right: -1.5em;
  }
  .sidebar-toggle:hover {
    color: #0aa1cf;
    cursor: pointer;
  }
  .sidebar {
    transition: transform 1s;
    z-index: 1;
    width: 410px;
    height: 100%;
    overflow: auto;
    background-color: white;
  }
</style>
