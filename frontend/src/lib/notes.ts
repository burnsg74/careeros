export async function saveNoteBody<T>(url: string, body: string): Promise<T> {
  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body }),
  })
  if (!response.ok) {
    throw new Error('Could not save')
  }
  return (await response.json()) as T
}
