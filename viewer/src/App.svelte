<script>
  import State from "./components/State.svelte";
  import Facility from "./components/Facility.svelte";
  import Submission from "./components/Submission.svelte";

  import Landing from "./pages/Landing.svelte";

  const pages = {
    "landing": Landing,
  };

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
    var urlMaker = urlTemplates[view];
    if (urlMaker) {
      const url = urlTemplates[view](view_arg);
      fetch(url)
        .then(response => response.json())
        .then(data => {
          app.view_data = data;
        }).catch(error => {
          console.log(error);
        });
    }
  };

  const routeChange = () => {
    resetApp();
    if (location.hash === "") {
      app.view = "page";
      app.view_arg = "landing";
    } else if (location.hash.indexOf(":") < 0) {
      location.hash = "";
    } else {
      const match = location.hash.match(/^#\/([^:]+):([^:+]+)/);
      if (match) {
        app.view = match[1];
        app.view_arg = match[2];
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
<div class="warning">❗This resource is a work in progress; please consult <b><a href="https://docs.google.com/document/d/1jrLXtv0knnACiPXJ1ZRFXR1GaPWCHJWWjin4rsthFbQ/edit">the documentation</a></b>.</div>


{#if app.view == "page"}
  <svelte:component this={pages[app.view_arg]}/>
{:else if app.view === "page" && app.view_data == "chooser"}
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

{:else if (app.view == "list" && app.view_arg == "states" && app.view_data) }
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

{:else if app.view == "state" && app.view_data }
  <State item={app.view_data} />

{:else if app.view == "facility" && app.view_data }
  <Facility item={app.view_data} />

{:else if app.view == "submission" && app.view_data}
  <Submission item={app.view_data} />
{/if}

<hr/>
</main>

<style>
  main {
    padding-bottom: 1em;
  }
  .warning {
    background-color: #FFFF99;
    padding: 0.5em;
    font-size: 1.1em;
  }
</style>
