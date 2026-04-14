import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, ChevronLeft, ChevronRight, Save } from 'lucide-react'
import {
  REGIONS,
  ROLE_CONFIG,
  STEP_ITEMS,
  SUBPROJECTS,
  TOPIC_COUNT_OPTIONS,
} from '../data/config.js'
import MeetingPreview from '../components/MeetingPreview.jsx'
import RoleSection from '../components/RoleSection.jsx'
import TopicSection from '../components/TopicSection.jsx'
import {
  createEmptyParticipant,
  createEmptyTopic,
  createMeetingDraft,
  normalizeMeeting,
} from '../utils/meeting.js'

function getMeetingCompletion(meeting) {
  const totalSlots = ROLE_CONFIG.reduce(
    (count, role) => count + (meeting.attendees?.[role.key]?.length || 0),
    0,
  )
  const filledSlots = ROLE_CONFIG.reduce((count, role) => {
    const participants = meeting.attendees?.[role.key] || []
    return (
      count +
      participants.filter(
        (person) => person.hospital || person.name || person.department || person.title,
      ).length
    )
  }, 0)

  return {
    totalSlots,
    filledSlots,
  }
}

function MeetingEditorPage({ meetings, onSaveMeeting }) {
  const { meetingId } = useParams()
  const navigate = useNavigate()
  const editingMeeting = useMemo(
    () => meetings.find((meeting) => meeting.id === meetingId),
    [meetingId, meetings],
  )
  const [meeting, setMeeting] = useState(() =>
    editingMeeting ? normalizeMeeting(editingMeeting) : createMeetingDraft(),
  )
  const [activeStep, setActiveStep] = useState(0)
  const [message, setMessage] = useState('')

  const completion = useMemo(() => getMeetingCompletion(meeting), [meeting])

  const handleBaseFieldChange = (field, value) => {
    setMeeting((currentMeeting) => {
      if (field === 'topicCount') {
        const nextTopicCount = Number(value)
        const nextTopics = Array.from({ length: nextTopicCount }, (_, index) => {
          const existingTopic = currentMeeting.topics[index]
          return existingTopic
            ? { ...existingTopic, order: index + 1 }
            : createEmptyTopic(index + 1, currentMeeting.project)
        })

        return {
          ...currentMeeting,
          topicCount: nextTopicCount,
          topics: nextTopics,
        }
      }

      if (field === 'project') {
        const previousProject = currentMeeting.project

        return {
          ...currentMeeting,
          project: value,
          topics: currentMeeting.topics.map((topic) => ({
            ...topic,
            project: topic.project === previousProject || !topic.project ? value : topic.project,
          })),
        }
      }

      return {
        ...currentMeeting,
        [field]: value,
      }
    })
  }

  const handleParticipantChange = (roleKey, personId, field, value) => {
    setMeeting((currentMeeting) => ({
      ...currentMeeting,
      attendees: {
        ...currentMeeting.attendees,
        [roleKey]: currentMeeting.attendees[roleKey].map((person) =>
          person.id === personId ? { ...person, [field]: value } : person,
        ),
      },
    }))
  }

  const handleAddParticipant = (roleKey) => {
    setMeeting((currentMeeting) => ({
      ...currentMeeting,
      attendees: {
        ...currentMeeting.attendees,
        [roleKey]: [...currentMeeting.attendees[roleKey], createEmptyParticipant()],
      },
    }))
  }

  const handleRemoveParticipant = (roleKey, personId) => {
    setMeeting((currentMeeting) => ({
      ...currentMeeting,
      attendees: {
        ...currentMeeting.attendees,
        [roleKey]: currentMeeting.attendees[roleKey].filter((person) => person.id !== personId),
      },
    }))
  }

  const handleTopicChange = (topicId, field, value) => {
    setMeeting((currentMeeting) => ({
      ...currentMeeting,
      topics: currentMeeting.topics.map((topic) =>
        topic.id === topicId ? { ...topic, [field]: value } : topic,
      ),
    }))
  }

  const handleTopicPanelistToggle = (topicId, panelistId) => {
    setMeeting((currentMeeting) => ({
      ...currentMeeting,
      topics: currentMeeting.topics.map((topic) => {
        if (topic.id !== topicId) {
          return topic
        }

        const exists = topic.panelistIds.includes(panelistId)
        return {
          ...topic,
          panelistIds: exists
            ? topic.panelistIds.filter((id) => id !== panelistId)
            : [...topic.panelistIds, panelistId],
        }
      }),
    }))
  }

  const handleSave = (status) => {
    const savedMeeting = onSaveMeeting({
      ...meeting,
      status,
    })
    setMeeting(savedMeeting)
    setMessage(status === '已确认' ? '会议已确认并保存。' : '会议草稿已保存。')
    if (!meetingId) {
      navigate(`/meetings/${savedMeeting.id}/edit`, { replace: true })
    }
  }

  const canGoNext = activeStep < STEP_ITEMS.length - 1
  const canGoPrevious = activeStep > 0

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <span className="tag">{meetingId ? '编辑会议' : '新建会议'}</span>
          <h2>{meeting.title || '会议筹备表单'}</h2>
          <p>先录入基础信息，再按角色补齐嘉宾资料，最后统一预览确认。</p>
        </div>
        <div className="button-row">
          <Link className="button button--secondary" to="/meetings">
            返回会议列表
          </Link>
          <Link
            className="button button--ghost"
            to={meetingId ? `/meetings/${meeting.id}` : '/'}
          >
            查看详情页
          </Link>
        </div>
      </div>

      <div className="steps">
        {STEP_ITEMS.map((step, index) => (
          <button
            type="button"
            key={step.key}
            className={`step-chip ${index === activeStep ? 'step-chip--active' : ''}`}
            onClick={() => setActiveStep(index)}
          >
            <span className="step-chip__index">{index + 1}</span>
            <span>{step.label}</span>
          </button>
        ))}
      </div>

      <div className="split-layout">
        <section className="section-card form-panel">
          <div className="editor-toolbar">
            <div>
              <h2 style={{ fontSize: 24, marginBottom: 6 }}>{STEP_ITEMS[activeStep].label}</h2>
              <p>{STEP_ITEMS[activeStep].description}</p>
            </div>
            <div className="button-row">
              <button
                type="button"
                className="button button--secondary"
                onClick={() => handleSave('草稿')}
              >
                <Save size={16} />
                保存草稿
              </button>
              <button
                type="button"
                className="button button--primary"
                onClick={() => handleSave('已确认')}
              >
                <CheckCircle2 size={16} />
                保存并确认
              </button>
            </div>
          </div>

          {message ? <div className="inline-message">{message}</div> : null}

          {activeStep === 0 ? (
            <div className="field-grid" style={{ marginTop: 20 }}>
              <div className="field field--full">
                <label htmlFor="meeting-title">会议主题</label>
                <input
                  id="meeting-title"
                  type="text"
                  placeholder="例如：耐药菌感染精准诊疗策略专题会"
                  value={meeting.title}
                  onChange={(event) => handleBaseFieldChange('title', event.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="meeting-date">会议日期</label>
                <input
                  id="meeting-date"
                  type="date"
                  value={meeting.date}
                  onChange={(event) => handleBaseFieldChange('date', event.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="meeting-time">会议时间</label>
                <input
                  id="meeting-time"
                  type="time"
                  value={meeting.time}
                  onChange={(event) => handleBaseFieldChange('time', event.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="meeting-region">所属大区</label>
                <select
                  id="meeting-region"
                  value={meeting.region}
                  onChange={(event) => handleBaseFieldChange('region', event.target.value)}
                >
                  {REGIONS.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="meeting-project">所属子项目</label>
                <select
                  id="meeting-project"
                  value={meeting.project}
                  onChange={(event) => handleBaseFieldChange('project', event.target.value)}
                >
                  {SUBPROJECTS.map((project) => (
                    <option key={project.value} value={project.value}>
                      {project.value}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="meeting-topic-count">讲题数量</label>
                <select
                  id="meeting-topic-count"
                  value={meeting.topicCount}
                  onChange={(event) => handleBaseFieldChange('topicCount', event.target.value)}
                >
                  {TOPIC_COUNT_OPTIONS.map((count) => (
                    <option key={count} value={count}>
                      {count} 个讲题
                    </option>
                  ))}
                </select>
              </div>

              <div className="field field--full">
                <label htmlFor="meeting-note">备注信息</label>
                <textarea
                  id="meeting-note"
                  placeholder="可记录会前准备、嘉宾待确认事项、资料需求或其他执行备注。"
                  value={meeting.note}
                  onChange={(event) => handleBaseFieldChange('note', event.target.value)}
                />
              </div>
            </div>
          ) : null}

          {activeStep === 1 ? (
            <div style={{ marginTop: 20 }}>
              <TopicSection
                topics={meeting.topics}
                speakers={meeting.attendees.speaker}
                panelists={meeting.attendees.panelist}
                onTopicChange={handleTopicChange}
                onTogglePanelist={handleTopicPanelistToggle}
              />
            </div>
          ) : null}

          {activeStep === 2 ? (
            <div className="role-grid" style={{ marginTop: 20 }}>
              {ROLE_CONFIG.map((role) => (
                <RoleSection
                  key={role.key}
                  role={role}
                  participants={meeting.attendees[role.key]}
                  onAddParticipant={handleAddParticipant}
                  onChangeParticipant={handleParticipantChange}
                  onRemoveParticipant={handleRemoveParticipant}
                />
              ))}
            </div>
          ) : null}

          {activeStep === 3 ? (
            <div style={{ marginTop: 20 }}>
              <MeetingPreview meeting={meeting} />
            </div>
          ) : null}

          <div className="preview-actions">
            <button
              type="button"
              className="button button--secondary"
              onClick={() => setActiveStep((step) => Math.max(0, step - 1))}
              disabled={!canGoPrevious}
            >
              <ChevronLeft size={16} />
              上一步
            </button>
            <div className="helper-text">
              已录入 {completion.filledSlots} / {completion.totalSlots} 个席位，可随时保存草稿。
            </div>
            <button
              type="button"
              className="button button--primary"
              onClick={() =>
                setActiveStep((step) => Math.min(STEP_ITEMS.length - 1, step + 1))
              }
              disabled={!canGoNext}
            >
              下一步
              <ChevronRight size={16} />
            </button>
          </div>
        </section>

        <aside className="section-card preview-panel">
          <div className="page-header">
            <div>
              <h2 style={{ fontSize: 22 }}>填写摘要</h2>
              <p>录入进度和会议骨架实时可见，便于执行时快速确认。</p>
            </div>
          </div>

          <div className="summary-grid" style={{ gridTemplateColumns: '1fr' }}>
            <article className="summary-card">
              <strong>{meeting.region}</strong>
              <span>所属大区</span>
            </article>
            <article className="summary-card">
              <strong>{meeting.project}</strong>
              <span>所属子项目</span>
            </article>
            <article className="summary-card">
              <strong>{meeting.topicCount}</strong>
              <span>讲题数量</span>
            </article>
            <article className="summary-card">
              <strong>{completion.filledSlots}</strong>
              <span>已填写嘉宾席位</span>
            </article>
            <article className="summary-card">
              <strong>{meeting.status}</strong>
              <span>当前保存状态</span>
            </article>
          </div>

          <div className="field" style={{ marginTop: 10 }}>
            <label>会议主题</label>
            <div className="detail-card">
              <strong>{meeting.title || '待填写会议主题'}</strong>
            </div>
          </div>

          <div className="field" style={{ marginTop: 14 }}>
            <label>时间安排</label>
            <div className="detail-card">
              <strong>
                {meeting.date || '待定日期'} {meeting.time || '待定时间'}
              </strong>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default MeetingEditorPage
