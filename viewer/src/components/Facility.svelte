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
    <li><b>Coordinates:</b> <span>
        {#if item.submissions[0].lon_sub}
          {item.submissions[0].lat_sub || ""}, {item.submissions[0].lon_sub || ""} (<a href="https://www.openstreetmap.org/?zoom=10&mlat={item.submissions[0].lat_sub}&mlon={item.submissions[0].lon_sub}" target="_blank" rel="noreferrer">OSM</a> | <a href="https://maps.google.com/maps?q=loc:{item.submissions[0].lat_sub},{item.submissions[0].lon_sub}" target="_blank" rel="noreferrer">Google</a>)
        {/if}
    </span></li>
    <li><b>Company 1:</b> <span>{item.company_1 || ""}</span></li>
    <li><b>Company 2:</b> <span>{item.company_2 || ""}</span></li>
    <li><b>Operator:</b> <span>{item.operator || ""}</span></li>
  </ul>
  <h3>RMP Submissions (through June 2023)</h3>
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
  <div class="column-descriptions">
    <ul>
      <li><b>Sub. #</b>: The ID number the EPA assigned to this submission. (Technically, in the raw data, the misnomered <code>FacilityID</code> field.)</li>
      <li><b>EPA Received</b>: The date the EPA received the submission.</li>
      <li><b>EPA Last Validated</b>: The date of the EPA's latest completion/validation check for this submission, which may also include checks of corrections made after the initial submission.</li>
      <li><b>Fac. Name</b>: The facility name listed in the submission.</li>
      <li><b>Co.&nbsp;1</b>: The first company listed in the submission.</li>
      <li><b>Co.&nbsp;2</b>: The second company listed in the submission.</li>
      <li><b>Op.</b>: The operator listed in the submission.</li>
      <li><b>Acc.</b>: The number of accidents listed in the submission's five-year accident history. Note: Because of overlapping timeframes, some accidents may be duplicated across submissions. The total of this column is <b>often not</b> the total number of distinct accidents.</li>
    </ul>
  </div>
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
  .column-descriptions {
    font-size: 0.9em;
    padding-top: 1em;
  }

  .column-descriptions li {
    padding: 0.25em 0;
  }
</style>
