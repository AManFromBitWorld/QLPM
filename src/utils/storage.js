import { getSupabaseClient, isCloudSyncEnabled } from './collaboration.js'
import { duplicateMeeting, normalizeMeeting } from './meeting.js'

const STORAGE_KEY = 'qlmp-meeting-records'
const TABLE_NAME = 'qlmp_meetings'

function sortMeetings(meetings) {
  return meetings.sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt))
}

function persistMeetings(meetings) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(meetings))
}

function parseLocalMeetings() {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY)
    if (!rawValue) {
      return []
    }

    const meetings = JSON.parse(rawValue)
    if (!Array.isArray(meetings)) {
      return []
    }

    return sortMeetings(meetings.map((meeting) => normalizeMeeting(meeting)))
  } catch {
    return []
  }
}

function toDatabaseRow(meeting) {
  const normalizedMeeting = normalizeMeeting(meeting)

  return {
    id: normalizedMeeting.id,
    title: normalizedMeeting.title || '',
    project: normalizedMeeting.project || '',
    status: normalizedMeeting.status || '草稿',
    meeting_date: normalizedMeeting.date || null,
    regions: normalizedMeeting.regions || [],
    provinces: normalizedMeeting.provinces || [],
    updated_at: normalizedMeeting.updatedAt,
    payload: normalizedMeeting,
  }
}

function fromDatabaseRows(rows) {
  return sortMeetings(rows.map((row) => normalizeMeeting(row.payload)))
}

export function getSyncMode() {
  return isCloudSyncEnabled() ? 'cloud' : 'local'
}

export async function listMeetingRecords() {
  if (!isCloudSyncEnabled()) {
    return parseLocalMeetings()
  }

  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('payload')
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Failed to load cloud meetings, fallback to local cache.', error)
    return parseLocalMeetings()
  }

  const meetings = fromDatabaseRows(data || [])
  persistMeetings(meetings)
  return meetings
}

export function subscribeToMeetingRecords(onMeetings) {
  if (!isCloudSyncEnabled()) {
    const handleStorage = () => {
      onMeetings(parseLocalMeetings())
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }

  const supabase = getSupabaseClient()
  const channel = supabase
    .channel('qlmp-meetings')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: TABLE_NAME },
      async () => {
        const meetings = await listMeetingRecords()
        onMeetings(meetings)
      },
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

export async function saveMeetingRecord(currentMeetings, meetingDraft) {
  const normalizedMeeting = normalizeMeeting({
    ...meetingDraft,
    updatedAt: new Date().toISOString(),
  })

  if (!isCloudSyncEnabled()) {
    const existingIndex = currentMeetings.findIndex(
      (meeting) => meeting.id === normalizedMeeting.id,
    )

    const nextMeetings =
      existingIndex >= 0
        ? currentMeetings.map((meeting) =>
            meeting.id === normalizedMeeting.id ? normalizedMeeting : meeting,
          )
        : [normalizedMeeting, ...currentMeetings]

    const orderedMeetings = sortMeetings(nextMeetings)
    persistMeetings(orderedMeetings)

    return {
      meetings: orderedMeetings,
      meeting: normalizedMeeting,
    }
  }

  const supabase = getSupabaseClient()
  const { error } = await supabase.from(TABLE_NAME).upsert(toDatabaseRow(normalizedMeeting))

  if (error) {
    throw error
  }

  const meetings = await listMeetingRecords()
  return {
    meetings,
    meeting: normalizedMeeting,
  }
}

export async function removeMeetingRecord(currentMeetings, meetingId) {
  if (!isCloudSyncEnabled()) {
    const nextMeetings = currentMeetings.filter((meeting) => meeting.id !== meetingId)
    persistMeetings(nextMeetings)
    return nextMeetings
  }

  const supabase = getSupabaseClient()
  const { error } = await supabase.from(TABLE_NAME).delete().eq('id', meetingId)

  if (error) {
    throw error
  }

  return listMeetingRecords()
}

export async function duplicateMeetingRecord(currentMeetings, meetingId) {
  const sourceMeeting = currentMeetings.find((meeting) => meeting.id === meetingId)
  if (!sourceMeeting) {
    return {
      meetings: currentMeetings,
      meeting: null,
    }
  }

  const copiedMeeting = duplicateMeeting(sourceMeeting)
  const result = await saveMeetingRecord(currentMeetings, copiedMeeting)

  return {
    meetings: result.meetings,
    meeting: result.meeting,
  }
}
