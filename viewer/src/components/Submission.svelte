<script>
  import AttrTable from "./AttrTable.svelte";
  export let item;
</script>

<section id="submission">
  <h2>Submission #{item.FacilityID}</h2>
  <AttrTable table={item} key="submission" i=0/>
</section>
