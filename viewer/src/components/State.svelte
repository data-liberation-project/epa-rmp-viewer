<script>
  import { onMount, onDestroy } from 'svelte';
  import Accordion, { createAccordionContext } from './Accordion.svelte'
  import AccordionItem from './AccordionItem.svelte';
  import mapboxgl from 'mapbox-gl';
  export let item;

  /* ----------------- */
  /* Sidebar           */
  /* ----------------- */

  // Create Accordion
  createAccordionContext();

  // Sidebar button
  let active = false;
  function toggleSidebar() {
    active = !active;
    const openButton = document.querySelector(".openbtn");
    openButton.style.left = active ? "300px" : "10px";
  }
  // Hide deregistered facilities
  let showDeregistered = true;
  function toggleDeregistered() {
    showDeregistered = !showDeregistered;
  }
  onDestroy(() => {
    // Cleanup
  });

  /* ----------------- */
  /* Map               */
  /* ----------------- */

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

  /* ----------------- */
  /* Fetch county data */
  /* ----------------- */

  let data;
	onMount(async () => {
		data = await fetch('https://parseapi.back4app.com/classes/Area?count=1&limit=0&where=19001')
          .then(x => x.json())
	})
</script>

<div id="main">
  <button class="openbtn" on:click={()=> toggleSidebar()}>
    ☰ {active? 'Close' : 'Open'} Sidebar
  </button>
  <div id='map'></div>
  <aside class:active>
    <a href="#/list:states"> ⭠ View all states</a>
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
                  {#each county.facilities as fac}
                    {#if showDeregistered || fac.sub_last.date_dereg === null}
                      <div id="facility-{fac.EPAFacilityID}" class="item">
                        <p class="facility" class:deregistered={fac.sub_last.date_dereg}> </p>
                        <a href="#/facility:{fac.EPAFacilityID}" class="facility-name">{fac.name}</a> 
                        <div class="facility-info">
                          {#if fac.names_prev.length}
                            <p><b>Has also appeared as:</b> {fac.names_prev.join(" • ")}</p>
                          {/if}
                          <p><b>City:</b> {fac.city}</p>
                          <p><b>Address:</b> {fac.address}</p>
                          <p><b>EPA Facility ID:</b> {fac.EPAFacilityID}</p>
                          <p><b>Latest RMP validation:</b> {fac.sub_last.date_val}</p>
                          <p><b># Accidents in latest 5-year history:</b> {fac.sub_last.num_accidents || "None"}</p>
                        </div>
                      </div>
                    {/if}
                  {/each} 
              </div>
          </AccordionItem>
        {/each}
      </Accordion>
    </aside>
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
  aside {
		position: absolute;
		left: -500px;
		transition: all .5s;
		height: 100%;
		width: 300px;
		padding: 20px;
		border: 1px solid #ddd;
		background-color: #efefef;
    overflow: auto;
    padding-bottom: 60px;
	}
	.active {
		left: 0px
	}
  .details .item {
    border-bottom: 1px solid #eee;
    padding: 10px;
    text-decoration: none;
  }
  .details .item:last-child { border-bottom: none; }
  .details .item .facility-name {
    display: block;
    color: #00853e;
    font-weight: 700;
  }
  .details .item .facility-name small { font-weight: 400; }
  .details .item.active .facility-name,
  .details .item .facility-name:hover { color: #8cc63f; }
  .details .item.active {
    background-color: #f8f8f8;
  }
  ::-webkit-scrollbar {
      width: 3px;
      height: 3px;
      border-left: 0;
      background: rgba(0, 0, 0, 0.1);
  }
  ::-webkit-scrollbar-track {
    background: none;
  }
  ::-webkit-scrollbar-thumb {
    background: #00853e;
    border-radius: 0;
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
    left: 10px; 
    z-index:1;
    border-radius: 3px;
    transition: 0.5s;
  }
  .openbtn:hover {
    background-color: #444;
  }
  #main {
    position:relative;
    transition: margin-left .5s;
    /* padding: 16px; */
    height:100%; 
  }
  /* On smaller screens, where height is less than 450px, change the style of the sidenav (less padding and a smaller font size) */
  /* @media screen and (max-height: 450px) {
    .sidebar {padding-top: 15px;}
    .sidebar a {font-size: 18px;}
  }    */
</style>
