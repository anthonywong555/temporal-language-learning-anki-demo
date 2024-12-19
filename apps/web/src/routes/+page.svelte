<script lang="ts">
  import Navbar from '../components/Navbar.svelte';
	import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import * as Card from "$lib/components/ui/card";
  import { Badge } from "$lib/components/ui/badge";
  import { toast } from "svelte-sonner";
  import * as Tooltip from "$lib/components/ui/tooltip";
  import SearchableSelect from '$lib/components/ui/searchable-select/searchable-select.svelte';
  import { v4 as uuidv4 } from "uuid";
  import type { 
    WorkflowRequestTranslation, 
    TranslationServiceResponse, 
    TranslationHistory, 
    PostResponseTranslation,
    PostRequestTranslation, 
	TranslationResponse} from '@boilerplate/common';
 
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

  let translationHistories:Array<TranslationHistory> = [];

  let toLanguage = '';
  let fromLanguage = '';
  let query = '';
  let requestToInterval = new Map<string, NodeJS.Timer>(); // Keep track of all NodeJS.Timer
  let translationRequests:Array<PostRequestTranslation> = []; // All the translation requests goes here
  let currentTranslationRequests:TranslationResponse = {
    results: [],
    status: ''
  };

  async function onSearch() {
    if(toLanguage && fromLanguage && query) {
      try {
        const aTranslationRequest:PostRequestTranslation = {
          fromLanguage,
          toLanguage,
          query,
          workflowId: uuidv4()
        };

        await fetch('/api/translation', {
          method: 'POST',
          body: JSON.stringify(aTranslationRequest),
          headers: {
            'content-type': 'application/json'
          }
        });

        const interval = setInterval(() => fetchTranslations(aTranslationRequest), 5000); // // Poll every 5 seconds
        currentTranslationRequests = {status: '', results: []}
        translationRequests = [...translationRequests, {...aTranslationRequest}];
        requestToInterval.set(aTranslationRequest.workflowId, interval);
      } catch(e) {
        // TODO: Show a Toast Message
        console.error(`An error has occurred`, e);
        return;
      }
    }
  }

  async function fetchTranslations(aTranslationRequest: PostRequestTranslation) {
    try {
      const fetchRequest = await fetch(`/api/translation?workflowId=${aTranslationRequest.workflowId}`, {
        method: 'GET',
        headers: {
          'content-type': 'application/json'
        },
      });
      const response = (await fetchRequest.json());
      console.log(`response`, response);

      if(response.status === 'COMPLETED' || response.status === 'FAILED') {
        // The Workflow is completed!
        console.log(`About to stop polling`, aTranslationRequest);
        await stopPollingTranslationResults(aTranslationRequest);
      }

      if(response.status === 'RUNNING' || response.status === 'COMPLETED') {
        currentTranslationRequests = response;
        
      }
    } catch(e) {
      console.error(e);
      await stopPollingTranslationResults(aTranslationRequest);
    }
  }

  async function stopPollingTranslationResults(aTranslationRequest: PostRequestTranslation) {
    clearInterval(requestToInterval.get(aTranslationRequest.workflowId));
    requestToInterval.delete(aTranslationRequest.workflowId);
	}
</script>

<Navbar />
<div class="flex flex-row">
  <div class="flex flex-col basis-1/3 border-2 border-purple-600 p-3 sm:p-0">
    <div class="items-center">
      <h1>Past Searches</h1>
    </div>
    <div class="grid grid-cols-1 gap-2 max-h-[85vh] overflow-y-auto">
      {#each translationHistories as aTranslationHistory, index}
        <Card.Root>
          <Card.Header>
            <Card.Title>{aTranslationHistory.request.query}</Card.Title>
            {#if aTranslationHistory.response.status === 'COMPLETED'}
              <Card.Description class="text-green-600">
                Completed
              </Card.Description>
              {:else if aTranslationHistory.response.status === 'RUNNING'}
              <Card.Description class="text-blue-600">
                Running
              </Card.Description>
              {:else if aTranslationHistory.response.status != 'RUNNING' && aTranslationHistory.response.status != 'COMPLETED'}
              <Card.Description class="text-yellow-600">
                {aTranslationHistory.response.status}
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
      <SearchableSelect 
        items={googleTranslateSupportedLanguages}
        defaultText="From Language"
        noAvailableText="No Language found."
        bind:value={fromLanguage}
      />
      <h1>to</h1>
      <SearchableSelect 
        items={googleTranslateSupportedLanguages}
        defaultText="To Language"
        noAvailableText="No Language found."
        bind:value={toLanguage}
      />
    </div>
    <Input id="name" placeholder="Word" bind:value={query}/>
    <Button on:click={() => {onSearch()}}>Search</Button>
    <div class="grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-0 max-h-[75vh] overflow-y-auto">
      {#each currentTranslationRequests.results as aService}
        {#each aService.possibleTranslations as aTranslation}
          <div class="p-4">
            <Card.Root>
              <Card.Header>
                <Card.Title>{aService.service}</Card.Title>
                <Card.Description>{aService.model}</Card.Description>
              </Card.Header>
              <Card.Content>
                <Tooltip.Root>
                  <Tooltip.Trigger>{aTranslation}</Tooltip.Trigger>
                  <Tooltip.Content>
                    <p>Copy to clipboard</p>
                  </Tooltip.Content>
                </Tooltip.Root>
              </Card.Content>
              <Card.Footer class="flex justify-between">
                <Button class="w-full" variant="default"
                on:click={() =>
                  toast.success(`Word '${aTranslation}' has been saved!`, {
                  })}>
                  Save
                </Button>
              </Card.Footer>
            </Card.Root>
          </div>
        {/each}
      {/each}
    </div>
  </div>
</div>