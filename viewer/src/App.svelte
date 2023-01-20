<script>
  import AttrTable from "./AttrTable.svelte";

  let files;
  let sub;

  const readJSON = () => {
    if (files) {
      for (const file of files) {
        const reader = new FileReader();
        reader.onload = function (e) {
          sub = JSON.parse(reader.result);
        };
        reader.readAsText(file);
      }
    }
  };
</script>

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
<section id="submission">
  {#if sub}
    <AttrTable table={sub} key="Submission" />
  {/if}
</section>

<style>
  label {
    padding-bottom: 1em;
    font-size: 0.9em;
  }

  #submission {
    background-color: #eee;
    padding-right: 1em;
  }
</style>
