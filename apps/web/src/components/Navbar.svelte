<script lang="ts">
  import { onMount } from "svelte";
  import * as Tooltip from "$lib/components/ui/tooltip";
  import * as Avatar from "$lib/components/ui/avatar";
  import StatusIndicator from '$lib/components/ui/status-indicator/status-indicator.svelte';
  import { Button } from '$lib/components/ui/button';
  import Sun from "svelte-radix/Sun.svelte";
  import Moon from "svelte-radix/Moon.svelte";
  import { toggleMode } from "mode-watcher";
  import type { Service } from "./types";
  
  let services:Array<Service> = [{
    name: 'Anki',
    iconURL: 'https://upload.wikimedia.org/wikipedia/commons/3/3d/Anki-icon.svg',
    status: 'away',
    statusURL: '/api/anki'
  }, {
    name: 'Temporal',
    iconURL: 'https://avatars.githubusercontent.com/u/56493103?s=280&v=4',
    status: 'away',
    statusURL: '/api/temporal'
  }];

  async function getServiceStatus(aService: Service) {
    const index = services.findIndex((aServiceIt) => aServiceIt.name === aService.name);
    let status = 'busy';

    if(index != -1) {
      services[index].status = status;
      services = [...services];

      try {
        const response = await fetch(aService.statusURL, {
          method: 'GET',
        });

        if(response.status === 200) {
          status = 'online';
        }
      } catch(e) {
        // Silenty Fail
      }

      services[index].status = status;
      services = [...services];
    }
  }

  onMount(async () => {
    const promises = services.map((aService) => getServiceStatus(aService));
    await Promise.allSettled(promises);
  });

</script>

<div class="flex flex-row">
  <div>
    <span class="align-text-bottom">Temporal Language Learning Anki Demo</span>
  </div>
  {#each services as aService }
    <div>
      <Tooltip.Root>
        <Tooltip.Trigger>
          <Avatar.Root class="rounded-none">
            <Avatar.Image class="rounded-none" src={aService.iconURL} alt="@shadcn" />
            <Avatar.Fallback>{aService.name}</Avatar.Fallback>
            <StatusIndicator status={aService.status}/>
          </Avatar.Root>
        </Tooltip.Trigger>
        <Tooltip.Content>
          <p>Refresh Status</p>
        </Tooltip.Content>
      </Tooltip.Root>
    </div>
  {/each}
  <Button on:click={toggleMode} variant="outline" size="icon">
    <Sun
      class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
    />
    <Moon
      class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
    />
    <span class="sr-only">Toggle theme</span>
  </Button>
</div>