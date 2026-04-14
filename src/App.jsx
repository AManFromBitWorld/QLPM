import { useState } from 'react'
import {
  BrowserRouter,
  NavLink,
  Route,
  Routes,
  useParams,
} from 'react-router-dom'
import { CalendarRange, ClipboardList } from 'lucide-react'
import './App.css'
import MeetingEditorPage from './pages/MeetingEditorPage.jsx'
import MeetingsPage from './pages/MeetingsPage.jsx'
import MeetingDetailPage from './pages/MeetingDetailPage.jsx'
import {
  duplicateMeetingRecord,
  getStoredMeetings,
  removeMeetingRecord,
  saveMeetingRecord,
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
}) {
  const totalMeetings = meetings.length

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar__brand">
          <span className="topbar__eyebrow">精准抗感染专项系列会议</span>
          <div>
            <h1>会议信息录入</h1>
            <p>面向外部填写的主流程入口，先录基础信息，再录人员，最后预览确认。</p>
          </div>
        </div>
        <div className="topbar__utility">
          <span className="tag">内部记录 {totalMeetings} 场</span>
        </div>
      </header>

      <nav className="main-nav" aria-label="主导航">
        <NavLink to="/" end className="main-nav__link">
          <CalendarRange size={18} />
          填写会议信息
        </NavLink>
        <NavLink to="/meetings" className="main-nav__link main-nav__link--quiet">
          <ClipboardList size={18} />
          内部管理
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
  const [meetings, setMeetings] = useState(() => getStoredMeetings())

  const handleSaveMeeting = (meetingDraft) => {
    const { meetings: nextMeetings, meeting } = saveMeetingRecord(meetings, meetingDraft)
    setMeetings(nextMeetings)
    return meeting
  }

  const handleDeleteMeeting = (meetingId) => {
    setMeetings((currentMeetings) => removeMeetingRecord(currentMeetings, meetingId))
  }

  const handleDuplicateMeeting = (meetingId) => {
    const { meetings: nextMeetings, meeting } = duplicateMeetingRecord(meetings, meetingId)
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
      />
    </BrowserRouter>
  )
}

export default App
