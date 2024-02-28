<script>
  let search_facility_id = null;
  const get_by_facility_id = (e) => {
    if (search_facility_id) {
      location.hash = "/facility:" + search_facility_id;
    }
  };
</script>
<section>
  <h2>Introduction and Instructions</h2>
  <p>
    This online, <a href="https://github.com/data-liberation-project/epa-rmp-viewer">open-source</a> tool provides access to key information <a href="https://github.com/data-liberation-project/epa-rmp-viewer">extracted</a> from <a href="https://docs.google.com/document/d/1jrLXtv0knnACiPXJ1ZRFXR1GaPWCHJWWjin4rsthFbQ/edit">the EPA's Risk Management Program (RMP) database</a>, <a href="https://www.data-liberation-project.org/requests/epa-risk-management-program/">obtained</a> and <a href="https://github.com/data-liberation-project/epa-rmp-viewer">extracted</a> by the <a href="https://www.data-liberation-project.org/">Data Liberation Project</a>.
  </p>
  <p>
    The RMP database is somewhat complex, and many of the fields in it aren't self-explanatory. Please read <a href="https://docs.google.com/document/d/1jrLXtv0knnACiPXJ1ZRFXR1GaPWCHJWWjin4rsthFbQ/edit"><b>this guide</b></a> before continuing.
  </p>
  <p>
    Here, you can find several views on the data:
  </p>
  <ul>
    <li>A <a href="#/list:states"><b>listing of all states</b></a> represented in the database.</li>
    <li>For <b>each state</b> (e.g., <a href="#/state:TX">Texas</a>) — county-by-county listing of all facilities that have, at any point, filed an RMP submission.</li>
    <li>For <b>each facility</b> (e.g., <a href="#/facility:100000070987">this facility</a>) — overview information and a table linking to all the facility's submissions</li>
    <li>For <b>each submission</b> (e.g., <a href="#/submission:43946">#43946</a>) — raw data from the core database tables, covering information on the submission and facility, processes, process chemicals, prevention programs, accident history, and executive summary. <i>Note: Although this represents a large chunk of the data, it is not exhaustive of all tables and fields in the database, for which you should consult the raw data, available through the documentation linked above.</i></li>
  </ul>
</section>
<hr/>
<section>
  <h2>Search by EPA Facility ID</h2>
  <input bind:value={search_facility_id}><button on:click={get_by_facility_id}>Go</button>
</section>

<style>
  li + li {
    margin-top: 1em;
  }
  input {
    margin-right: 0.25em; 
  }
  button {
    cursor: pointer;
    border: 2px solid #CCC;
    border-radius: 5px;
  }
  button:hover {
    border: 2px solid #666;
  }
</style>
