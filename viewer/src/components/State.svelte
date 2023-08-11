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
  
  /* ----------------- */
  /* Fetch Data        */
  /* ----------------- */
  let stateCoordData = null;
  let url = "./data/geo-administrative/states-center-coord.json";
  fetch(url)
    .then(response => response.json())
    .then(data => {
      stateCoordData = data;
      console.log('Center State Data', stateCoordData)
    }).catch(error => {
      console.log(error);
    });
  /* ----------------- */
  /* Map               */
  /* ----------------- */
  
  // Create facility map by state
  let map;

  // Go to location of selected facility
  // function flyToFac(lon, lat) {
  //     map.flyTo({
  //       center: [lon, lat],
  //       zoom: 2
  //     });
  //   }
  // Eventlisteners for markers and popups
  function showLocation(fac) {
      console.log('Clicked Facility ', fac);
      let lon = Number(fac.sub_last.lon_sub);
      let lat = Number(fac.sub_last.lat_sub);
      console.log([lon, lat])
      map.flyTo({
        center: [lon, lat],
        zoom: 10
      });
      createPopUp(lon, lat, fac)
  };
  function createPopUp(lon, lat, facility) {
      const popUps = document.getElementsByClassName('mapboxgl-popup');
      if (popUps[0]) popUps[0].remove(); // Remove existing popups on map
      const popup = new mapboxgl.Popup({ closeOnClick: false })
        .setLngLat([lon, lat])
        .setHTML(`<h3>${facility.name}</h3><h4>${facility.address}</h4>`)
        .addTo(map);
    }

  onMount(() => {
    mapboxgl.accessToken = 'pk.eyJ1IjoibWljYWVsYS1yb3NhZGlvIiwiYSI6ImNsZzlsN2s1eTBxZXIzZHJ2YTI1YjJ1ejkifQ.bT9A2q8RKkiKPfCMVh63jQ';
    map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [Number(item.counties[0].facilities[0].sub_last.lon_sub), Number(item.counties[0].facilities[0].sub_last.lat_sub)],
      zoom: 4
    });
    // Add controls
    map.addControl(new mapboxgl.NavigationControl(), 'top-right'); 

    // function createPopUp(lon, lat, facility) {
    //   const popUps = document.getElementsByClassName('mapboxgl-popup');
    //   if (popUps[0]) popUps[0].remove(); // Remove existing popups on map
    //   const popup = new mapboxgl.Popup({ closeOnClick: false })
    //     .setLngLat([lon, lat])
    //     .setHTML(`<h3>${facility.name}</h3><h4>${facility.address}</h4>`)
    //     .addTo(map);
    // }

    // // Iterate through facilities and include functions
    // item.counties.forEach(county => {
    //     county.facilities.forEach(facility => {
    //       let lat = Number(facility.sub_last.lat_sub);
    //       let lon = Number(facility.sub_last.lon_sub);
    //       console.log([lat, lon]);

    //       showLocation(map, createPopUp, facility);
    //       //flyToFac(lon, lat)
    //       //createPopUp(lon, lat, facility)
    //     })
    // });
  });
</script>

<div id="main">
  <button 
    class="openbtn" 
    on:click={()=> toggleSidebar()}>
    ☰ {active? 'Close' : 'Open'} Sidebar
  </button>
  <div id='map'></div>
  <aside class:active>
    <a href="#/list:states"> ⭠ View all states</a>
    <h1>Facilities in {item.name}</h1>
        <button on:click={toggleDeregistered}>
          {showDeregistered ? 'Hide Deregistered Facilities' : 'Show Deregistered Facilities'}
        </button>
      <Accordion>
        {#each item.counties as county}
          <AccordionItem key="county-{county.fips}" id="{county.fips}">
            <div slot="head" id="head-{county.fips}">{county.name}</div>
            <div slot="details" id="details-{county.fips}"> 
                {#each county.facilities as fac}
                  {#if showDeregistered || fac.sub_last.date_dereg === null}
                      <div id="facility-{fac.EPAFacilityID}" class="item">
                        <p class="facility" class:deregistered={fac.sub_last.date_dereg}></p>
                        <button
                          class="facility-name" 
                          id="show-facility"
                          on:click={() => showLocation(fac)}>{fac.name}</button> 
                        <a href="#/facility:{fac.EPAFacilityID}" class="facility-name">See more details</a> 
                        {#if fac.names_prev.length}
                          <p><b>Has also appeared as:</b> {fac.names_prev.join(" • ")}</p>
                        {/if}
                        <p><b>City:</b> {fac.city}</p>
                        <p><b>Address:</b> {fac.address}</p>
                        <p><b>EPA Facility ID:</b> {fac.EPAFacilityID}</p>
                        <p><b>Latest RMP validation:</b> {fac.sub_last.date_val}</p>
                        <p><b># Accidents in latest 5-year history:</b> {fac.sub_last.num_accidents || "None"}</p>
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
  :global(.marker) {
    background-image: url("/viewer/public/images/mapbox-marker-icon-blue.svg");
    background-size:  cover;
    width:            20px;
    height:           20px;
    border-radius:    10%;
    cursor:           pointer !important;
  }
  #main {
    position:relative;
    transition: margin-left .5s;
    height:100%; 
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
  .deregistered:before {
    content: "[Deregistered] "
  }
  /* Marker tweaks */
  .mapboxgl-popup-close-button {
    display: none;
  }
  .mapboxgl-popup-content {
    font: 400 15px/22px 'Source Sans Pro', 'Helvetica Neue', sans-serif;
    padding: 0;
    width: 180px;
  }
  .mapboxgl-popup-content h3 {
    background: #91c949;
    color: #fff;
    margin: 0;
    padding: 10px;
    border-radius: 3px 3px 0 0;
    font-weight: 700;
    margin-top: -15px;
  }
  .mapboxgl-popup-content h4 {
    margin: 0;
    padding: 10px;
    font-weight: 400;
  }
  .mapboxgl-popup-content div {
    padding: 10px;
  }
  .mapboxgl-popup-anchor-top > .mapboxgl-popup-content {
    margin-top: 15px;
  }
  .mapboxgl-popup-anchor-top > .mapboxgl-popup-tip {
    border-bottom-color: #91c949;
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
  /* On smaller screens, where height is less than 450px, change the style of the sidenav (less padding and a smaller font size) */
  /* @media screen and (max-height: 450px) {
    .sidebar {padding-top: 15px;}
    .sidebar a {font-size: 18px;}
  }    */
</style>
