export function safeArray(value) {
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : value.split(/[,;\n]/).map((item) => item.trim()).filter(Boolean)
    } catch {
      return value.split(/[,;\n]/).map((item) => item.trim()).filter(Boolean)
    }
  }
  return []
}

export function safeObject(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return parsed && typeof parsed === 'object' ? parsed : {}
    } catch { return {} }
  }
  return {}
}

export function getScore(ad) {
  const value = Number(ad?.creative_quality_score)
  return Number.isFinite(value) ? value : 0
}

export function getScorePercent(ad) {
  const maximum = Number(ad?.maximum_score) || 60
  return Math.round((getScore(ad) / maximum) * 100)
}

export function getCategoryScores(ad) {
  const scores = safeObject(ad?.scores)
  const get = (...keys) => {
    for (const key of keys) {
      const value = Number(scores[key])
      if (Number.isFinite(value) && value > 0) return value
    }
    return 0
  }
  return [
    { category: 'Hook', value: get('hook', 'Hook') },
    { category: 'Value prop.', value: get('value_proposition', 'value proposition', 'Value proposition') },
    { category: 'Message clarity', value: get('message_clarity', 'Message clarity') },
    { category: 'CTA', value: get('cta', 'CTA') },
    { category: 'Audience', value: get('audience_relevance', 'Audience relevance') },
    { category: 'Execution', value: get('creative_execution', 'Creative execution') },
  ]
}

export function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

export function classNames(...values) {
  return values.filter(Boolean).join(' ')
}
