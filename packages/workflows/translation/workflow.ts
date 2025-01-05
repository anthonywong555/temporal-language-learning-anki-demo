import { defineQuery, proxyActivities, startChild, workflowInfo, setHandler } from '@temporalio/workflow';
import type { WorkflowRequestTranslation, PromiseResult, TranslationServiceResponse, WorkflowResponseTranslation } from '@boilerplate/common';
import { createAnthropicActivites, createGoogleActivites, createOpenAIActivites, createAzureActivites } from '@boilerplate/activities';
import * as toolActivites from '@boilerplate/activities/tools/activities';
import type Anthropic from '@anthropic-ai/sdk';
import type { TranslatedTextItemOutput } from '@azure-rest/ai-translation-text';

const { randomDelay, checkEnvIsValid } = proxyActivities<typeof toolActivites>({
  startToCloseTimeout: '1 minute',
  retry: {
    maximumAttempts: 3
  }
});

const { detectLanguage, translateText, listLanguages } = proxyActivities<ReturnType<typeof createGoogleActivites>>({
  scheduleToCloseTimeout: '1 minute',
  retry: {
    maximumAttempts: 3
  }
});

const { translate, getLanguages } = proxyActivities<ReturnType<typeof createAzureActivites>>({
  scheduleToCloseTimeout: '1 minute',
  retry: {
    maximumAttempts: 3
  }
})

const { anthropicCreateMessage } = proxyActivities<ReturnType<typeof createAnthropicActivites>>({
  scheduleToCloseTimeout: '1 minute',
  retry: {
    maximumAttempts: 3
  }
})

const { openAICreateMessage } = proxyActivities<ReturnType<typeof createOpenAIActivites>>({
  scheduleToCloseTimeout: '3 minute',
  retry: {
    maximumAttempts: 3
  }
});

export const getTranslations = defineQuery<Array<TranslationServiceResponse>, []>('getTranslations');

const translationServices = [
  {
    name: 'anthropic',
    handler: AnthropicAIGetPossibleTranslation,
    env: ['ANTHROPIC_API_KEY']
  },
  {
    name: 'openAI',
    handler: OpenAIGetPossibleTranslation,
    env: ['OPENAI_API_KEY']
  },
  {
    name: 'google',
    handler: googleTranslate,
    env: ['GOOGLE_CLOUD_API_KEY']
  },
  {
    name: 'azure',
    handler: azureTranslate,
    env: ['AZURE_API_KEY', 'AZURE_REGION', 'AZURE_ENDPOINT']
  }
]

export async function translation(aRequest: WorkflowRequestTranslation): Promise<Array<TranslationServiceResponse>> {
  /**
   * Optional. If you want to use Google Translate Detect API
   */
  /*
  const detectResults = await detectLanguage(aRequest.query);
  if(detectResults.length > 0) {
    // Return the most possible language
    const aDetectResult = detectResults[0];
    return aDetectResult.language;
  }
  */

  // Hit up AI Models to find out what is the possible translation of the give word.
  const results:Array<TranslationServiceResponse> = [];
  const translationServiceChildWorkflows:Promise<any>[] = [];

  // Define the Query Handler
  setHandler(getTranslations, () => {
    return results;
  });


  for(const aTranslationService of translationServices) {
    if(await checkEnvIsValid(aTranslationService.env)) {
      translationServiceChildWorkflows.push(
        startChild(aTranslationService.handler, {
          args: [aRequest],
          workflowId: `${aTranslationService.name}-${workflowInfo().workflowId}`
        })
      );
    }
  }

  if(translationServiceChildWorkflows.length === 0) {
    return [];
  }

  const handlers = await Promise.all(translationServiceChildWorkflows);

  const runningTranslationServices = handlers.map((aService) => aService.result());

  while(runningTranslationServices.length > 0) {
    const racePromises = runningTranslationServices.map((promise, index) =>
      promise
        .then((value) => ({ status: 'resolved', value, index } as PromiseResult))
        .catch((error) => ({ status: 'rejected', error, index } as PromiseResult))
    );

    const resolveChildWorkflow = await Promise.race(racePromises);

    if(resolveChildWorkflow.status === 'resolved' && resolveChildWorkflow.value) {
      results.push(resolveChildWorkflow.value);
    }

    // results.push(resolveChildWorkflow.value);
    runningTranslationServices.splice(resolveChildWorkflow.index, 1);

    // Log the result
    if (resolveChildWorkflow.status === 'resolved') {
      console.log(`Promise resolved: ${resolveChildWorkflow.value}`);
    } else {
      console.log(`Promise rejected: ${resolveChildWorkflow.error}`);
    }
  }

  return results;
}

export async function OpenAIGetPossibleTranslation(aRequest: WorkflowRequestTranslation): Promise<any> {
  const service = 'OpenAI';
  const model = 'gpt-4o';
  let possibleTranslations:string[] = [];

  // Look for possible translation
  const openAIResponse = await openAICreateMessage({
    messages: [{ 
      role: 'user', 
      content: `Get the possible translation of '${aRequest.query}' from '${aRequest.fromLanguage}' in '${aRequest.toLanguage}' i.e Please only return back an array of strings.` 
    }],
    model,
  });

  for(const aChoice of openAIResponse.choices) {
    if(aChoice.message && aChoice.message.content) {
      possibleTranslations = possibleTranslations.concat(JSON.parse(aChoice.message.content));
    }
  }

  return {
    service,
    model,
    possibleTranslations
  };
}

export async function AnthropicAIGetPossibleTranslation(aRequest: WorkflowRequestTranslation): Promise<any> {
  const service = 'Anthropic';
  const model = 'claude-3-5-sonnet-20241022';
  let possibleTranslations:any[] = [];

  const anthropicResponse = await anthropicCreateMessage({
    model,
    max_tokens: 1024,
    messages: [{ 
      role: "user", 
      content: `Get the possible translation of '${aRequest.query}' from '${aRequest.fromLanguage}' in '${aRequest.toLanguage}' i.e Please only return back an array of strings.`  
    }],
  });

  for(const aContent of anthropicResponse.content) {
    const aTextBlock = aContent as Anthropic.TextBlock;
    
    if(aTextBlock.text) {
      possibleTranslations = possibleTranslations.concat(JSON.parse(aTextBlock.text));
    }
  }

  return {
    service,
    model,
    possibleTranslations
  }
}

export async function googleTranslate(aRequest: WorkflowRequestTranslation): Promise<TranslationServiceResponse> {
  const service = 'Google';
  const model = 'Translate';
  let possibleTranslations:any[] = [];

  const languages = await listLanguages();

  let fromLanguageCode = '';
  let toLanguageCode = '';

  for(const aLanguage of languages[0]) {
    if(aLanguage.name === aRequest.fromLanguage) {
      fromLanguageCode = aLanguage.code;
    } else if(aLanguage.name === aRequest.toLanguage) {
      toLanguageCode = aLanguage.code;
    }

    if(fromLanguageCode && toLanguageCode) {
      break;
    }
  }

  if(fromLanguageCode && toLanguageCode) {
    const googleResponse = await translateText(aRequest.query, {
      from: fromLanguageCode,
      to: toLanguageCode,
      format: 'text'
    });
  
    if(googleResponse) {
      possibleTranslations = possibleTranslations.concat(googleResponse[0]);
    }
  }

  return {
    service,
    model,
    possibleTranslations
  };
}

export async function azureTranslate(aRequest: WorkflowRequestTranslation) {
  const service = 'Azure';
  const model = 'Translation';
  const possibleTranslations:Array<string> = [];

  const languageResponse = await getLanguages();

  const languages = languageResponse.body;

  let fromLanguageCode = '';
  let toLanguageCode = '';

  if(languages.translation) {
    for (const key in languages.translation) {
      const translationLanguage = languages.translation[key];

      if(aRequest.fromLanguage === translationLanguage.name) {
        fromLanguageCode = key;
      } else if(aRequest.toLanguage === translationLanguage.name) {
        toLanguageCode = key;
      }

      if(fromLanguageCode && toLanguageCode) {
        break;
      }
    }
  }

  if(fromLanguageCode && toLanguageCode) {
    const azureResponse = await translate({
      body: [{
        text: aRequest.query
      }],
      queryParameters: {
        from: fromLanguageCode,
        to: toLanguageCode
      }
    });
  
    const test = azureResponse.body;
    if((test as TranslatedTextItemOutput[]).length > 0) {
      const test1 = (test as TranslatedTextItemOutput[]);
      const azureResults = test1[0].translations;
  
      for(const aWord of azureResults) {
        possibleTranslations.push(aWord.text);
      }
    }
  }

  return {
    service,
    model,
    possibleTranslations
  };
}