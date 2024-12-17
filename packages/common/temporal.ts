import { Connection, Client } from '@temporalio/client';
import { getEnv } from './index';

export const namespace = getEnv('TEMPORAL_NAMESPACE', 'default');
export const taskQueue = getEnv('TEMPORAL_TASK_QUEUE', 'turbo-repo');
export const env = getEnv('NODE_ENV', 'development');

interface ConnectionOptions {
  address: string
  tls?: { clientCertPair: { crt: Buffer; key: Buffer } }
}

export function getConnectionOptions(): ConnectionOptions {
  const { TEMPORAL_SERVER = 'localhost:7233', NODE_ENV = 'development' } = process.env;
  const isDeployed = ['production', 'staging'].includes(NODE_ENV);

  if (isDeployed) {
    const { TEMPORAL_CLOUD_CERT, TEMPORAL_CLOUD_KEY } = process.env;

    if (TEMPORAL_CLOUD_CERT && TEMPORAL_CLOUD_KEY) {
      return {
        address: TEMPORAL_SERVER,
        tls: {
          clientCertPair: {
            crt: Buffer.from(TEMPORAL_CLOUD_CERT),
            key: Buffer.from(TEMPORAL_CLOUD_KEY),
          },
        },
      }
    }
  }

  return {
    address: TEMPORAL_SERVER,
  }
};

export async function connectToTemporal() {
  return new Client({
    connection: await Connection.connect(getConnectionOptions()).catch((err) => {
      console.error('Error connecting to Temporal Server: ', err)
      return undefined
    }),
    namespace,
  });
};