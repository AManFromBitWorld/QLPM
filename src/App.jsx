import { useEffect, useState } from 'react'
import {
  BrowserRouter,
  NavLink,
  Route,
  Routes,
  useParams,
} from 'react-router-dom'
import { CalendarRange } from 'lucide-react'
import './App.css'
import MeetingEditorPage from './pages/MeetingEditorPage.jsx'
import MeetingsPage from './pages/MeetingsPage.jsx'
import MeetingDetailPage from './pages/MeetingDetailPage.jsx'
import {
  duplicateMeetingRecord,
  getSyncMode,
  listMeetingRecords,
  removeMeetingRecord,
  saveMeetingRecord,
  subscribeToMeetingRecords,
} from './utils/storage.js'

function NewMeetingRoute({ meetings, onSaveMeeting }) {
  return <MeetingEditorPage key="new" meetings={meetings} onSaveMeeting={onSaveMeeting} />
}

function EditMeetingRoute({ meetings, onSaveMeeting }) {
  const { meetingId } = useParams()
  return (
    <MeetingEditorPage
      key={meetingId || 'edit'}
      meetings={meetings}
      onSaveMeeting={onSaveMeeting}
    />
  )
}

function AppShell({
  meetings,
  onDeleteMeeting,
  onDuplicateMeeting,
  onSaveMeeting,
  syncMode,
}) {
  const totalMeetings = meetings.length

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar__brand">
          <span className="topbar__eyebrow">精准抗感染专项系列会议</span>
          <div>
            <h1>会议信息录入</h1>
          </div>
        </div>
        <div className="topbar__utility">
          <div className="button-row" style={{ gap: 8 }}>
            <span className="tag">内部记录 {totalMeetings} 场</span>
            <span className="tag">{syncMode === 'cloud' ? '协作云端已启用' : '本地模式'}</span>
          </div>
        </div>
      </header>

      <nav className="main-nav" aria-label="主导航">
        <NavLink to="/" end className="main-nav__link">
          <CalendarRange size={18} />
          填写会议信息
        </NavLink>
      </nav>

      <main className="page-shell">
        <Routes>
          <Route
            path="/"
            element={<NewMeetingRoute meetings={meetings} onSaveMeeting={onSaveMeeting} />}
          />
          <Route
            path="/meetings"
            element={
              <MeetingsPage
                meetings={meetings}
                onDeleteMeeting={onDeleteMeeting}
                onDuplicateMeeting={onDuplicateMeeting}
              />
            }
          />
          <Route
            path="/meetings/new"
            element={<NewMeetingRoute meetings={meetings} onSaveMeeting={onSaveMeeting} />}
          />
          <Route
            path="/meetings/:meetingId/edit"
            element={<EditMeetingRoute meetings={meetings} onSaveMeeting={onSaveMeeting} />}
          />
          <Route
            path="/meetings/:meetingId"
            element={
              <MeetingDetailPage
                meetings={meetings}
                onDeleteMeeting={onDeleteMeeting}
                onDuplicateMeeting={onDuplicateMeeting}
              />
            }
          />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  const [meetings, setMeetings] = useState([])
  const [syncMode] = useState(() => getSyncMode())

  useEffect(() => {
    let active = true

    const load = async () => {
      const loadedMeetings = await listMeetingRecords()
      if (active) {
        setMeetings(loadedMeetings)
      }
    }

    load()

    const unsubscribe = subscribeToMeetingRecords((nextMeetings) => {
      if (active) {
        setMeetings(nextMeetings)
      }
    })

    const pollingTimer =
      syncMode === 'cloud'
        ? window.setInterval(() => {
            void load()
          }, 8000)
        : null

    return () => {
      active = false
      if (pollingTimer) {
        window.clearInterval(pollingTimer)
      }
      unsubscribe?.()
    }
  }, [syncMode])

  const handleSaveMeeting = async (meetingDraft, options = {}) => {
    const { meetings: nextMeetings, meeting, conflict, conflictingRoles, baseConflict } =
      await saveMeetingRecord(meetings, meetingDraft, options)
    setMeetings(nextMeetings)
    return { meeting, conflict, conflictingRoles, baseConflict }
  }

  const handleDeleteMeeting = async (meetingId) => {
    const nextMeetings = await removeMeetingRecord(meetings, meetingId)
    setMeetings(nextMeetings)
  }

  const handleDuplicateMeeting = async (meetingId) => {
    const { meetings: nextMeetings, meeting } = await duplicateMeetingRecord(meetings, meetingId)
    setMeetings(nextMeetings)
    return meeting
  }

  return (
    <BrowserRouter>
      <AppShell
        meetings={meetings}
        onDeleteMeeting={handleDeleteMeeting}
        onDuplicateMeeting={handleDuplicateMeeting}
        onSaveMeeting={handleSaveMeeting}
        syncMode={syncMode}
      />
    </BrowserRouter>
  )
}

export default App
