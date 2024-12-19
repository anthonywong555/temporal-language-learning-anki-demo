import type { PostResponseTranslation, PostRequestTranslation } from '@boilerplate/common/';
import { taskQueue, connectToTemporal } from '@boilerplate/common/temporal';
import { translation, getTranslations } from '@boilerplate/workflows';
import { json, type RequestHandler } from '@sveltejs/kit';

export const POST = (async ({ request }) => {
  // Create a Temporal Client
  const client = await connectToTemporal();

  // Extract the `query` from the body of the request
  const workflowRequest:PostRequestTranslation = await request.json();
  const { workflowId, ...aWorkflowRequest } = workflowRequest;

  // Create a Temporal Workflow
  const greet = await client.workflow.execute(translation, {
    taskQueue,
    args: [ aWorkflowRequest ],
    workflowId
  });

  const workflowResponse:PostResponseTranslation = {
    workflowId
  }

  await client.connection.close();

  return json(workflowResponse);
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
  const results = await handle.query(getTranslations);

  await client.connection.close();

  return json({status: describe.status.name, results});
}) satisfies RequestHandler; 