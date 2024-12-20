import type { PostRequestAnkiCard } from '@boilerplate/common/';
import { taskQueue, connectToTemporal, getDeadline } from '@boilerplate/common/temporal';
import { learningSession, ADD_CARD } from '@boilerplate/workflows';
import { json, type RequestHandler } from '@sveltejs/kit';

export const POST = (async ({ request }) => {
  // Extract the `query` from the body of the request
  const workflowRequest:PostRequestAnkiCard = await request.json();
  const { workflowId, deckName, ...WorkflowSignalAddWord } = workflowRequest;

  console.log(workflowRequest);

  // Create a Temporal Client
  const client = await connectToTemporal();
  const deadline = getDeadline();
  const result = await client.withDeadline(deadline, ()=> 
    client.workflow.signalWithStart(learningSession, {
      workflowId,
      taskQueue,
      args: [{ deckName }],
      signal: ADD_CARD,
      signalArgs: [ WorkflowSignalAddWord ]
    })
  );

  await client.connection.close();

  return json({result});
}) satisfies RequestHandler;