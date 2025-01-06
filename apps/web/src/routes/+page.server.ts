import { env } from '$env/dynamic/private';

export async function load({params, fetch}) {
  const languagesRequest = await fetch(`/languages.json`);
  const languages = await languagesRequest.json();
  return {
    languages,
    toLanguage: env.TO_LANGUAGE ? env.TO_LANGUAGE : 'English',
    fromLanguage: env.FROM_LANGUAGE ? env.FROM_LANGUAGE : '',
  }
}