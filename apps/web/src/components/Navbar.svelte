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
  import { toast } from "svelte-sonner";

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
    toast.loading(`Getting status of ${aService.name}`);

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
          toast.info(`${aService.name} is online 🥳`);
        } else {
          toast.error(`${aService.name} is offline.`);
        }
      } catch(e) {
        // Silenty Fail
        toast.error(`${aService.name} is offline.`);
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

<div class="flex justify-between">
  <div class="">
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
  <div class="place-content-center">
    <span class="">Temporal Language Learning Anki Demo</span>
  </div>
  <div class="">
  {#each services as aService }
      <Tooltip.Root>
        <Tooltip.Trigger>
          <Button class="appearance-none bg-transparent border-none p-0 m-0 hover:appearance-none hover:bg-transparent hover:border-none hover:p-0" on:click={() => getServiceStatus(aService)}>
            <Avatar.Root class="rounded-none">
              <Avatar.Image class="rounded-none" src={aService.iconURL} alt="@shadcn" />
              <Avatar.Fallback>{aService.name}</Avatar.Fallback>
              <StatusIndicator status={aService.status}/>
            </Avatar.Root>
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Content>
          <p>Refresh Status</p>
        </Tooltip.Content>
      </Tooltip.Root>
  {/each}
  </div>
</div>