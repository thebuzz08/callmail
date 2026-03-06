import { Client } from "@upstash/qstash"

let qstashClient: Client | null = null

export function getQStashClient(): Client {
  if (!qstashClient) {
    const token = process.env.QSTASH_TOKEN

    if (!token) {
      throw new Error("QSTASH_TOKEN environment variable is not set")
    }
    qstashClient = new Client({ token })
  }
  return qstashClient
}
