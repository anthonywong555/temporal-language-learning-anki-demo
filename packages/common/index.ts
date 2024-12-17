/**
 * Workflows
 */
export interface WorkflowRequestExample {
  name: string;
}

/**
 * Activites
 */
export interface ActivityRequestGreet {
  name: string;
}

/**
 * Svelte APIs
 */
export interface PostWorkflowRequest {
  name: string;
}

export interface PostWorkflowResponse {
  greet: string;
}

/**
 * Helpers
 */

export function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value) {
    if (defaultValue != null) {
      return defaultValue;
    }
    throw new Error(`missing env var: ${key}`);
  }
  return value;
}