import type { PostRequestAnkiCard } from '@boilerplate/common/';
import { connectToTemporal, getDeadline } from '@boilerplate/common/temporal';
import { CREATE_DECK, GET_PROGRESS } from '@boilerplate/workflows';
import { json, type RequestHandler } from '@sveltejs/kit';

export const POST = (async ({ request }) => {
  // Extract the `query` from the body of the request
  const workflowRequest:PostRequestAnkiCard = await request.json();
  const { workflowId, deckName, ...WorkflowSignalAddWord } = workflowRequest;

  // Create a Temporal Client
  const client = await connectToTemporal();
  const handle = await client.workflow.getHandle(workflowId);
  const deadline = getDeadline();
  const result = await handle.signal(CREATE_DECK);

  await client.connection.close();

  return json({result});
}) satisfies RequestHandler;

export const GET = (async ({ url }) => {
  // Create a Temporal Client
  const client = await connectToTemporal();
  const workflowId = url.searchParams.get('workflowId');
  
  if(!workflowId) {
    return json({});
  }

  const handle = client.workflow.getHandle(workflowId);
  const describe = await handle.describe();
  const results = await handle.query(GET_PROGRESS);

  await client.connection.close();

  return json({status: describe.status.name, results});
}) satisfies RequestHandler; 