/**
 * HTTP client for SubLeech FastAPI. Uses Vite ``VITE_API_BASE_URL`` or same-origin ``/api`` proxy.
 */

import axios, { type AxiosError } from 'axios'

import type { IngestSuccessResponse } from '@/types/ingest'

const baseURL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? ''

export const api = axios.create({
  baseURL: baseURL || undefined,
  timeout: 120_000,
})

function detailMessage(err: AxiosError<{ detail?: string | { msg: string }[] }>): string {
  const d = err.response?.data?.detail
  if (typeof d === 'string') {
    return d
  }
  if (Array.isArray(d) && d[0]?.msg) {
    return d.map((x) => x.msg).join(' ')
  }
  if (err.message) {
    return err.message
  }
  return 'Request failed'
}

/** Map server / network errors to actionable copy for the upload UI. */
export function friendlyUploadError(err: unknown): string {
  if (!axios.isAxiosError(err)) {
    return 'Something went wrong. Please try again.'
  }
  const raw = detailMessage(err)
  const lower = raw.toLowerCase()
  if (lower.includes('invalid file type')) {
    return 'Please upload a .csv file (comma-separated values).'
  }
  if (lower.includes('too large') || lower.includes('file too large')) {
    return 'That file is too large. Try exporting a shorter date range (max 10 MB).'
  }
  if (lower.includes('empty') || lower.includes('unable to parse')) {
    return 'We could not read that CSV. Check encoding (UTF-8) and that the file has rows below the header.'
  }
  if (lower.includes('missing') || lower.includes('column')) {
    return raw
  }
  if (!err.response) {
    return 'Cannot reach the server. Check that the API is running (e.g. npm run dev with backend on port 8000).'
  }
  return raw
}

/** Upload bank CSV to ingest endpoint; throws AxiosError with server ``detail``. */
export async function uploadBankCsv(file: File): Promise<IngestSuccessResponse> {
  const body = new FormData()
  body.append('file', file)
  const { data } = await api.post<IngestSuccessResponse>('/api/v1/ingest/upload', body, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}
