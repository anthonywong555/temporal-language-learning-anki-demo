import { ActivityRequestGreet } from '@boilerplate/common';

export async function greet(aGreetRequest: ActivityRequestGreet): Promise<string> {
  const { name } = aGreetRequest;
  return `Hello, ${name}!`;
}