<script>
  export let item;
</script>

<section id="facility">
  <h2>Facility: {item.name}</h2>
  <ul id="facility-details">
    <li><b>EPA Facility ID:</b> <span><a href="https://echo.epa.gov/detailed-facility-report?fid={item.EPAFacilityID}" target="_blank" rel="noreferrer">{item.EPAFacilityID}</a></span></li>
    <li><b>State:</b> <span><a href="#/state:{item.state}">{item.state || ""}</a></span></li>
    <li><b>City:</b> <span>{item.city || ""}</span></li>
    <li><b>ZIP Code:</b> <span>{item.zip || ""}</span></li>
    <li><b>Coordinates:</b> <span>{#if item.lng}{item.lng || ""}, {item.lat || ""} (<a href="https://www.openstreetmap.org/?zoom=14&mlat={item.lat}&mlon={item.lng}" target="_blank" rel="noreferrer">OSM</a> | <a href="https://maps.google.com/maps?q=loc:{item.lat},{item.lng}" target="_blank" rel="noreferrer">Google</a>){/if}</span></li>
    <li><b>Company 1:</b> <span>{item.company_1 || ""}</span></li>
    <li><b>Company 2:</b> <span>{item.company_2 || ""}</span></li>
    <li><b>Operator:</b> <span>{item.operator || ""}</span></li>
    <li><b>RMP Submissions (ID — Date Validated by EPA):</b><ul id="submission-list">
        {#each item.submissions as sub}
          <li>#<a href="#/submission:{sub.id}">{sub.id}</a> — {sub.date}</li>
        {/each}
    </ul></li>
  </ul>
</section>
