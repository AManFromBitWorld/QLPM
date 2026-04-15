import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

const TABLE = 'qlmp_meetings'
const clientA = createClient(url, key, { auth: { persistSession: false } })
const clientB = createClient(url, key, { auth: { persistSession: false } })

const id = `collab-test-${Date.now()}`
const baseMeeting = {
  id,
  title: '协作联调测试',
  project: '焦点对话',
  status: '草稿',
  meeting_date: null,
  regions: ['东区'],
  provinces: ['上海'],
  updated_at: new Date().toISOString(),
  payload: {
    id,
    title: '协作联调测试',
    project: '焦点对话',
    status: '草稿',
    regions: ['东区'],
    provinces: ['上海'],
    date: '',
    time: '',
    note: '',
    attendees: {
      chair: [{ id: 'chair-1', hospital: '', name: '', department: '', title: '' }],
      host: [
        { id: 'host-1', hospital: '', name: '', department: '', title: '' },
        { id: 'host-2', hospital: '', name: '', department: '', title: '' },
      ],
      speaker: [
        { id: 'speaker-1', hospital: '', name: '', department: '', title: '' },
        { id: 'speaker-2', hospital: '', name: '', department: '', title: '' },
        { id: 'speaker-3', hospital: '', name: '', department: '', title: '' },
      ],
      panelist: Array.from({ length: 6 }, (_, index) => ({
        id: `panelist-${index + 1}`,
        hospital: '',
        name: '',
        department: '',
        title: '',
      })),
    },
    roleMeta: {
      chair: { updatedBy: '', updatedAt: '' },
      host: { updatedBy: '', updatedAt: '' },
      speaker: { updatedBy: '', updatedAt: '' },
      panelist: { updatedBy: '', updatedAt: '' },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
}

let sawRealtime = false

const channel = clientA
  .channel(`qlmp-collab-test-${id}`)
  .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, (payload) => {
    if (payload.new?.id === id || payload.old?.id === id) {
      sawRealtime = true
      console.log('Realtime event received:', payload.eventType)
    }
  })
  .subscribe((status) => {
    console.log('Realtime status:', status)
  })

async function run() {
  const initialSelect = await clientA.from(TABLE).select('id').limit(1)
  console.log('Initial select status:', initialSelect.status, initialSelect.error?.message || 'ok')

  if (initialSelect.error) {
    throw initialSelect.error
  }

  const insertResult = await clientB.from(TABLE).upsert(baseMeeting)
  if (insertResult.error) {
    throw insertResult.error
  }
  console.log('Insert ok')

  await new Promise((resolve) => setTimeout(resolve, 2500))

  const updateResult = await clientB
    .from(TABLE)
    .update({
      updated_at: new Date().toISOString(),
      payload: {
        ...baseMeeting.payload,
        attendees: {
          ...baseMeeting.payload.attendees,
          chair: [
            {
              ...baseMeeting.payload.attendees.chair[0],
              hospital: '复旦大学附属中山医院',
              name: '联调测试',
            },
          ],
        },
      },
    })
    .eq('id', id)

  if (updateResult.error) {
    throw updateResult.error
  }
  console.log('Update ok')

  await new Promise((resolve) => setTimeout(resolve, 3000))

  const readBack = await clientA.from(TABLE).select('payload').eq('id', id).single()
  if (readBack.error) {
    throw readBack.error
  }

  console.log('Readback chair:', readBack.data.payload.attendees.chair[0])
  console.log('Realtime observed:', sawRealtime ? 'yes' : 'no')

  await clientB.from(TABLE).delete().eq('id', id)
  await clientA.removeChannel(channel)

  if (!sawRealtime) {
    throw new Error('Write succeeded, but no realtime event was observed.')
  }
}

run()
  .then(() => {
    console.log('Collaboration check passed')
    process.exit(0)
  })
  .catch(async (error) => {
    console.error('Collaboration check failed:', error.message)
    await clientA.removeChannel(channel)
    process.exit(1)
  })
