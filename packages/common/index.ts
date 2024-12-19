/**
 * Workflows
 */
export interface WorkflowRequestExample {
  name: string;
}

export interface WorkflowRequestTranslation {
  query: string; // User's Query
  toLanguage: string;
  fromLanguage: string;
}

export interface WorkflowResponseTranslation extends TranslationServiceResponse {

}

export interface TranslationServiceResponse {
  service: string; // name of the service that used to translate
  model?: string; // name of the ai model you used.
  possibleTranslations: Array<string>;
  errorMessage?: string;
}

// Define the structure of a resolved or rejected result
export interface PromiseResult {
  status: 'resolved' | 'rejected';
  value?: TranslationServiceResponse; // For resolved promises
  error?: string; // For rejected promises
  index: number;  // The index of the promise in the original array
};  

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

export interface PostRequestTranslation extends WorkflowRequestTranslation {
  workflowId: string;
}

export interface PostResponseTranslation {
  workflowId: string;
}

export interface TranslationHistory {
  request: PostRequestTranslation;
  response: TranslationResponse;
  isSave?: boolean;
}

export interface TranslationResponse {
  status: string;
  results: TranslationServiceResponse[];
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