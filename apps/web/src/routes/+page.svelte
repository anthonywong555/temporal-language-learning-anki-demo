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
    TranslationHistory, 
    PostRequestTranslation, 
	TranslationResponse,
	WorkflowResponseTranslation,
  FormattedTranslationResponse,
	Translation,
	TranslationServiceFrontendModel, PostRequestAnkiCard,
	GetRequestAnkiDeck} from '@boilerplate/common';
  import LoadingWheel from '../assets/Temporal_Logo_Animation.gif';
  import OpenAIDarkMode from '../assets/OpenAI-DarkMode.png';
  import Azure from '../assets/Azure.svelte';
  import Google from '../assets/Google.svelte';
  import OpenAI from '../assets/OpenAI.svg';
	import Anthropic from '../assets/Anthropic.png';

  // From Load
  export let data;

  let translationHistories:Array<TranslationHistory> = [];

  const DECK_NAME = 'Temporal Translation Deck';
  const WORKFLOW_ID = 'anki-deck';
  const DEFAULT_QUERYING_INTERVAL_IN_SECONDS = 3000;
  const googleTranslateSupportedLanguages = data.languages;

  let toLanguage = data.toLanguage;
  let fromLanguage = data.fromLanguage;
  let query = '';
  let currentQuery = '';
  let currentWorkflowId = '';
  let requestToInterval = new Map<string, NodeJS.Timer>(); // Keep track of all NodeJS.Timer
  let translationRequests:Array<PostRequestTranslation> = []; // All the translation requests goes here
  let currentTranslationResponse:FormattedTranslationResponse = {
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
        translationHistories.unshift({
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

        const interval = setInterval(() => fetchTranslations(aTranslationRequest), DEFAULT_QUERYING_INTERVAL_IN_SECONDS); // // Poll every 5 seconds
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
      const response:WorkflowResponseTranslation = (await fetchRequest.json());
      console.log(`response`, response);
      console.log(`Workflow Status ${response.status}`);

      if(response.status != 'RUNNING') {
        // The Workflow is completed!
        console.log(`About to stop polling`, aTranslationRequest);
        await stopPollingTranslationResults(aTranslationRequest);
      }

      if(response.status === 'RUNNING' || response.status === 'COMPLETED') {
        // Format the response so it can be useable in the front-end
        // Transforming TranslationServiceResponse to TranslationServiceFrontEndModel
        const formattedResults:Array<TranslationServiceFrontendModel> = response.results.map((aTranslationServiceResponse) => {
          const {service, model, possibleTranslations, errorMessage} = aTranslationServiceResponse;
          const formattedTranslations = possibleTranslations.map((aTranslatedText) => {
            return {
              translatedText: aTranslatedText,
              isSave: false
            };
          });

          return {
            service,
            model,
            errorMessage,
            possibleTranslations: formattedTranslations
          };
        });
        
        const index = translationHistories.findIndex(aHistory => aHistory.request.workflowId == aTranslationRequest.workflowId);
        
        console.log(`index`, index);
        let newResponse:TranslationResponse = { status: response.status, results: []};
        if(index !== -1) {
          newResponse.results = translationHistories[index].response.results;

          for(const aService of formattedResults) {
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

        if(currentQuery === aTranslationRequest.query) {
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

  async function addTranslationToDeck(aTranslation: Translation, query: string) {
    try {
      const request:PostRequestAnkiCard = {
        queryText: query,
        translatedText: aTranslation.translatedText,
        deckName: DECK_NAME,
        workflowId: WORKFLOW_ID
      };
      const response = await fetch('/api/anki/card', {
        method: 'POST',
        body: JSON.stringify(request),
        headers: {
          'content-type': 'application/json'
        }
      });
      
      // Toast Message
      toast.success(`Word '${aTranslation.translatedText}' has been saved!`);

      // Add a Badge
      const aTranslationHistory = translationHistories.find(aHistory => aHistory.request.workflowId == currentWorkflowId);
      if(aTranslationHistory) {
        aTranslation.isSave = true;

        aTranslationHistory.isSave = true;
        translationHistories = [...translationHistories];
        translationHistories = translationHistories;
        console.log(translationHistories);

        currentTranslationResponse = aTranslationHistory.response;
      }
    } catch(e) {
      console.error(e);
      toast.error(`Failed to add ${aTranslation.translatedText} to the deck.`);
    }
  }

  function copyToClipboard(text:string) {
    navigator.clipboard.writeText(text)
      .then(() => toast.success(`Word '${text}' has copied to the clipboard.`))
      .catch(err => toast.error(`Word '${text}' failed to copy to the clipboard.`));
  }

  async function saveDeck() {
    try {
      await fetch('/api/anki/deck', {
        method: 'POST',
        body: JSON.stringify({
          workflowId: WORKFLOW_ID
        }),
        headers: {
          'content-type': 'application/json'
        }
      });

      const intervalId = setInterval(async () => {
        const fetchRequest = await fetch(`/api/anki/deck?workflowId=${WORKFLOW_ID}`, {
          method: 'GET',
          headers: {
            'content-type': 'application/json'
          }
        });
        const response:GetRequestAnkiDeck = (await fetchRequest.json());

        if(response.status === 'RUNNING') {
          toast.loading('Saving the deck.');
        } else {
          if(response.status === 'COMPLETED') {
            toast.info(`Deck Saved! See deck ${DECK_NAME}!`, {
              description: `Added: ${response.results.notes.added}. \n
              Failed: ${response.results.notes.failed}`,
              duration: 5000
            });
          } else {
            toast.error(`Failed to save the deck`);
          }
          clearInterval(intervalId);
        }
      }, DEFAULT_QUERYING_INTERVAL_IN_SECONDS); // 5 seconds

      // Toast Message
      toast.loading('Saving the deck.');
    } catch(e) {
      toast.error(`Failded to save the deck`);
    }
  }
</script>

<Navbar />
<div class="flex flex-row justify-between">
  <div class="flex flex-col basis-1/3 border rounded-md p-3 sm:p-0 min-h-[80vh] max-h-[80vh]">
    <div class="">
      <h1 class="text-center">Searches History</h1>
    </div>
    <div class="grid grid-cols-1 gap-2 overflow-y-auto">
      {#each translationHistories as aTranslationHistory, index}
        <Card.Root>
          <Card.Header>
            <Card.Title>
              {aTranslationHistory.request.query}
              {#if aTranslationHistory.isSave}
              <Badge class="bg-green-500">Saved</Badge>
              {/if}
            </Card.Title>
            <Card.Description>
              <span>{aTranslationHistory.request.fromLanguage} to {aTranslationHistory.request.toLanguage}</span>
              <br />
              <span class="{
                aTranslationHistory.response.status === 'COMPLETED' ?
                'text-green-600' : 
                aTranslationHistory.response.status === 'RUNNING' ? 
                'text-blue-600' : 'text-yellow-600'}">{aTranslationHistory.response.status}
              </span>
            </Card.Description>
          </Card.Header>
          <Card.Footer class="flex justify between">
            <Button on:click={() => switchHistory(aTranslationHistory.request.workflowId)}>Switch</Button>
          </Card.Footer>
        </Card.Root>
      {/each}
    </div>
    <Button on:click={() => saveDeck()}>Sync to Deck</Button>
  </div>
  <div class="flex flex-col basis-2/3 min-h-[80vh] max-h-[80vh]">
    <div class="flex flex-wrap justify-evenly">
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
      <img class="loading-gif dark:invert" src={LoadingWheel} alt='Loading Wheel' width="140px" height="140px" />
    {/if}
    <div class="grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-0 overflow-y-auto">
      {#each currentTranslationResponse.results as aService}
        {#each aService.possibleTranslations as aTranslation}
          <div class="p-4">
            <Card.Root class="{aTranslation.isSave ? 'border-green-500': ''}">
              <Card.Header>
                <Card.Title>
                  {#if aService.service === 'OpenAI'}
                  <img src={OpenAI} alt="Open AI Logo" class="logos dark:hidden" />
                  <img src={OpenAIDarkMode} alt="Open AI Logo" class="logos hidden dark:block" />
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
                  <Tooltip.Trigger>
                    <Button class="appearance-none bg-transparent border-none p-0 m-0 hover:appearance-none hover:bg-transparent hover:border-none hover:p-0" on:click={() => copyToClipboard(aTranslation.translatedText)}>
                      <span class="text-black dark:text-white">{aTranslation.translatedText}</span>
                    </Button>
                  </Tooltip.Trigger>
                  <Tooltip.Content>
                    <p>Copy to clipboard</p>
                  </Tooltip.Content>
                </Tooltip.Root>
              </Card.Content>
              <Card.Footer class="flex justify-between">
                <Button class="w-full" variant="default"
                on:click={() => {addTranslationToDeck(aTranslation, currentQuery)}}>
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
  }
</style>