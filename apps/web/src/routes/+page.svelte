<script lang="ts">
  import Navbar from '../components/Navbar.svelte';
	import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import * as Card from "$lib/components/ui/card";
  import * as Select from "$lib/components/ui/select";
  import { Badge } from "$lib/components/ui/badge";
  import { Label } from "$lib/components/ui/label";
  import { ScrollArea } from "$lib/components/ui/scroll-area";
  import { toast } from "svelte-sonner";
  import Check from 'lucide-svelte/icons/check';
  import * as Tooltip from "$lib/components/ui/tooltip";
  import ChevronsUpDown from "lucide-svelte/icons/chevrons-up-down";
  import * as Command from "$lib/components/ui/command";
  import * as Popover from "$lib/components/ui/popover";
  import * as Avatar from "$lib/components/ui/avatar";
  import StatusIndicator from '$lib/components/ui/status-indicator/status-indicator.svelte';
  import { cn } from "$lib/utils.js";
  import { tick } from "svelte";
  import Sun from "svelte-radix/Sun.svelte";
  import Moon from "svelte-radix/Moon.svelte";
  import { toggleMode } from "mode-watcher";
  
  /*
  const frameworks = [
    {
      value: "sveltekit",
      label: "SvelteKit"
    },
    {
      value: "next",
      label: "Next.js"
    },
    {
      value: "astro",
      label: "Astro"
    },
    {
      value: "nuxt",
      label: "Nuxt.js"
    }
  ];
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
  */
  async function handleTemporalCheck() {
    console.log(`handleTemporalCheck`);
    try {
      const response = await fetch('/api/temporal', {
        method: 'GET',
      });
      console.log(await response.json());
    } catch(e) {
      //console.error(e);
    }
  }

  async function handleAnkiHealthCheck() {
    console.log(`handleAnkiHealthCheck`);
    try {
      const response = await fetch('/api/anki', {
        method: 'GET',
      });
      console.log(await response.json());
    } catch(e) {
      //console.error(e);
    }
  }

  async function handleButtonClick() {
    try {
      await Promise.all([handleAnkiHealthCheck(), handleTemporalCheck()])
    } catch(e) {
      console.error(e);
    }
  }

  const frameworks = [
    {
      value: "sveltekit",
      label: "SvelteKit",
    },
    {
      value: "next.js",
      label: "Next.js",
    },
    {
      value: "nuxt.js",
      label: "Nuxt.js",
    },
    {
      value: "remix",
      label: "Remix",
    },
    {
      value: "astro",
      label: "Astro",
    },
  ];
 
  let open = false;
  let value = "";
 
  $: selectedValue =
    googleTranslateSupportedLanguages.find((f) => f === value) ??
    "To Language";
 
  // We want to refocus the trigger button when the user selects
  // an item from the list so users can continue navigating the
  // rest of the form with the keyboard.
  function closeAndFocusTrigger(triggerId: string) {
    open = false;
    tick().then(() => {
      document.getElementById(triggerId)?.focus();
    });
  }

  const languages = [
    { label: "English", value: "en" },
    { label: "French", value: "fr" },
    { label: "German", value: "de" },
    { label: "Spanish", value: "es" },
    { label: "Portuguese", value: "pt" },
    { label: "Russian", value: "ru" },
    { label: "Japanese", value: "ja" },
    { label: "Korean", value: "ko" },
    { label: "Chinese", value: "zh" }
  ] as const;
 
  type Language = (typeof languages)[number]["value"];

  const kamenRiders = ['Kamen Rider', 'V3', 'X', 'Amazon', 'Stronger'];
  const googleTranslateSupportedLanguages = [
    "Afrikaans", "Albanian", "Amharic", "Arabic", "Armenian", "Assamese", 
    "Aymara", "Azerbaijani", "Bambara", "Basque", "Belarusian", "Bengali", 
    "Bhojpuri", "Bosnian", "Bulgarian", "Catalan", "Cebuano", "Chinese (Simplified)", 
    "Chinese (Traditional)", "Corsican", "Croatian", "Czech", "Danish", "Dhivehi", 
    "Dogri", "Dutch", "English", "Esperanto", "Estonian", "Ewe", "Filipino", "Finnish", 
    "French", "Frisian", "Galician", "Georgian", "German", "Greek", "Guarani", 
    "Gujarati", "Haitian Creole", "Hausa", "Hawaiian", "Hebrew", "Hindi", "Hmong", 
    "Hungarian", "Icelandic", "Igbo", "Ilocano", "Indonesian", "Irish", "Italian", 
    "Japanese", "Javanese", "Kannada", "Kazakh", "Khmer", "Kinyarwanda", "Konkani", 
    "Korean", "Krio", "Kurdish (Kurmanji)", "Kurdish (Sorani)", "Kyrgyz", "Lao", 
    "Latin", "Latvian", "Lingala", "Lithuanian", "Luganda", "Luxembourgish", "Macedonian", 
    "Maithili", "Malagasy", "Malay", "Malayalam", "Maltese", "Maori", "Marathi", 
    "Meiteilon (Manipuri)", "Mizo", "Mongolian", "Myanmar (Burmese)", "Nepali", 
    "Norwegian", "Nyanja (Chichewa)", "Odia (Oriya)", "Oromo", "Pashto", "Persian", 
    "Polish", "Portuguese", "Punjabi", "Quechua", "Romanian", "Russian", "Samoan", 
    "Sanskrit", "Scots Gaelic", "Sepedi", "Serbian", "Sesotho", "Shona", "Sindhi", 
    "Sinhala", "Slovak", "Slovenian", "Somali", "Spanish", "Sundanese", "Swahili", 
    "Swedish", "Tagalog (Filipino)", "Tajik", "Tamil", "Tatar", "Telugu", "Thai", 
    "Tigrinya", "Tsonga", "Turkish", "Turkmen", "Twi (Akan)", "Ukrainian", "Urdu", 
    "Uyghur", "Uzbek", "Vietnamese", "Welsh", "Xhosa", "Yiddish", "Yoruba", "Zulu"
  ];

  const possibleTranslations = [{
    'service': 'Google',
    'model': 'translate',
    'translation': '我哋'
  }, {
    'service': 'Azure',
    'model': 'translate',
    'translation': '我哋',
  }, {
    'service': 'OpenAI',
    'model': 'gpt-4o',
    'translation': '我們',
  }, {
    'service': 'Anthropic',
    'model': 'claude-3-5-sonnet-20241022',
    'translation': '我們'
  }]
</script>

<Navbar />
<div class="flex flex-row">
  <div class="flex flex-col basis-1/3 border-2 border-purple-600 p-3 sm:p-0">
    <div class="items-center">
      <h1>Past Searches</h1>
    </div>
    <div class="grid grid-cols-1 gap-2 max-h-[85vh] overflow-y-auto">
      {#each googleTranslateSupportedLanguages as language, index}
        <Card.Root>
          <Card.Header>
            <Card.Title>{language}</Card.Title>
            {#if index % 2 === 0}
              <Card.Description class="text-green-600">
                Completed
                <Badge variant="default" class="bg-green-500">Saved</Badge>
              </Card.Description>
              {:else if index % 3 === 0}
              <Card.Description class="text-blue-600">
                Running
              </Card.Description>
            {/if}
          </Card.Header>
        </Card.Root>
      {/each}
    </div>
    <Button>Sync</Button>
  </div>
  <div class="flex flex-col basis-2/3 border-2 border-black-500">
    <div class="flex flex-row">
      <h1>Translate</h1>
      <Popover.Root bind:open let:ids>
        <Popover.Trigger asChild let:builder>
          <Button
            builders={[builder]}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            class="w-[200px] justify-between"
          >
            {selectedValue}
            <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </Popover.Trigger>
        <Popover.Content class="w-[200px] max-h-[200px] overflow-y-auto overflow-y-auto p-0">
          <Command.Root>
            <Command.Input placeholder="Language" />
            <Command.Empty>No Language Found.</Command.Empty>
            <Command.Group>
              {#each googleTranslateSupportedLanguages as language}
                <Command.Item
                  value={language}
                  onSelect={(currentValue) => {
                    value = currentValue;
                    closeAndFocusTrigger(ids.trigger);
                  }}
                >
                  <Check
                    class={cn(
                      "mr-2 h-4 w-4",
                      value !== language && "text-transparent"
                    )}
                  />
                  {language}
                </Command.Item>
              {/each}
            </Command.Group>
          </Command.Root>
        </Popover.Content>
      </Popover.Root>
    </div>
    <Input id="name" placeholder="Word" />
    <Button on:click={() => {handleButtonClick()}}>Search</Button>
    <div class="grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-0 max-h-[75vh] overflow-y-auto">
      {#each googleTranslateSupportedLanguages as language}
        <div class="p-4">
          <Card.Root>
            <Card.Header>
              <Card.Title>{language}</Card.Title>
              <Card.Description>{language}</Card.Description>
            </Card.Header>
            <Card.Content>
              <Tooltip.Root>
                <Tooltip.Trigger>{language}</Tooltip.Trigger>
                <Tooltip.Content>
                  <p>Copy to clipboard</p>
                </Tooltip.Content>
              </Tooltip.Root>
            </Card.Content>
            <Card.Footer class="flex justify-between">
              <Button class="w-full" variant="default"
              on:click={() =>
                toast.success(`Word '${language}' has been saved!`, {
                })}>
                Save
              </Button>
            </Card.Footer>
          </Card.Root>
        </div>
      {/each}
      <!--
      {#each possibleTranslations as aTranslation}
        <div class="p-4">
          <Card.Root>
            <Card.Header>
              <Card.Title>{aTranslation.service}</Card.Title>
              <Card.Description>{aTranslation.model}</Card.Description>
            </Card.Header>
            <Card.Content>
              {aTranslation.translation}
            </Card.Content>
            <Card.Footer class="flex justify-between">
              <Button class="w-full" variant="default">
                Save
              </Button>
            </Card.Footer>
          </Card.Root>
        </div>
      {/each}
      -->
    </div>
  </div>
</div>
<!--
<Card.Root class="w-[350px]">
  <Card.Header>
    <Card.Title>Create project</Card.Title>
    <Card.Description>Deploy your new project in one-click.</Card.Description>
  </Card.Header>
  <Card.Content>
    <form>
      <div class="grid w-full items-center gap-4">
        <div class="flex flex-col space-y-1.5">
          <Label for="name">Name</Label>
          <Input id="name" placeholder="Name of your project" />
        </div>
        <div class="flex flex-col space-y-1.5">
          <Label for="framework">Framework</Label>
          <Select.Root>
            <Select.Trigger id="framework">
              <Select.Value placeholder="Select" />
            </Select.Trigger>
            <Select.Content>
              {#each frameworks as framework}
                <Select.Item value={framework.value} label={framework.label}
                  >{framework.label}</Select.Item
                >
              {/each}
            </Select.Content>
          </Select.Root>
        </div>
      </div>
    </form>
  </Card.Content>
  <Card.Footer class="flex justify-between">
    <Button variant="outline">Cancel</Button>
    <Button>Deploy</Button>
  </Card.Footer>
</Card.Root>
<Input type="text" placeholder="First Name" class="" bind:value={name} />
<Button on:click={handleFormSubmit}>Submit</Button>
<Button
  variant="outline"
  on:click={() =>
    toast.success("Event has been created", {
      description: "Sunday, December 03, 2023 at 9:00 AM",
      action: {
        label: "Undo",
        onClick: () => console.info("Undo")
      }
    })}
>
  Show Toast
</Button>
<p>{greet}</p>

-->