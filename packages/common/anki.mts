import { YankiConnect, type YankiConnectOptions } from 'yanki-connect';

export async function getAnkiClient(options?: Partial<YankiConnectOptions>) {
  return new YankiConnect(options);
}