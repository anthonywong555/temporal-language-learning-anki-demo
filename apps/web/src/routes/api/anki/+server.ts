import { error } from '@sveltejs/kit';
import { getAnkiClient } from '@boilerplate/common/anki.mjs';
import { json } from '@sveltejs/kit';

export const GET = async ({ request }) => {
  // Create a Anki Client
  try {
    const client = await getAnkiClient();
    await client.miscellaneous.version();
    return json({
      'status': 'OK'
    });
  } catch(e) {
    // Unable to connect to Anki
    throw error(404,`Anki is not available.`)
  }
};