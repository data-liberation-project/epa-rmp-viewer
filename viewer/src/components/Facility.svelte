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
    <li><b>Coordinates:</b> <span><ul>
        {#if item.lon_fac}
          <li>From <code><a href="https://docs.google.com/document/d/1jrLXtv0knnACiPXJ1ZRFXR1GaPWCHJWWjin4rsthFbQ/edit#heading=h.yq3wkmelid3j">RMPFac</a></code> database: {item.lat_fac || ""}, {item.lon_fac || ""} (<a href="https://www.openstreetmap.org/?zoom=10&mlat={item.lat_fac}&mlon={item.lon_fac}" target="_blank" rel="noreferrer">OSM</a> | <a href="https://maps.google.com/maps?q=loc:{item.lat_fac},{item.lon_fac}" target="_blank" rel="noreferrer">Google</a>)</li>
        {/if}
        {#if item.submissions[0].lon_sub}
          <li>From latest submission: {item.submissions[0].lat_sub || ""}, {item.submissions[0].lon_sub || ""} (<a href="https://www.openstreetmap.org/?zoom=10&mlat={item.submissions[0].lat_sub}&mlon={item.submissions[0].lon_sub}" target="_blank" rel="noreferrer">OSM</a> | <a href="https://maps.google.com/maps?q=loc:{item.submissions[0].lat_sub},{item.submissions[0].lon_sub}" target="_blank" rel="noreferrer">Google</a>)</li>
        {/if}
        {#if item.submissions[0].lon_frs}
          <li>From <code>FRS_Lat/Long</code> fields: {item.submissions[0].lat_frs || ""}, {item.submissions[0].lon_frs || ""} (<a href="https://www.openstreetmap.org/?zoom=10&mlat={item.submissions[0].lat_frs}&mlon={item.submissions[0].lon_frs}" target="_blank" rel="noreferrer">OSM</a> | <a href="https://maps.google.com/maps?q=loc:{item.submissions[0].lat_frs},{item.submissions[0].lon_frs}" target="_blank" rel="noreferrer">Google</a>)</li>
        {/if}
    </ul></span></li>
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
        <th>Acc.</th>
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
      <td>{sub.num_accidents || ""}</td>
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
