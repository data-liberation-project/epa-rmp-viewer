<script>
  export let item;
</script>

<section id="state-facilities">
  <h2>Facilities in {item.name}</h2>
  <div>⭠ <a href="#/list:states">View all states</a></div>
  <div id="counties-list">
    {#each item.counties as county}
      <h3>{county.name}</h3>
      <ul id="facilities-list">
        {#each county.facilities as fac}
          <li class="facility" class:deregistered={fac.sub_last.date_dereg}>
            <a href="#/facility:{fac.EPAFacilityID}">{fac.name}</a> 
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
  .deregistered:before {
    content: "[Deregistered] "
  }
</style>
