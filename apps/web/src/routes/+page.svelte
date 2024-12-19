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
  import LoadingWheel from '../assets/Temporal_Logo_Animation.gif';
  import Azure from '../assets/Azure.svelte';
  import Google from '../assets/Google.svelte';
  import OpenAI from '../assets/OpenAI.svelte';
	import Anthropic from '../assets/Anthropic.png';

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
  let fromLanguage = 'English';
  let query = '';
  let currentQuery = '';
  let currentWorkflowId = '';
  let requestToInterval = new Map<string, NodeJS.Timer>(); // Keep track of all NodeJS.Timer
  let translationRequests:Array<PostRequestTranslation> = []; // All the translation requests goes here
  let currentTranslationResponse:TranslationResponse = {
    results: [],
    status: ''
  };

  async function onSearch() {
    if(toLanguage && fromLanguage && query) {
      currentQuery = `${query}`;
      query = '';

      try {
        const aTranslationRequest:PostRequestTranslation = {
          fromLanguage,
          toLanguage,
          query: currentQuery,
          workflowId: uuidv4()
        };

        currentTranslationResponse = {status: 'Schedule', results: []}

        currentWorkflowId = aTranslationRequest.workflowId;
        translationHistories.push({
          request: aTranslationRequest,
          response: currentTranslationResponse
        });

        translationHistories = [...translationHistories];

        await fetch('/api/translation', {
          method: 'POST',
          body: JSON.stringify(aTranslationRequest),
          headers: {
            'content-type': 'application/json'
          }
        });

        const interval = setInterval(() => fetchTranslations(aTranslationRequest), 5000); // // Poll every 5 seconds
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
    console.log(`fetchTranslation`, aTranslationRequest);
    try {
      const fetchRequest = await fetch(`/api/translation?workflowId=${aTranslationRequest.workflowId}`, {
        method: 'GET',
        headers: {
          'content-type': 'application/json'
        },
      });
      const response:TranslationResponse = (await fetchRequest.json());
      console.log(`response`, response);
      console.log(`Workflow Status ${response.status}`);

      if(response.status === 'COMPLETED' || response.status === 'FAILED') {
        // The Workflow is completed!
        console.log(`About to stop polling`, aTranslationRequest);
        await stopPollingTranslationResults(aTranslationRequest);
      }

      if(response.status === 'RUNNING' || response.status === 'COMPLETED') {
        currentTranslationResponse = response;
        
        const index = translationHistories.findIndex(aHistory => aHistory.request.workflowId == aTranslationRequest.workflowId);
        
        console.log(`index`, index);
        let newResponse:TranslationResponse = { status: response.status, results: []};
        if(index !== -1) {
          newResponse.results = translationHistories[index].response.results;

          for(const aService of response.results) {
            console.log(`aService.service`, aService.service);
            
            if(!newResponse.results.some((anElement) => anElement.service == aService.service)) {
              newResponse.results.push(aService);
            }
          }

          console.log(`newResponse`, newResponse);

          translationHistories[index] = {
            request: aTranslationRequest,
            response: newResponse,
            isSave: translationHistories[index].isSave
          };

          console.log(`changetranslationHistories[index]`, translationHistories[index]);

          translationHistories = [...translationHistories];
          translationHistories = translationHistories;
          console.log('translationHistories', translationHistories);
        }

        if(query === aTranslationRequest.query) {
          currentTranslationResponse = newResponse;
        }
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

  async function switchHistory(workflowId: string) {
    const aTranslationHistory = translationHistories.find(aHistory => aHistory.request.workflowId == workflowId);
    if(aTranslationHistory?.response) {
      currentQuery = aTranslationHistory.request.query;
      currentWorkflowId = workflowId;
      currentTranslationResponse = aTranslationHistory.response;
    }
  }
</script>

<Navbar />
<div class="flex flex-row">
  <div class="flex flex-col basis-1/3 border-2 border-black p-3 sm:p-0">
    <div class="items-center">
      <h1>Past Searches</h1>
    </div>
    <div class="grid grid-cols-1 gap-2 max-h-[85vh] overflow-y-auto">
      {#each translationHistories as aTranslationHistory, index}
        <Card.Root>
          <Card.Header>
            <Card.Title>
              {aTranslationHistory.request.query}
            </Card.Title>
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
          <Card.Footer class="flex justify between">
            <Button on:click={() => switchHistory(aTranslationHistory.request.workflowId)}>Switch</Button>
          </Card.Footer>
        </Card.Root>
      {/each}
    </div>
    <Button>Sync</Button>
  </div>
  <div class="flex flex-col basis-2/3 border-2 border-black">
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
    {#if currentTranslationResponse.results.length > 0}
        <h1>Search Results for {currentQuery}</h1>
      {:else if currentQuery != ''}
      <img class="loading-gif" src={LoadingWheel} alt='Loading Wheel' width="140px" height="140px" />
    {/if}
    <div class="grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-0 max-h-[75vh] overflow-y-auto">
      {#each currentTranslationResponse.results as aService}
        {#each aService.possibleTranslations as aTranslation}
          <div class="p-4">
            <Card.Root>
              <Card.Header>
                <Card.Title>
                  {#if aService.service === 'OpenAI'}
                  <OpenAI />
                  {:else if aService.service === 'Google'}
                  <Google />
                  {:else if aService.service === 'Azure'}
                  <Azure />
                  {:else if aService.service === 'Anthropic'}
                  <img src={Anthropic} alt="Anthropic Logo" class="logos" />
                {/if}
                </Card.Title>
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

<style>
  .loading-gif {
    animation: spin 2s linear infinite;
    max-width: 50%;
    margin: auto;
  }


  :global(svg) {
		max-width: 50px;
    max-height: 50px;
		display: block
	}

  .logos {
    max-width: 50px;
    max-height: 50px;
		display: block
  }
</style>