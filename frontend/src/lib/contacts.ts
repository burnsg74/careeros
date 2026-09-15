import { fetchJson } from './http'

export type ContactSummary = {
  id: string
  name: string
  url: string
}

export type ContactDetail = ContactSummary & {
  properties: Record<string, string>
  body: string
  obsidianUrl: string
}

export function contactToSummary(contact: ContactDetail): ContactSummary {
  return {
    id: contact.id,
    name: contact.name,
    url: contact.url,
  }
}

export async function fetchContacts(): Promise<ContactSummary[]> {
  return fetchJson<ContactSummary[]>('/api/contacts')
}

export async function fetchContact(id: string): Promise<ContactDetail> {
  return fetchJson<ContactDetail>(`/api/contacts/${encodeURIComponent(id)}`)
}
