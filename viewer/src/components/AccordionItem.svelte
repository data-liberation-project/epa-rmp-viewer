<!-- AccordionItem -->
<script>
  import { getAccordionContext } from './Accordion.svelte';
  import { quadInOut } from 'svelte/easing';
  import { slide } from 'svelte/transition';

  export let open = false;
  export let key = {};
	export let id;
  
  const { current } = getAccordionContext();
  
  function handleClick() {
      $current = open ? null : key;
  }
  
  $: open = $current == key;
</script>

<div class="accordion-item" id={id}>
	<button class="header" on:click={handleClick}>
		<div class="text">
			<slot name="head" id=id-{id}/>
		</div>
	</button>

	{#if open}
		<div class="details" transition:slide="{{ duration: 150, easing: quadInOut }}">
			<slot name="details" id=id-{id} />
		</div>
	{/if}
</div>

<style>
	.accordion-item {
		margin: 0;
	}

	.header {
		display: flex;
		width: 100%;
		text-align: left;
	}

	.header .text {
		flex: 1;
	}

	.details {
		background-color: transparent;
		padding: 0.5rem;
		margin-bottom: 1rem;
	}
</style>

