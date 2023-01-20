<script>
  export let table, key;
  const key_parts = key.split(":");
  const name = key_parts[key_parts.length - 1].replace(/^_/, "");
</script>

<div class="tablewrapper">
  <h3>{name}</h3>
  <table>
    {#each Object.keys(table) as item_key}
      {@const val = table[item_key]}
      {#if item_key.slice(0, 1) !== "_"}
        <tr
          ><td class="left" data-key={item_key}>{item_key}</td><td
            class="right"
            data-key={item_key}>{val === null ? "" : val}</td
          ></tr
        >
      {/if}
    {/each}
  </table>
  {#each Object.keys(table) as item_key}
    {@const val = table[item_key]}
    {#if item_key.slice(0, 1) === "_"}
      {#if item_key == "_exec_summary"}
        <div class="tablewrapper">
          <h3>Executive Summary</h3>
          <div class="exec-summary">
            {#each val as row}{row.SummaryText}{/each}
          </div>
        </div>
      {:else if Array.isArray(val)}
        {#each val as entry}
          <svelte:self table={entry} key={key + ":" + item_key} />
        {/each}
      {:else}
        <svelte:self table={val} key={key + ":" + item_key} />
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

  .tablewrapper {
    width: 100%;
    padding: 0.5em 1em;
    padding-right: 0;
  }

  h3 {
    text-transform: capitalize;
    margin-bottom: 0;
    padding-bottom: 0;
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
