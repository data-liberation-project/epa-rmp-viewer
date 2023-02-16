<script>
  export let table, key, i;
  const key_parts = key.split(":");
  const name = key_parts[key_parts.length - 1].replace(/^_/, "");
  console.log(key);
  const sections = {
    "submission:_processes": "Processes",
    "submission:_processes:_naics": "Process NAICS Code(s)",
    "submission:_processes:_naics:_desc": "NAICS Code Description",
    "submission:_processes:_chemicals": "Process Chemicals",
    "submission:_processes:_chemicals:_chemical": "Chemical Information",
    "submission:_processes:_chemicals:_flam_mix_chemicals": "Flammable Mixture Chemical",
    "submission:_accidents": "Accidents",
    "submission:_accidents:_chemicals": "Accident Chemicals",
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

</script>

<div class="tablewrapper top">
    {#if sections[key]}
      <h4>{sections[key]}{#if i > -1}: #{i + 1}{/if}</h4>
    {/if}
  <table>
    {#each Object.keys(table) as item_key}
      {@const val = table[item_key]}
      {#if !(keys_to_skip.indexOf(key) > -1 || item_keys_to_skip.indexOf(item_key) > -1)}
        {#if item_key.slice(0, 1) !== "_"}
          <tr>
            <td class="left" data-key={item_key}>{item_key}</td>
            <td class="right" data-key={item_key}>{@html renderValue(key, item_key, val)}</td>
          </tr>
        {/if}
      {/if}
    {/each}
  </table>
  {#each Object.keys(table) as item_key}
    {@const val = table[item_key]}
    {#if item_key.slice(0, 1) === "_"}
      {#if item_key == "_exec_summary"}
        <div class="tablewrapper">
          <h4>Executive Summary</h4>
          <div class="exec-summary">
            {#each val as row}{row.SummaryText}{/each}
          </div>
        </div>
      {:else if Array.isArray(val)}
        {#each val as entry, i}
          <svelte:self table={entry} key={key + ":" + item_key} i={i} />
        {/each}
      {:else}
        <svelte:self table={val} key={key + ":" + item_key} i=-1 />
      {/if}
    {/if}
  {/each}
</div>

<style>
  *,
  *:before,
  *:after {
    box-sizing: inherit;
  }

  .tablewrapper.top {
    background-color: #eee;
    padding-right: 1em;
    padding-top: 1em;
  }

  .tablewrapper {
    width: 100%;
    padding: 0.5em 1.5em;
    padding-right: 0;
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

  .exec-summary {
    white-space: pre-wrap;
    background-color: white;
    padding: 1em;
  }
</style>
