<script>
  import { onMount, onDestroy } from 'svelte';
  import Accordion, { createAccordionContext } from './Accordion.svelte'
  import AccordionItem from './AccordionItem.svelte';
  import mapboxgl from 'mapbox-gl';
  export let item;

  // Create Accordion
  createAccordionContext();

  // Hide deregistered facilities
  let showDeregistered = true;
  function toggleDeregistered() {
    showDeregistered = !showDeregistered;
  }
  onDestroy(() => {
    // Cleanup
  });

  // Open and close sidebar
  function openNav() {
    document.getElementById("mySidebar").style.width = "250px";
    document.getElementById("main").style.marginLeft = "250px";
  }
  function closeNav() {
    document.getElementById("mySidebar").style.width = "0";
    document.getElementById("main").style.marginLeft= "0";
  }

  // Create facility map by state
  let map;
  onMount(() => {
    mapboxgl.accessToken = 'pk.eyJ1IjoibWljYWVsYS1yb3NhZGlvIiwiYSI6ImNsZzlsN2s1eTBxZXIzZHJ2YTI1YjJ1ejkifQ.bT9A2q8RKkiKPfCMVh63jQ';
    map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [Number(item.counties[0].facilities[0].sub_last.lon_sub), Number(item.counties[0].facilities[0].sub_last.lat_sub)],
      zoom: 6
    });
    map.addControl(new mapboxgl.NavigationControl(), 'top-right'); // Add zoom control to the map
    item.counties.forEach(county => {
        county.facilities.forEach(facility => {
          let lat = Number(facility.sub_last.lat_sub);
          let lon = Number(facility.sub_last.lon_sub);
          console.log([lat, lon]);

          const el = document.createElement('div');
          el.className = 'marker';
          const marker = new mapboxgl.Marker() // Add marker to the map
            .setLngLat([lon, lat])
            .addTo(map);

          const popup = new mapboxgl.Popup({ // Add popup to the marker
              closeOnClick: false,
              closeButton: false
          });
          marker.getElement().addEventListener('mouseenter', () => { // Show popup on marker hover
              map.getCanvas().style.cursor = 'pointer';
              popup.setLngLat(marker.getLngLat()).setHTML(`<p>${facility.name}</p>`).addTo(map);
          });
          marker.getElement().addEventListener('mouseleave', () => { // Hide popup on marker leave
              map.getCanvas().style.cursor = '';
              popup.remove();
          });
        })
    });
  });
</script>

<div id="main">
  <button class="openbtn" on:click={() => openNav()}>☰ Toggle Sidebar</button>  
 <div id='map'></div>
</div>

<div id="mySidebar" class="sidebar">
  <a href="#/list:states"> ⭠ View all states</a>
  <button class="closebtn" on:click={() => closeNav()}>×</button>
  <h1>Facilities in {item.name}</h1>
      <button on:click={toggleDeregistered}>
        {showDeregistered ? 'Hide Deregistered Facilities' : 'Show Deregistered Facilities'}
      </button>

    <Accordion current="a">
        {#each item.counties as county}
        <AccordionItem key="{county.abbr}">
            <div slot="head">
              {county.name}
            </div>
            <div slot="details">
              <ul id="facilities-list">
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
            </div>
        </AccordionItem>
      {/each}
    </Accordion>
</div> 


<style>
  .facility + .facility {
    margin-top: 0.5em;
  }
  .deregistered:before {
    content: "[Deregistered] "
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
    top: 0; right: 0; 
    bottom: 0; left: 0;
    width:100%;
    height:100%; 
  }
  .sidebar {
    height: 100%;
    width: 0;
    /* position: fixed; */
    z-index: 1;
    top: 0;
    left: 0;
    background-color: #111;
    overflow-x: hidden;
    transition: 0.25s;
    padding: 10px 0px 0px 0px;
    border-radius: 10px;
    box-shadow: 0 0 50px -25px black;
    left: 0px;
    position: absolute;
  }
  .sidebar a {
    padding: 8px 8px 8px 0px;
    text-decoration: none;
    font-size: 25px;
    color: #818181;
    display: block;
    transition: 0.3s;
  }
  .sidebar a:hover {
    color: #f1f1f1;
  }
  .sidebar .closebtn {
    position: absolute;
    top: 0;
    right: 0px;
    font-size: 36px;
    padding: 0px;
    margin-left: 10px;
  }
  .openbtn {
    font-size: 20px;
    cursor: pointer;
    background-color: #111;
    color: white;
    padding: 10px 15px;
    border: none;    
    position:absolute; 
    top:10px; 
    left:10px; 
    z-index:1;
    border-radius: 3px;
  }
  .openbtn:hover {
    background-color: #444;
  }
  #main {
    position:relative;
    transition: margin-left .5s;
    padding: 16px;
    height:100%; 
  }
  /* On smaller screens, where height is less than 450px, change the style of the sidenav (less padding and a smaller font size) */
  @media screen and (max-height: 450px) {
    .sidebar {padding-top: 15px;}
    .sidebar a {font-size: 18px;}
  }   
</style>
