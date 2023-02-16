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
          <li>
            <a href="#/facility:{fac.EPAFacilityID}">{fac.name}</a> ({fac.city} • {fac.address})
          </li>
        {/each}
      </ul>
    {/each}
  </div>
</section>
