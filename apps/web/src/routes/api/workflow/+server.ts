import type { PostWorkflowRequest, PostWorkflowResponse } from '@boilerplate/common/';
import { taskQueue, connectToTemporal } from '@boilerplate/common/temporal';
import { example } from '@boilerplate/workflows';
import { json, type RequestHandler } from '@sveltejs/kit';
import { v4 as uuidv4 } from "uuid";

export const POST = (async ({ request }) => {
  // Create a Temporal Client
  const client = await connectToTemporal();

  // Extract the `query` from the body of the request
  const workflowRequest:PostWorkflowRequest = await request.json();
  const { name } = workflowRequest;
  const workflowId = uuidv4();

  // Create a Temporal Workflow
  const greet = await client.workflow.execute(example, {
    taskQueue,
    args: [{ name }],
    workflowId
  });

  const workflowResponse:PostWorkflowResponse = {
    greet
  }

  await client.connection.close();

  return json(workflowResponse);
}) satisfies RequestHandler;