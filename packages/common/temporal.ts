import { Connection, Client } from '@temporalio/client';
import { getEnv } from './index';
import fs from "fs/promises";

export const namespace = getEnv('TEMPORAL_NAMESPACE', 'default');
export const taskQueue = getEnv('TEMPORAL_TASK_QUEUE', 'turbo-repo');
export const env = getEnv('NODE_ENV', 'development');

interface ConnectionOptions {
  address: string
  tls?: { clientCertPair: { crt: Buffer; key: Buffer } }
}

export async function getConnectionOptions(): Promise<ConnectionOptions> {
  const address = getEnv("TEMPORAL_ADDRESS", "localhost:7233");

  let tls: ConnectionOptions["tls"] = undefined;
  if (process.env.TEMPORAL_CLIENT_CERT_PATH) {
    const crt = await fs.readFile(getEnv("TEMPORAL_CLIENT_CERT_PATH"));
    const key = await fs.readFile(getEnv("TEMPORAL_CLIENT_KEY_PATH"));

    tls = { clientCertPair: { crt, key } };
    console.info('🤖: Connecting to Temporal Cloud ⛅');
  } else {
    console.info('🤖: Connecting to Local Temporal'); 
  }

  return {
    address,
    tls,
  };
}

export async function connectToTemporal() {
  return new Client({
    connection: await Connection.connect(await getConnectionOptions()).catch((err) => {
      console.error('Error connecting to Temporal Server: ', err)
      return undefined
    }),
    namespace,
  });
};