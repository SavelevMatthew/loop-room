import KV from 'ioredis'
import type { Redis as KVClient } from 'ioredis'

const _KV_CLIENTS = new Map<string, KVClient>()

export function getKVClient(name = 'default'): KVClient {
    const existingClient = _KV_CLIENTS.get(name)
    if (existingClient) {
        return existingClient
    }

    if (!process.env.KV_URL) {
        throw new Error('KV_URL is not specified')
    }

    const newClient = new KV(process.env.KV_URL)
    _KV_CLIENTS.set(name, newClient)

    return newClient
}

export const kv = getKVClient()
