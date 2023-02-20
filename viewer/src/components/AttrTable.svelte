<script>
  import lookups from "../../public/data/lookups/lookups.json";
  export let table, key, i;
  const key_parts = key.split(":");
  const sections = {
    "submission": "Submission",
    "submission:_processes": "Process",
    "submission:_emerg_resp": "Emergency Response",
    "submission:_exec_summary": "Executive Summary",
    "submission:_processes:_naics": "Prevention Programs by Industry Code",
    "submission:_processes:_naics:_desc": "NAICS Code Description",
    "submission:_processes:_naics:_prev_prog_3": "Prevention Program (for Program Level 3)",
    "submission:_processes:_naics:_prev_prog_3:_chemicals": "Program Chemical",
    "submission:_processes:_naics:_prev_prog_2": "Prevention Program (for Program Level 2)",
    "submission:_processes:_naics:_prev_prog_2:_chemicals": "Program Chemical",
    "submission:_processes:_chemicals": "Process Chemical",
    "submission:_processes:_chemicals:_chemical": "Chemical Information",
    "submission:_processes:_chemicals:_flam_mix_chemicals": "Flammable Mixture Chemical",
    "submission:_accidents": "Accident",
    "submission:_accidents:_chemicals": "Accident Chemical",
    "submission:_accidents:_chemicals:_flam_mix_chemicals": "Flammable Mixture Accident Chemical",
  };

  const keys_to_skip = [];
  const item_keys_to_skip = [ "FacilityID" ];

  const linkers = {
    "EPAFacilityID": (val) => `#/facility:${val}`,
    "FacilityState": (val) => `#/state:${val}`,
  };

  const renderValue = (key, item_key, val) => {
    if (val === null) {
      return "";
    } else {
      if (linkers[item_key]) {
        const url = linkers[item_key](val);
        return `<a href='${url}'>${val}</a>`
      } else {
        return val;
      }
    }
  };

  let levels = key.split(":").slice(1);
  let collapsed = false;
  let title = sections[key] + (i > -1 ? ` #${parseInt(i)+1}` : "");
  let header;
  const scroll = (e) => { header.scrollIntoView(); }

</script>

<div class="tablewrapper">
  {#if levels.length < 2}
  <div class="toc-item" on:click={scroll}>{#each levels as level}&nbsp;&nbsp;{/each}{title}</div>
  {/if}
  <h4 bind:this={header}>
  {title}
    <button class="toggle" on:click={() => collapsed = !collapsed}>
      {#if collapsed}
      Expand
      {:else}
      Collapse
      {/if}
    </button>
  </h4>
  {#if Array.isArray(table) ? table.length : table}
    {#if key === "submission:_exec_summary"}
      <div class="exec-summary" hidden={collapsed}>
        {#each table as row}{row.SummaryText}{/each}
      </div>
    {:else}
      <table hidden={collapsed}>
        {#each Object.keys(table) as item_key}
          {@const val = table[item_key]}
          {#if !(keys_to_skip.indexOf(key) > -1 || item_keys_to_skip.indexOf(item_key) > -1)}
            {#if item_key.slice(0, 1) !== "_"}
              <tr>
                <td class="left" data-key={item_key}>{item_key}</td>
                <td class="right" data-key={item_key}>
                  {@html renderValue(key, item_key, val)}
                  {#if (lookups[item_key] && lookups[item_key][val])}
                    <span class="lookup">{lookups[item_key][val]}</span>
                  {/if}
                </td>
              </tr>
            {/if}
          {/if}
        {/each}
      </table>
      {#each Object.keys(table) as item_key}
        {@const val = table[item_key]}
        {#if item_key.slice(0, 1) === "_"}
            <div hidden={collapsed}>
            {#if item_key == "_exec_summary"}
                <svelte:self table={val} key={key + ":" + item_key} i={-1} />
            {:else if Array.isArray(val)}
              {#each val as entry, i}
                <svelte:self table={entry} key={key + ":" + item_key} i={i} />
              {/each}
            {:else}
              <svelte:self table={val} key={key + ":" + item_key} i={-1} />
            {/if}
            </div>
        {/if}
      {/each}
    {/if}
  {:else}
    <div class="missing" hidden={collapsed}>Missing</div>
  {/if}
</div>

<style>
  *,
  *:before,
  *:after {
    box-sizing: inherit;
  }

  .tablewrapper {
    width: 100%;
  }

  h4 {
    margin: 0;
    padding: 0.1em 0;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    background-color: white;
  }

  td {
    border: 1px solid;
    padding: 0.1em;
  }

  td.left {
    font-weight: bold;
    vertical-align: top;
  }

  td.right {
  }

  span.lookup {
    background-color: lightblue;
    padding: 0.1em 0.25em;
    display: inline-block;
    border-radius: 3px;
    font-style: italic;
    font-size: 0.8em;
  }

  .exec-summary {
    white-space: pre-wrap;
    background-color: white;
    padding: 1em;
  }

  div.missing {
    font-style: italic;
  }

  button.toggle {
    font-size: 0.8em;
    padding: 0.1em 0.25em;
    margin-left: 1em;
    border-radius: 3px;
    cursor: pointer;
  }

  button.toggle:hover {
    border: 1px solid black;
  }

  .toc-item {
    padding: 0.1em 0;
    color: darkblue;
  }
  .toc-item:hover {
    font-weight: bold;
    cursor: pointer;
  }
</style>
