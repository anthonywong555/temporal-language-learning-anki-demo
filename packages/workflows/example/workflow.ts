import { proxyActivities } from '@temporalio/workflow';
import type { WorkflowRequestExample } from '@boilerplate/common';
import type * as activities from '@boilerplate/activities';

const { greet } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
  retry: {
    maximumAttempts: 3
  }
});

export async function example(aRequest: WorkflowRequestExample): Promise<string> {
  return await greet(aRequest);
}