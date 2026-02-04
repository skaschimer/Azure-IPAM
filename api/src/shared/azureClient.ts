import { DefaultAzureCredential, ClientSecretCredential } from '@azure/identity'
import { ResourceGraphClient } from '@azure/arm-resourcegraph'
import { SubscriptionClient } from '@azure/arm-subscriptions'

// Get Azure credential - uses environment variables or managed identity
export function getCredential() {
  const tenantId = process.env.AZURE_TENANT_ID
  const clientId = process.env.AZURE_CLIENT_ID
  const clientSecret = process.env.AZURE_CLIENT_SECRET

  if (tenantId && clientId && clientSecret) {
    return new ClientSecretCredential(tenantId, clientId, clientSecret)
  }

  // Fall back to DefaultAzureCredential (works with managed identity, az cli, etc.)
  return new DefaultAzureCredential()
}

export function getResourceGraphClient() {
  return new ResourceGraphClient(getCredential())
}

export function getSubscriptionClient() {
  return new SubscriptionClient(getCredential())
}

// Azure Resource Graph query helper
export async function queryResourceGraph(
  query: string,
  subscriptionIds?: string[]
) {
  const client = getResourceGraphClient()
  
  // Get all subscription IDs if not provided
  if (!subscriptionIds || subscriptionIds.length === 0) {
    const subClient = getSubscriptionClient()
    const subs = []
    for await (const sub of subClient.subscriptions.list()) {
      if (sub.subscriptionId) {
        subs.push(sub.subscriptionId)
      }
    }
    subscriptionIds = subs
  }

  const result = await client.resources({
    query,
    subscriptions: subscriptionIds,
  })

  return result.data as Record<string, unknown>[]
}
