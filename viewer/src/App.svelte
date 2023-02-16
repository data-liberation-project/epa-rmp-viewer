<script>
  import State from "./components/State.svelte";
  import Facility from "./components/Facility.svelte";
  import Submission from "./components/Submission.svelte";

  let app = {
    view: null,
    view_arg: null,
    view_data: null,
  };

  const resetApp = () => {
    app.view = null;
    app.view_arg = null;
    app.view_data = null;
  };

  let item;
  let files;
 
  const readJSON = () => {
    if (files) {
      for (const file of files) {
        const reader = new FileReader();
        reader.onload = function (e) {
          app.view_data = JSON.parse(reader.result);
          app.view = "submission";
        };
        reader.readAsText(file);
      }
    }
  };

  const urlTemplates = {
    "list": (kind) => `./data/facilities/states.json`,
    "state": (state) => `./data/facilities/by-state/${state}.json`,
    "facility": (fac_id) => `./data/facilities/detail/${fac_id}.json`,
    "submission": (sub_id) => `./data/submissions/${sub_id}.json`,
  };

  const fetchViewData = (view, view_arg) => {
    const url = urlTemplates[view](view_arg);
    fetch(url)
      .then(response => response.json())
      .then(data => {
        app.view_data = data;
      }).catch(error => {
        console.log(error);
      });
  };

  const routeChange = () => {
    resetApp();
    if (location.hash.indexOf(":") < 0) {
    } else {
      const match = location.hash.match(/^#\/([^:]+):([^:+]+)/);
      if (match) {
        app.view = match[1];
        app.view_arg = match[2];
        app.view_data = null;
        fetchCurrentView();
      } else {
        console.log("Could not parse location.hash: " + location.hash);
      }
    }
  };
  
  const fetchCurrentView = () => {
    fetchViewData(app.view, app.view_arg);
  }

  routeChange();

</script>

<svelte:window on:hashchange={routeChange} />

<main>
<h1>RMP Submission Viewer</h1>
<div class="warning">❗Work in Progress • Use With Caution ❗</div>

{#if location.hash.length === 0}
<hr/>
<section id="chooser">
  <label for="avatar">Open a submission:</label>
  <input
    accept="application/json"
    bind:files
    on:change={readJSON}
    id="sub_file"
    name="sub_file"
    type="file"
  />
</section>
{/if}

{#if (app.view == "list" && app.view_arg == "states" && app.view_data) }
  <section id="states">
    <h2>Facilities by State</h2>
    <ul id="states-list">
      {#each app.view_data.sort((a, b) => a.name < b.name) as s}
        <li>
          <a href="#/state:{s.abbr}">{s.name} ({s.count})</a>
        </li>
      {/each}
    </ul>
  </section>
{/if}

{#if app.view == "state" && app.view_data }
  <State item={app.view_data} />
{/if}

{#if app.view == "facility" && app.view_data }
  <Facility item={app.view_data} />
{/if}

{#if app.view == "submission" && app.view_data}
  <Submission item={app.view_data} />
{/if}

<hr/>
</main>

<style>
  main {
    padding-bottom: 1em;
  }
  .warning {
    background-color: yellow;
    padding: 0.5em;
    font-size: 1.1em;
  }
</style>
