<script>
  export let item;
</script>

<section id="state-facilities">
  <h2>Facilities in {item.name}</h2>
  <h4><a href="#/list:states">View all states</a></h4>
  <div id="counties-list">
    {#each item.counties as county}
      <h3>{county.name}</h3>
      <ul id="facilities-list">
        {#each county.facilities as fac}
          <li class="facility">
            <a href="#/facility:{fac.EPAFacilityID}">{fac.name}</a> 
            <ul>
              <li><b>City:</b> {fac.city}</li>
              <li><b>Address:</b> {fac.address}</li>
              <li><b>EPA Facility ID:</b> {fac.EPAFacilityID}</li>
              {#if fac.names_prev.length}
                <li><b>Has also appeared as:</b> {fac.names_prev.join(" • ")}</li>
              {/if}
            </ul>
          </li>
        {/each}
      </ul>
    {/each}
  </div>
</section>

<style>
  .facility + .facility {
    margin-top: 0.5em;
  }
</style>
