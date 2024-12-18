import { error } from '@sveltejs/kit';
import { connectToTemporal } from '@boilerplate/common/temporal';
import { json } from '@sveltejs/kit';

export const GET = async ({ request }) => {
  // Create a Temporal Client
  try {
    // Able to connect to Temporal
    const client = await connectToTemporal();
    await client.connection.withDeadline(Date.now() + 100, async () => {
      throw new Error(`Temporal is offlne`);
    });
    await client.connection.close();
    return json({
      'status': 'OK'
    });
  } catch(e) {
    // Unable to connect to Temporal
    throw error(404, 'Temporal is not available');
  }
};