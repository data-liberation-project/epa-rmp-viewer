<script>
  import AttrTable from "./AttrTable.svelte";
  export let item;
</script>

<section id="submission">
  <h2>Submission #{item.FacilityID}</h2>
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
    margin-bottom: 1em;
  }
</style>
