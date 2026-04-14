import { getRegionByProvince, REGION_PROVINCES, ROLE_CONFIG } from '../data/config.js'

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function createEmptyParticipant() {
  return {
    id: generateId(),
    hospital: '',
    name: '',
    department: '',
    title: '',
  }
}

export function createRoleEntries(minimum) {
  return Array.from({ length: minimum }, () => createEmptyParticipant())
}

export function createMeetingDraft() {
  const attendees = ROLE_CONFIG.reduce((collection, role) => {
    collection[role.key] = createRoleEntries(role.minimum)
    return collection
  }, {})

  return {
    id: generateId(),
    region: '',
    provinces: [],
    project: '焦点对话',
    title: '',
    date: '',
    time: '',
    note: '',
    status: '草稿',
    attendees,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export function cloneMeeting(meeting) {
  return JSON.parse(JSON.stringify(meeting))
}

export function normalizeMeeting(meeting) {
  const fallback = createMeetingDraft()
  const source = meeting ? cloneMeeting(meeting) : fallback
  const sourceProvinces = Array.isArray(source.provinces)
    ? source.provinces
    : source.province
      ? [source.province]
      : []
  const provinces = sourceProvinces.filter(Boolean)
  const derivedRegion = provinces.length > 0 ? getRegionByProvince(provinces[0]) : ''
  const region = source.region || derivedRegion || fallback.region

  const attendees = ROLE_CONFIG.reduce((collection, role) => {
    const incoming = Array.isArray(source.attendees?.[role.key])
      ? source.attendees[role.key].map((person) => ({
          id: person.id || generateId(),
          hospital: person.hospital || '',
          name: person.name || '',
          department: person.department || '',
          title: person.title || '',
        }))
      : []

    while (incoming.length < role.minimum) {
      incoming.push(createEmptyParticipant())
    }

    collection[role.key] = incoming
    return collection
  }, {})

  return {
    id: source.id || generateId(),
    region,
    provinces,
    project: source.project || fallback.project,
    title: source.title || '',
    date: source.date || '',
    time: source.time || '',
    note: source.note || '',
    status: source.status || '草稿',
    attendees,
    createdAt: source.createdAt || new Date().toISOString(),
    updatedAt: source.updatedAt || new Date().toISOString(),
  }
}

export function flattenParticipants(meeting) {
  return ROLE_CONFIG.flatMap((role) =>
    (meeting.attendees?.[role.key] || []).map((person, index) => ({
      roleKey: role.key,
      roleLabel: role.label,
      order: index + 1,
      hospital: person.hospital || '',
      name: person.name || '',
      department: person.department || '',
      title: person.title || '',
    })),
  )
}

export function getFilledParticipantCount(meeting) {
  return flattenParticipants(meeting).filter(
    (person) =>
      person.hospital || person.name || person.department || person.title,
  ).length
}

export function getRoleParticipantCount(participants) {
  return participants.filter(
    (person) => person.hospital || person.name || person.department || person.title,
  ).length
}

export function duplicateMeeting(meeting) {
  const cloned = normalizeMeeting(meeting)
  cloned.id = generateId()
  cloned.title = cloned.title ? `${cloned.title}（复制）` : '未命名会议（复制）'
  cloned.status = '草稿'
  cloned.createdAt = new Date().toISOString()
  cloned.updatedAt = new Date().toISOString()
  cloned.attendees = ROLE_CONFIG.reduce((collection, role) => {
    collection[role.key] = cloned.attendees[role.key].map((person) => ({
      ...person,
      id: generateId(),
    }))
    return collection
  }, {})
  return cloned
}

export function formatMeetingDateTime(meeting) {
  const datePart = meeting.date || '待定日期'
  const timePart = meeting.time || '待定时间'
  return `${datePart} ${timePart}`
}

export function formatMeetingProvinces(meeting) {
  const provinces = meeting.provinces || []
  return provinces.length > 0 ? provinces.join('、') : '待选择省份'
}
