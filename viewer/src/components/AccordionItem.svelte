<!-- AccordionItem -->
<script>
  import { getAccordionContext } from './Accordion.svelte';
  import { quadInOut } from 'svelte/easing';
  import { slide } from 'svelte/transition';

  export let open = false;
  export let key = {};
  
  const { current } = getAccordionContext();
  
  function handleClick() {
      $current = open ? null : key;
  }
  
  $: open = $current == key;
</script>

<div class="accordion">
	<button class="header" on:click={handleClick}>
		<div class="text">
			<slot name="head"/>
		</div>
	</button>

	{#if open}
		<div class="details" transition:slide="{{ duration: 150, easing: quadInOut }}" >
			<slot name="details"/>
		</div>
	{/if}
</div>

<style>
	.accordion {
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

