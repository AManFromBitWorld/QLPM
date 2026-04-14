import { duplicateMeeting, normalizeMeeting } from './meeting.js'

const STORAGE_KEY = 'qlmp-meeting-records'

function persistMeetings(meetings) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(meetings))
}

export function getStoredMeetings() {
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

    return meetings
      .map((meeting) => normalizeMeeting(meeting))
      .sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt))
  } catch {
    return []
  }
}

export function saveMeetingRecord(currentMeetings, meetingDraft) {
  const normalizedMeeting = normalizeMeeting({
    ...meetingDraft,
    updatedAt: new Date().toISOString(),
  })

  const existingIndex = currentMeetings.findIndex(
    (meeting) => meeting.id === normalizedMeeting.id,
  )

  const nextMeetings =
    existingIndex >= 0
      ? currentMeetings.map((meeting) =>
          meeting.id === normalizedMeeting.id ? normalizedMeeting : meeting,
        )
      : [normalizedMeeting, ...currentMeetings]

  const orderedMeetings = nextMeetings.sort(
    (left, right) => new Date(right.updatedAt) - new Date(left.updatedAt),
  )

  persistMeetings(orderedMeetings)

  return {
    meetings: orderedMeetings,
    meeting: normalizedMeeting,
  }
}

export function removeMeetingRecord(currentMeetings, meetingId) {
  const nextMeetings = currentMeetings.filter((meeting) => meeting.id !== meetingId)
  persistMeetings(nextMeetings)
  return nextMeetings
}

export function duplicateMeetingRecord(currentMeetings, meetingId) {
  const sourceMeeting = currentMeetings.find((meeting) => meeting.id === meetingId)
  if (!sourceMeeting) {
    return {
      meetings: currentMeetings,
      meeting: null,
    }
  }

  const copiedMeeting = duplicateMeeting(sourceMeeting)
  const nextMeetings = [copiedMeeting, ...currentMeetings]
  persistMeetings(nextMeetings)

  return {
    meetings: nextMeetings,
    meeting: copiedMeeting,
  }
}
