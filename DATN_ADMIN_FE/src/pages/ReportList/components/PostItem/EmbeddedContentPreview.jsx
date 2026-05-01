import { useQuery } from '@tanstack/react-query'
import moment from 'moment'
import {
  FaRunning, FaRoad, FaClock, FaFire, FaBolt, FaTrophy, FaRoute,
  FaUtensils, FaDumbbell, FaCalendarAlt, FaMapMarkerAlt, FaUsers,
  FaCheckCircle, FaTimesCircle, FaLeaf
} from 'react-icons/fa'
import { MdVideocam } from 'react-icons/md'
import { getSportEvent, getActivity, getChallenge, getChallengeActivity, getChallengeProgressEntry } from '../../../../apis/embeddedContentApi'
import { getImageUrl } from '../../../../utils/imageUrl'

function roundKcal(v) { return Math.round(v * 10) / 10 }
function fmtDur(sec) {
  if (!sec) return '0:00'
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = Math.floor(sec % 60)
  return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${m}:${String(s).padStart(2,'0')}`
}
function fmtMin(min) {
  if (!min) return '0 phút'
  const h = Math.floor(min / 60), m = min % 60
  return h > 0 ? `${h}g ${m}p` : `${m} phút`
}

const CHALLENGE_CFG = {
  nutrition: { label: 'Ăn uống', icon: <FaUtensils />, gradient: 'from-emerald-500 to-teal-600', border: 'border-emerald-200 dark:border-emerald-800' },
  outdoor_activity: { label: 'Ngoài trời', icon: <FaRunning />, gradient: 'from-blue-500 to-cyan-600', border: 'border-blue-200 dark:border-blue-800' },
  fitness: { label: 'Thể dục', icon: <FaDumbbell />, gradient: 'from-orange-500 to-amber-600', border: 'border-orange-200 dark:border-orange-800' }
}

function Skeleton() {
  return (
    <div className='p-4 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 animate-pulse'>
      <div className='h-6 bg-gray-200 dark:bg-gray-700 rounded mb-3 w-2/3' />
      <div className='grid grid-cols-2 gap-2'>
        {[1,2].map(i => <div key={i} className='h-10 bg-gray-200 dark:bg-gray-700 rounded-lg' />)}
      </div>
    </div>
  )
}

function ErrorCard({ label }) {
  return (
    <div className='rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'>
      <div className='bg-gray-400 px-4 py-2 opacity-60'>
        <span className='text-white text-xs font-semibold uppercase'>{label}</span>
      </div>
      <div className='px-4 py-4 flex items-center gap-3'>
        <FaTimesCircle className='text-gray-300 dark:text-gray-600' size={24} />
        <p className='text-sm text-gray-500 dark:text-gray-400'>Nội dung này đã bị xóa hoặc không còn tồn tại</p>
      </div>
    </div>
  )
}

function StatBox({ icon, label, value }) {
  return (
    <div className='flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2 border border-gray-100 dark:border-gray-600/50'>
      <div className='text-base shrink-0'>{icon}</div>
      <div className='min-w-0'>
        <div className='text-[10px] text-gray-500 dark:text-gray-400 uppercase font-medium'>{label}</div>
        <div className='text-sm font-bold text-gray-800 dark:text-gray-100 truncate'>{value}</div>
      </div>
    </div>
  )
}

// ── Sport Event Preview ──
function SportEventCard({ eventId }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-embed-event', eventId],
    queryFn: () => getSportEvent(eventId),
    enabled: !!eventId, staleTime: 5 * 60_000, retry: false
  })
  if (isLoading) return <Skeleton />
  if (isError) return <ErrorCard label='Sự kiện thể thao' />
  const ev = data?.data?.result || data?.result
  if (!ev) return <ErrorCard label='Sự kiện thể thao' />
  const isOnline = ev.eventType === 'Trong nhà'
  return (
    <div className='rounded-xl overflow-hidden border border-red-200 dark:border-red-800 bg-white dark:bg-gray-800'>
      {ev.image && (
        <div className='relative h-36 overflow-hidden'>
          <img src={getImageUrl(ev.image)} alt='' className='w-full h-full object-cover' onError={e => e.target.parentElement.style.display='none'} />
          <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent' />
          <div className='absolute top-2 left-2 flex gap-1.5'>
            <span className={`text-white text-[10px] px-2 py-0.5 rounded-full font-semibold ${isOnline ? 'bg-blue-600' : 'bg-green-600'}`}>
              {isOnline ? '🏠 Trong nhà' : '🌿 Ngoài trời'}
            </span>
            {ev.category && <span className='text-white text-[10px] px-2 py-0.5 rounded-full bg-red-500/80'>{ev.category}</span>}
          </div>
          <div className='absolute bottom-2 left-3 right-3'>
            <h4 className='text-white font-bold text-sm drop-shadow line-clamp-1'>{ev.name}</h4>
          </div>
        </div>
      )}
      <div className='p-3 space-y-2'>
        {!ev.image && <h4 className='font-bold text-sm text-gray-900 dark:text-white'>{ev.name}</h4>}
        <div className='flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400'>
          <span className='flex items-center gap-1'><FaCalendarAlt size={10} className='text-red-400' />{moment(ev.startDate).format('DD/MM/YYYY')} – {moment(ev.endDate).format('DD/MM/YYYY')}</span>
          <span className='flex items-center gap-1'>
            {isOnline ? <MdVideocam size={11} className='text-blue-400' /> : <FaMapMarkerAlt size={10} className='text-green-400' />}
            {ev.location || '—'}
          </span>
          <span className='flex items-center gap-1'><FaUsers size={10} className='text-indigo-400' />{ev.participants || 0} người</span>
        </div>
      </div>
    </div>
  )
}

// ── Event Activity Preview (GPS) ──
function EventActivityCard({ activityId, eventId }) {
  const { data: evData } = useQuery({ queryKey: ['admin-embed-event', eventId], queryFn: () => getSportEvent(eventId), enabled: !!eventId, staleTime: 5*60_000, retry: false })
  const { data: actData, isLoading, isError } = useQuery({ queryKey: ['admin-embed-act', eventId, activityId], queryFn: () => getActivity(eventId, activityId), enabled: !!activityId && !!eventId, staleTime: 60_000, retry: false })
  if (isLoading) return <Skeleton />
  if (isError) return <ErrorCard label='Hoạt động sự kiện' />
  const act = actData?.data?.result
  if (!act) return <ErrorCard label='Hoạt động sự kiện' />
  const ev = evData?.data?.result || evData?.result
  const km = (act.totalDistance / 1000).toFixed(2)
  const stats = [
    { icon: <FaRoad className='text-blue-500' />, label: 'Quãng đường', value: `${km} km` },
    { icon: <FaClock className='text-purple-500' />, label: 'Thời gian', value: fmtDur(act.totalDuration) }
  ]
  if (act.calories) stats.push({ icon: <FaFire className='text-orange-500' />, label: 'Calo', value: `${roundKcal(act.calories)} kcal` })
  if (act.totalDistance && act.totalDuration) {
    stats.push({ icon: <FaBolt className='text-yellow-500' />, label: 'Tốc độ TB', value: `${((act.totalDistance/1000)/(act.totalDuration/3600)).toFixed(2)} km/h` })
  }
  return (
    <div className='rounded-xl overflow-hidden border border-red-200 dark:border-red-800 bg-white dark:bg-gray-800'>
      <div className='bg-gradient-to-r from-red-500 to-orange-500 px-4 py-2 flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <FaRunning className='text-white' size={13} />
          <span className='text-white text-xs font-semibold uppercase'>{ev?.category || act.activityType || 'Hoạt động'}</span>
        </div>
        <span className='text-white/80 text-xs'>{moment(act.startTime).format('HH:mm - DD/MM/YYYY')}</span>
      </div>
      <div className='grid grid-cols-2 gap-2 p-3'>
        {stats.map((s, i) => <StatBox key={i} {...s} />)}
      </div>
      {act.gpsRoute?.length > 1 && (
        <div className='mx-3 mb-2 flex items-center gap-1.5'>
          <FaRoute className='text-red-500' size={10} />
          <span className='text-[10px] font-semibold text-gray-500 uppercase'>Lộ trình GPS ({act.gpsRoute.length} điểm)</span>
        </div>
      )}
      {ev && (
        <div className='mx-3 mb-3 bg-red-50 dark:bg-red-900/10 rounded-lg px-3 py-2 border border-red-200 dark:border-red-900/30'>
          <div className='flex items-center gap-2'>
            <FaTrophy className='text-yellow-500 shrink-0' size={11} />
            <span className='text-xs font-semibold text-gray-700 dark:text-gray-300 truncate'>{ev.name}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Challenge Preview ──
function ChallengeCard({ challengeId }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-embed-challenge', challengeId],
    queryFn: () => getChallenge(challengeId),
    enabled: !!challengeId, staleTime: 5*60_000, retry: false
  })
  if (isLoading) return <Skeleton />
  if (isError) return <ErrorCard label='Thử thách' />
  const ch = data?.data?.result
  if (!ch) return <ErrorCard label='Thử thách' />
  const cfg = CHALLENGE_CFG[ch.challenge_type] || CHALLENGE_CFG.fitness
  const start = moment(ch.start_date), end = moment(ch.end_date)
  return (
    <div className={`rounded-xl overflow-hidden border ${cfg.border} bg-white dark:bg-gray-800`}>
      {ch.image ? (
        <div className='relative h-36 overflow-hidden'>
          <img src={getImageUrl(ch.image)} alt='' className='w-full h-full object-cover' onError={e => e.target.parentElement.style.display='none'} />
          <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent' />
          <div className='absolute top-2 left-2'>
            <span className={`text-white text-[10px] px-2 py-0.5 rounded-full font-semibold bg-gradient-to-r ${cfg.gradient}`}>
              <span className='inline-flex items-center gap-1'>{cfg.icon} {cfg.label}</span>
            </span>
          </div>
          <div className='absolute bottom-2 left-3 right-3'>
            <h4 className='text-white font-bold text-sm drop-shadow line-clamp-1'>{ch.badge_emoji} {ch.title}</h4>
          </div>
        </div>
      ) : (
        <div className={`h-20 bg-gradient-to-br ${cfg.gradient} flex items-center justify-center`}>
          <span className='text-4xl opacity-25'>{ch.badge_emoji || '🏆'}</span>
        </div>
      )}
      <div className='p-3 space-y-2'>
        {!ch.image && <h4 className='font-bold text-sm text-gray-900 dark:text-white'>{ch.badge_emoji} {ch.title}</h4>}
        <div className='flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400'>
          <span className='flex items-center gap-1'><FaCalendarAlt size={10} className='text-orange-400' />{start.format('DD/MM/YYYY')} – {end.format('DD/MM/YYYY')}</span>
          {ch.goal_value && <span className='flex items-center gap-1'><FaFire size={10} className='text-amber-500' />{ch.goal_value} {ch.goal_unit}/ngày</span>}
          <span className='flex items-center gap-1'><FaUsers size={10} className='text-indigo-400' />{ch.participants_count || 0} người</span>
        </div>
      </div>
    </div>
  )
}

// ── Challenge Activity Preview ──
function ChallengeActivityCard({ activityId, challengeId }) {
  const { data: chData } = useQuery({ queryKey: ['admin-embed-challenge', challengeId], queryFn: () => getChallenge(challengeId), enabled: !!challengeId, staleTime: 5*60_000, retry: false })
  const { data: actData, isLoading, isError } = useQuery({ queryKey: ['admin-embed-ch-act', challengeId, activityId], queryFn: () => getChallengeActivity(challengeId, activityId), enabled: !!activityId && !!challengeId, staleTime: 60_000, retry: false })
  if (isLoading) return <Skeleton />
  if (isError) return <ErrorCard label='Hoạt động thử thách' />
  const act = actData?.data?.result
  if (!act) return <ErrorCard label='Hoạt động thử thách' />
  const ch = chData?.data?.result
  const cType = ch?.challenge_type || act?.challenge_type || 'fitness'
  const cfg = CHALLENGE_CFG[cType] || CHALLENGE_CFG.fitness

  const stats = []
  if (cType === 'outdoor_activity') {
    let km = '0'
    if (act.totalDistance > 0) km = (act.totalDistance / 1000).toFixed(2)
    else if (act.distance > 0) km = (act.distance > 200 ? act.distance / 1000 : act.distance).toFixed(2)
    else if (act.value > 0) km = Number(act.value).toFixed(2)
    stats.push({ icon: <FaRoad className='text-blue-500' />, label: 'Quãng đường', value: `${km} km` })
    if (act.totalDuration) stats.push({ icon: <FaClock className='text-cyan-500' />, label: 'Thời gian', value: fmtMin(Math.round(act.totalDuration / 60)) })
    if (act.calories) stats.push({ icon: <FaFire className='text-orange-500' />, label: 'Calo', value: `${roundKcal(act.calories)} kcal` })
  } else if (cType === 'nutrition') {
    stats.push({ icon: <FaUtensils className='text-emerald-500' />, label: ch?.goal_unit || 'kcal', value: `${act.value || 0} ${act.unit || ch?.goal_unit || 'kcal'}` })
    if (act.calories) stats.push({ icon: <FaFire className='text-orange-500' />, label: 'Calo', value: `${roundKcal(act.calories)} kcal` })
  } else {
    stats.push({ icon: <FaDumbbell className='text-orange-500' />, label: ch?.goal_unit || 'Buổi', value: `${act.value || 0} ${act.unit || ch?.goal_unit || ''}` })
    if (act.duration_minutes) stats.push({ icon: <FaClock className='text-amber-500' />, label: 'Thời gian', value: fmtMin(act.duration_minutes) })
    if (act.calories) stats.push({ icon: <FaFire className='text-red-500' />, label: 'Calo', value: `${roundKcal(act.calories)} kcal` })
  }

  return (
    <div className={`rounded-xl overflow-hidden border ${cfg.border} bg-white dark:bg-gray-800`}>
      <div className={`bg-gradient-to-r ${cfg.gradient} px-4 py-2 flex items-center justify-between`}>
        <div className='flex items-center gap-2'>
          <span className='text-white text-sm'>{cfg.icon}</span>
          <span className='text-white text-xs font-semibold uppercase'>{cfg.label}</span>
          <span className='text-white/60 text-[10px]'>• Hoạt động thử thách</span>
        </div>
        <span className='text-white/80 text-xs'>{moment(act.date || act.startTime || act.createdAt).format('HH:mm - DD/MM/YYYY')}</span>
      </div>
      {cType === 'nutrition' && act.proof_image && (
        <div className='relative'>
          <img src={getImageUrl(act.proof_image)} alt='Ảnh bữa ăn' className='w-full h-36 object-cover' onError={e => e.target.parentElement.style.display='none'} />
          <div className='absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent' />
          {act.ai_review_valid !== null && (
            <div className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg backdrop-blur-md text-[10px] font-bold ${act.ai_review_valid ? 'bg-emerald-500/80 text-white' : 'bg-red-500/80 text-white'}`}>
              {act.ai_review_valid ? <><FaCheckCircle size={8} /> AI Verified</> : <><FaTimesCircle size={8} /> Không hợp lệ</>}
            </div>
          )}
          {act.food_name && <p className='absolute bottom-2 left-3 text-white font-bold text-sm drop-shadow line-clamp-1'>🍽️ {act.food_name}</p>}
        </div>
      )}
      <div className='grid grid-cols-2 gap-2 p-3'>
        {stats.map((s, i) => <StatBox key={i} {...s} />)}
      </div>
      {act.gpsRoute?.length > 1 && (
        <div className='mx-3 mb-2 flex items-center gap-1.5'>
          <FaRoute className='text-cyan-500' size={10} />
          <span className='text-[10px] font-semibold text-gray-500 uppercase'>Lộ trình GPS ({act.gpsRoute.length} điểm)</span>
        </div>
      )}
      {ch && (
        <div className='mx-3 mb-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-600'>
          <div className='flex items-center gap-2'>
            <FaTrophy className='text-amber-500 shrink-0' size={11} />
            <span className='text-xs font-semibold text-gray-700 dark:text-gray-300 truncate'>{ch.title}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Challenge Progress Preview (nutrition/fitness) ──
function ChallengeProgressCard({ progressId, challengeId }) {
  const { data: chData } = useQuery({ queryKey: ['admin-embed-challenge', challengeId], queryFn: () => getChallenge(challengeId), enabled: !!challengeId, staleTime: 5*60_000, retry: false })
  const { data: pData, isLoading, isError } = useQuery({ queryKey: ['admin-embed-ch-prog', challengeId, progressId], queryFn: () => getChallengeProgressEntry(challengeId, progressId), enabled: !!progressId && !!challengeId, staleTime: 60_000, retry: false })
  if (isLoading) return <Skeleton />
  if (isError) return <ErrorCard label='Tiến độ thử thách' />
  const act = pData?.data?.result
  if (!act) return <ErrorCard label='Tiến độ thử thách' />
  const ch = chData?.data?.result
  const cType = ch?.challenge_type || 'fitness'
  const cfg = CHALLENGE_CFG[cType] || CHALLENGE_CFG.fitness

  return (
    <div className={`rounded-xl overflow-hidden border ${cfg.border} bg-white dark:bg-gray-800`}>
      <div className={`bg-gradient-to-r ${cfg.gradient} px-4 py-2 flex items-center justify-between`}>
        <div className='flex items-center gap-2'>
          <span className='text-white text-sm'>{cfg.icon}</span>
          <span className='text-white text-xs font-semibold uppercase'>{cfg.label}</span>
          <span className='text-white/60 text-[10px]'>• Tiến độ thử thách</span>
        </div>
        <span className='text-white/80 text-xs'>{moment(act.date || act.createdAt).format('HH:mm - DD/MM/YYYY')}</span>
      </div>
      {cType === 'nutrition' && act.proof_image && (
        <div className='relative'>
          <img src={getImageUrl(act.proof_image)} alt='' className='w-full h-36 object-cover' onError={e => e.target.parentElement.style.display='none'} />
          {act.food_name && (
            <div className='absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-3 pb-2 pt-6'>
              <p className='text-white font-bold text-sm drop-shadow'>🍽️ {act.food_name}</p>
            </div>
          )}
        </div>
      )}
      <div className='p-3'>
        <div className='flex items-center gap-2 mb-2'>
          <span className='font-bold text-sm text-gray-800 dark:text-gray-100'>{act.value} {act.unit || ch?.goal_unit || ''}</span>
          {ch?.goal_value && <span className='text-xs text-gray-400'>/ {ch.goal_value} {ch.goal_unit} mục tiêu</span>}
        </div>
        {act.notes && <p className='text-xs text-gray-500 italic line-clamp-2'>"{act.notes}"</p>}
      </div>
      {ch && (
        <div className='mx-3 mb-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-600'>
          <div className='flex items-center gap-2'>
            <FaTrophy className='text-amber-500 shrink-0' size={11} />
            <span className='text-xs font-semibold text-gray-700 dark:text-gray-300 truncate'>{ch.title}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Export ──
const TYPE_LABEL = {
  'sport-event': '🏃 Chia sẻ sự kiện thể thao',
  'event-activity': '📍 Chia sẻ hoạt động sự kiện',
  'challenge': '🏆 Chia sẻ thử thách',
  'challenge-activity': '⚡ Chia sẻ hoạt động thử thách',
  'challenge-progress': '📊 Chia sẻ tiến độ thử thách'
}

export default function EmbeddedContentPreview({ markers }) {
  if (!markers || markers.length === 0) return null

  return (
    <div className='rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/30 dark:bg-indigo-950/10 p-4'>
      <h4 className='text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2'>
        📎 Nội dung đính kèm
      </h4>
      <div className='space-y-3'>
        {markers.map((m, idx) => (
          <div key={`${m.type}-${idx}`}>
            <p className='text-[11px] text-gray-500 dark:text-gray-400 mb-1.5 font-medium'>
              {TYPE_LABEL[m.type] || 'Nội dung nhúng'}
            </p>
            {m.type === 'sport-event' && <SportEventCard eventId={m.eventId} />}
            {m.type === 'event-activity' && <EventActivityCard activityId={m.activityId} eventId={m.eventId} />}
            {m.type === 'challenge' && <ChallengeCard challengeId={m.challengeId} />}
            {m.type === 'challenge-activity' && <ChallengeActivityCard activityId={m.activityId} challengeId={m.challengeId} />}
            {m.type === 'challenge-progress' && <ChallengeProgressCard progressId={m.progressId} challengeId={m.challengeId} />}
          </div>
        ))}
      </div>
    </div>
  )
}
