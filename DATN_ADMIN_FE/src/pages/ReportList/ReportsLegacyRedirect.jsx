import { Navigate, useSearchParams } from 'react-router-dom'

/** Chuyển /reports?content=events… sang /reports/events và /reports sang /reports/posts */
export default function ReportsLegacyRedirect() {
  const [sp] = useSearchParams()
  const content = sp.get('content')
  const tab = sp.get('tab')
  const isChallenges = content === 'challenges' || tab === 'challenges'
  const isEvents = content === 'events' || tab === 'events'
  const base = isChallenges ? '/reports/challenges' : isEvents ? '/reports/events' : '/reports/posts'
  const suffix = tab === 'deleted' ? '?tab=deleted' : ''
  return <Navigate to={`${base}${suffix}`} replace />
}
