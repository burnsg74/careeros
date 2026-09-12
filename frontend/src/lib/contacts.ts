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
