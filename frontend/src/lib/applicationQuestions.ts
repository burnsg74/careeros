import { fetchJson, HttpError } from './http'

export type ApplicationQuestion = {
  id: string
  title: string
}

async function readError(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as { error?: unknown }
    if (typeof body.error === 'string' && body.error.trim()) {
      return body.error
    }
  } catch {
    // ignore invalid JSON
  }
  return fallback
}

export async function fetchApplicationQuestions(): Promise<ApplicationQuestion[]> {
  return fetchJson<ApplicationQuestion[]>('/api/application-questions')
}

export async function createApplicationQuestion(title: string): Promise<ApplicationQuestion> {
  const response = await fetch('/api/application-questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  })
  if (!response.ok) {
    throw new HttpError(await readError(response, 'Could not add question'), response.status)
  }
  return (await response.json()) as ApplicationQuestion
}

export async function generateApplicationAnswer(jobId: string, questionId: string): Promise<string> {
  const response = await fetch(`/api/jobs/${encodeURIComponent(jobId)}/application-answers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ questionId }),
  })
  if (!response.ok) {
    throw new HttpError(await readError(response, 'Could not generate answer'), response.status)
  }
  const body = (await response.json()) as { answer?: unknown }
  if (typeof body.answer !== 'string') {
    throw new HttpError('Could not generate answer', 500)
  }
  return body.answer
}
