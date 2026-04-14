import { useMemo, useState } from 'react'
import {
  BrowserRouter,
  NavLink,
  Route,
  Routes,
  useParams,
} from 'react-router-dom'
import { CalendarRange, ClipboardList, LayoutDashboard } from 'lucide-react'
import './App.css'
import HomePage from './pages/HomePage.jsx'
import MeetingEditorPage from './pages/MeetingEditorPage.jsx'
import MeetingsPage from './pages/MeetingsPage.jsx'
import MeetingDetailPage from './pages/MeetingDetailPage.jsx'
import { PROJECT_NAME } from './data/config.js'
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
  const confirmedMeetings = useMemo(
    () => meetings.filter((meeting) => meeting.status === '已确认').length,
    [meetings],
  )

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar__brand">
          <span className="topbar__eyebrow">医学会议策划与信息管理</span>
          <div>
            <h1>{PROJECT_NAME}</h1>
            <p>线上会议统筹、嘉宾收集、资料归档、导出复用</p>
          </div>
        </div>
        <div className="topbar__stats">
          <div>
            <strong>{totalMeetings}</strong>
            <span>历史会议</span>
          </div>
          <div>
            <strong>{confirmedMeetings}</strong>
            <span>已确认会议</span>
          </div>
        </div>
      </header>

      <nav className="main-nav" aria-label="主导航">
        <NavLink to="/" end className="main-nav__link">
          <LayoutDashboard size={18} />
          项目总览
        </NavLink>
        <NavLink to="/meetings" className="main-nav__link">
          <ClipboardList size={18} />
          会议管理
        </NavLink>
        <NavLink to="/meetings/new" className="main-nav__link">
          <CalendarRange size={18} />
          新建会议
        </NavLink>
      </nav>

      <main className="page-shell">
        <Routes>
          <Route path="/" element={<HomePage meetings={meetings} />} />
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
