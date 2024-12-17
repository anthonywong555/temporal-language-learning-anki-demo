import { NativeConnection, Runtime, Worker, type RuntimeOptions, type WorkerOptions } from '@temporalio/worker';
import * as activities from '@boilerplate/activities';
import { getEnv } from '@boilerplate/common';
import http from 'http';
//import { namespace, getConnectionOptions, taskQueue, env } from '@boilerplate/common/temporal';
import { namespace, getConnectionOptions, taskQueue, env } from '@boilerplate/common/.lib/temporal';

export function getWorkflowOptions(): Pick<WorkerOptions, "workflowBundle" | "workflowsPath"> {
  const workflowBundlePath = getEnv('WORKFLOW_BUNDLE_PATH', '');
  
  if (workflowBundlePath && env == 'production') {
    return { workflowBundle: { codePath: workflowBundlePath } };
  } else {
    return { workflowsPath: require.resolve("../../../packages/workflows/") };
  }
}

export function getTelemetryOptions(): RuntimeOptions {
  const metrics = getEnv("TEMPORAL_WORKER_METRIC", "");

  let telemetryOptions = {};

  switch(metrics) {
    case 'PROMETHEUS':
      const bindAddress = getEnv('TEMPORAL_METRICS_PROMETHEUS_ADDRESS', '0.0.0.0:9464');
      telemetryOptions = {
        metrics: {
          prometheus: {
            bindAddress,
          }
        }
      }
      console.info('🤖: Prometheus Metrics 🔥', bindAddress);
      break;
    case 'OTEL':
      telemetryOptions = {
        metrics : {
          otel: {
            url: getEnv('TEMPORAL_METRICS_OTEL_URL'),
            headers: {
              'api-key': getEnv('TEMPORAL_METRICS_OTEL_API_KEY')
            }
          }
        }
      }
      console.info('🤖: OTEL Metrics 📈');
      break;
    default:
      console.info('🤖: No Metrics');
      break;
  }
  
  return { telemetryOptions };
}

async function withOptionalStatusServer(worker: Worker, port: number | undefined, fn: () => Promise<any>): Promise<void> {
  if (port == null) {
    await fn();
    return;
  }

  const server = await new Promise<http.Server>((resolve, reject) => {
    const server = http.createServer((req, res) => {
      if (req.method !== 'GET') {
        res.writeHead(405, 'Method not allowed');
        res.end();
        return;
      }

      if (req.url !== '/') {
        res.writeHead(404, 'Not found');
        res.end();
        return;
      }
      
      res.setHeader('Content-Type', 'application/json');
      res.write(JSON.stringify(worker.getStatus()));
      res.end();

      console.info(`Health Check ✅`);
    });
    server.listen(port, () => resolve(server));
    server.once('error', reject);
  });
  console.log('Status server listening on', server?.address());
  try {
    await fn();
  } finally {
    server.close();
  }
}

async function run() {
  const telemetryOptions = getTelemetryOptions();

  if(telemetryOptions) {
    Runtime.install(telemetryOptions);
  }

  const connection = await NativeConnection.connect(getConnectionOptions());

  try {
    const worker = await Worker.create({
      activities,
      connection,
      namespace,
      taskQueue,
      ...getWorkflowOptions()
    });

    const statusPort = getEnv('TEMPORAL_WORKER_STATUS_HTTP_PORT', '');

    if(statusPort) {
      await withOptionalStatusServer(worker, parseInt(statusPort), async () => {
        try {
          console.info('🤖: Temporal Worker Online! Beep Boop Beep!');
          await worker.run();
        } finally {
          await connection.close();
        }
      });
    } else {
      console.info('🤖: Temporal Worker Online! Beep Boop Beep!');
      await worker.run();
      await connection.close();
    }
  } catch(e) {
    console.error('🤖: ERROR!', e);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
})