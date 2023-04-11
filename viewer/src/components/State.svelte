<script>
  import { Accordion, AccordionItem } from 'svelte-collapsible';
  import { onMount, onDestroy } from 'svelte';
  export let item;

  let showDeregistered = true;
  function toggleDeregistered() {
    showDeregistered = !showDeregistered;
  }

  onDestroy(() => {
    // Cleanup
  });
</script>

<Accordion>
  <section id="state-facilities">
    <h2>Facilities in {item.name}</h2>

    <button on:click={toggleDeregistered}>
      {showDeregistered ? 'Hide Deregistered Facilities' : 'Show Deregistered Facilities'}
    </button>

    <div>⭠ <a href="#/list:states">View all states</a></div>
    <div id="counties-list">
      <!-- {#if item.counties.every(county => county.facilities.every(fac => fac.sub_last.date_dereg !== null))}
        <p>No active facilities</p>
      {:else} -->
        {#each item.counties as county}
          {#if county.facilities.every(fac => fac.sub_last.date_dereg === null)}
            <p>No active facilities</p>
          {:else}
            <AccordionItem key={county.fips}>
              <div slot='header' class='header'>
                <h3>{county.name}</h3>
              </div>
              <ul id="facilities-list" slot="body">
                {#each county.facilities as fac}
                  {#if showDeregistered || fac.sub_last.date_dereg === null}
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
                  {/if}
                {/each} 
              </ul>
            </AccordionItem>
          {/if}
        {/each}  
    </div>
  </section>
</Accordion>

<style>
  .facility + .facility {
    margin-top: 0.5em;
  }
  .deregistered:before {
    content: "[Deregistered] "
  }

  :global(.accordion) {
		width: 100%;
		max-width: 450px;
		margin: 0 auto;
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

</style>
