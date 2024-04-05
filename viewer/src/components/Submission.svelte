<script>
  import AttrTable from "./AttrTable.svelte";
  export let item;
</script>

<section id="submission">
  <h2>Submission #{item.FacilityID}</h2>
  <div>⭠ <a href="#/facility:{item.EPAFacilityID}">View all submissions from this facility</a></div>
  <div>🔍 <a href="https://cdxapps.epa.gov/olem-rmp-pds/facility/registration?facilityId={item.FacilityID}" target="_blank" rel="noreferrer">Search for this submission in the EPA's RMP query tool</a></div>
  <div class="toc-container"></div>
  <AttrTable table={item} key="submission" i=-1/>
  <script>
    (() => {
      let container = document.querySelector(".toc-container");
      [].map.call(document.querySelectorAll(".toc-item"), (x) => {
        container.appendChild(x);
      });
    })();
  </script>
</section>

<style>
  .toc-container {
    border: 1px solid #CCC;
    padding: 0.5em;
    margin: 1em 0;
  }
</style>
