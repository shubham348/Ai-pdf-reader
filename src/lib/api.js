const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000' : '/.netlify/functions')

export function getAskUrl() {
  return `${API_BASE_URL}/ask`
}
