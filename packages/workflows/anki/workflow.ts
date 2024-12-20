import { condition, defineSignal, proxyActivities, setHandler, defineQuery } from '@temporalio/workflow';
import { createAnkiActivites } from '@boilerplate/activities';
import * as toolActivites from '@boilerplate/activities/tools/activities';
import type { WorkflowSignalAddWord, WorkflowRequestAnkiLearningSession, WorkflowResponseAnkiLearningSession } from '@boilerplate/common';

const { createDeck, addNote, getModelNamesAndIds } = proxyActivities<ReturnType<typeof createAnkiActivites>>({
  scheduleToCloseTimeout: '1 minute',
  retry: {
    maximumAttempts: 3
  }
});

const { shuffleArray } = proxyActivities<typeof toolActivites>({
  startToCloseTimeout: '1 minute',
  retry: {
    maximumAttempts: 3
  }
});

export const ADD_CARD = defineSignal<[WorkflowSignalAddWord]>('ADD_CARD');
export const CREATE_DECK = defineSignal('CREATE_DECK');
export const GET_PROGRESS = defineQuery<WorkflowResponseAnkiLearningSession, []>('GET_PROGRESS');

export async function learningSession(request: WorkflowRequestAnkiLearningSession): Promise<WorkflowResponseAnkiLearningSession> {
  const { deckName } = request;
  const translations:Array<WorkflowSignalAddWord> = [];
  let readyToCreateDeck = false;
  const result:WorkflowResponseAnkiLearningSession = {
    notes: {
      added: 0,
      failed: 0,
    }
  }

  await getModelNamesAndIds();

  setHandler(ADD_CARD, (aWordRequest: WorkflowSignalAddWord) => {
    translations.push(aWordRequest);
  });

  setHandler(CREATE_DECK, () => {
    readyToCreateDeck = true;
  });

  setHandler(GET_PROGRESS, () => {
    return result;
  });

  await condition(() => readyToCreateDeck);

  // Create the deck
  try {
    await createDeck({deck: deckName});
  } catch(e) {
    console.error(e);
  }

  // Add Chinese Cards.
  for(const aTranslation of translations) {
    try {
      await addNote({
        note: {
          deckName,
          modelName: 'Basic',
          fields: {
            'Front': aTranslation.translatedText,
            'Back': aTranslation.queryText
          }
        }
      });
      result.notes.added = result.notes.added + 1;
    } catch (e) {
      console.error(e);
      result.notes.failed = result.notes.failed + 1;
    }
  }

  // Mix up the words.
  const shuffleTranslations = await shuffleArray(translations);
  // Add English Cards.
  for(const aTranslation of shuffleTranslations) {
    try {
      await addNote({
        note: {
          deckName,
          modelName: 'Basic (type in the answer)',
          fields: {
            'Front': aTranslation.queryText,
            'Back': aTranslation.translatedText
          }
        }
      });

      result.notes.added = result.notes.added + 1;
    } catch (e) {
      console.error(e);
      result.notes.failed = result.notes.failed + 1;
    }
  }

  return result;
}