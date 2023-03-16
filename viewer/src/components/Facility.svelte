<script>
  export let item;
</script>

<section id="facility">
  <h2>Facility: {item.name}</h2>
  {#if item.submissions[0].date_dereg}
    <div class="warning"><a href="https://www.epa.gov/rmp/how-deregister-facility-risk-management-program">Deregistered</a> from RMP on {item.submissions[0].date_dereg}</div>
  {/if}
  <ul id="facility-details">
    <li><b>EPA Facility ID:</b> <span><a href="https://echo.epa.gov/detailed-facility-report?fid={item.EPAFacilityID}" target="_blank" rel="noreferrer">{item.EPAFacilityID}</a></span></li>
    <li><b>State:</b> <span><a href="#/state:{item.state}">{item.state || ""}</a></span></li>
    <li><b>City:</b> <span>{item.city || ""}</span></li>
    <li><b>ZIP Code:</b> <span>{item.zip || ""}</span></li>
    <li><b>Coordinates:</b> <span>{#if item.lng}{item.lat || ""}, {item.lng || ""} (<a href="https://www.openstreetmap.org/?zoom=14&mlat={item.lat}&mlon={item.lng}" target="_blank" rel="noreferrer">OSM</a> | <a href="https://maps.google.com/maps?q=loc:{item.lat},{item.lng}" target="_blank" rel="noreferrer">Google</a>){/if}</span></li>
    <li><b>Company 1:</b> <span>{item.company_1 || ""}</span></li>
    <li><b>Company 2:</b> <span>{item.company_2 || ""}</span></li>
    <li><b>Operator:</b> <span>{item.operator || ""}</span></li>
  </ul>
  <h3>RMP Submissions (through February 2022)</h3>
  <table id="submission-list">
    <thead>
      <tr>
        <th>Sub. #</th>
        <th>EPA Received</th>
        <th>EPA Last Validated</th>
        <th>Fac. Name</th>
        <th>Co.&nbsp;1</th>
        <th>Co.&nbsp;2</th>
        <th>Op.</th>
      </tr>
    </thead>
    {#each item.submissions as sub}
    <tr>
      <td><a href="#/submission:{sub.id}">{sub.id}</a></td>
      <td style="white-space: nowrap">{sub.date_rec}</td>
      <td style="white-space: nowrap">{sub.date_val}</td>
      <td>{sub.name}</td>
      <td>{sub.company_1 || ""}</td>
      <td>{sub.company_2 || ""}</td>
      <td>{sub.operator || ""}</td>
    </tr>
    {/each}
  </table>
</section>
<style>
  ul {
    margin-left: 1em;
    padding-left: 0;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    text-align: center;
    font-size: 0.9em;
  }
  td {
    border: 1px solid #333;
    padding: 0.25em;
  }
  h3 {
    margin-top: 2em;
  }
</style>
