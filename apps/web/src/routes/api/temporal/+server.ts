import { error } from '@sveltejs/kit';
import { getConnectionOptions, connectToTemporal } from '@boilerplate/common/temporal';
import { Connection } from '@temporalio/client';
import { json } from '@sveltejs/kit';

export const GET = async ({ request }) => {
  // Create a Temporal Client
  console.log(`Get Temporal Client`);
  try {
    const conn = await Connection.connect(getConnectionOptions());
    const response = await conn.healthService.check({});
    await conn.close();
    return json(response);
  } catch(e) {
    // Unable to connect to Temporal
    throw error(404, 'Temporal is not available');
  }
};