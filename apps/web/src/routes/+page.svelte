<script lang="ts">
	import { Button } from '$lib/components/ui/button';
  import type { PostWorkflowRequest, PostWorkflowResponse } from '@boilerplate/common';

  let name = '';
  let greet = '';

	async function handleFormSubmit() {
    const workflowRequest:PostWorkflowRequest = {
      name
    }

    const response = await fetch('/api/workflow', {
      method: 'POST',
      body: JSON.stringify(workflowRequest),
      headers: {
      'content-type': 'application/json'
      }
    });

    const workflowResponse:PostWorkflowResponse = await response.json();
    greet = workflowResponse.greet;
  }
</script>

<h1>Web</h1>
<input bind:value={name} placeholder="Enter your name" />
<Button on:click={handleFormSubmit}>Submit</Button>
<p>{greet}</p>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>