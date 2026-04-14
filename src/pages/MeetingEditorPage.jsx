import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, ChevronLeft, ChevronRight, Save } from 'lucide-react'
import {
  REGIONS,
  REGION_PROVINCES,
  ROLE_CONFIG,
  STEP_ITEMS,
  SUBPROJECTS,
} from '../data/config.js'
import MeetingPreview from '../components/MeetingPreview.jsx'
import RoleSection from '../components/RoleSection.jsx'
import { createEmptyParticipant, createMeetingDraft, normalizeMeeting } from '../utils/meeting.js'
import { parseExpertText } from '../utils/intake.js'

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

function scrollToSection(sectionId) {
  const element = document.getElementById(sectionId)
  if (!element) {
    return
  }

  element.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
  const [importRole, setImportRole] = useState(ROLE_CONFIG[0].key)
  const [importText, setImportText] = useState('')
  const [importMessage, setImportMessage] = useState('')

  const completion = useMemo(() => getMeetingCompletion(meeting), [meeting])
  const provinceOptions = REGION_PROVINCES[meeting.region] || []

  const handleBaseFieldChange = (field, value) => {
    setMeeting((currentMeeting) => {
      if (field === 'region') {
        const nextProvinceOptions = REGION_PROVINCES[value] || []

        return {
          ...currentMeeting,
          region: value,
          province: nextProvinceOptions[0] || '',
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

  const handleSmartImport = () => {
    const entries = parseExpertText(importText)

    if (entries.length === 0) {
      setImportMessage('没有识别到可导入的专家信息，请检查格式。')
      return
    }

    const participants = [...meeting.attendees[importRole]]
    let importedCount = 0

    entries.forEach((entry) => {
      let targetIndex = participants.findIndex(
        (person) => !person.hospital && !person.name && !person.department && !person.title,
      )

      if (targetIndex < 0) {
        participants.push(createEmptyParticipant())
        targetIndex = participants.length - 1
      }

      participants[targetIndex] = {
        ...participants[targetIndex],
        hospital: entry.hospital || participants[targetIndex].hospital,
        name: entry.name || participants[targetIndex].name,
        department: entry.department || participants[targetIndex].department,
        title: entry.title || participants[targetIndex].title,
      }
      importedCount += 1
    })

    setMeeting((currentMeeting) => ({
      ...currentMeeting,
      attendees: {
        ...currentMeeting.attendees,
        [importRole]: participants,
      },
    }))
    setImportMessage(
      `已为“${ROLE_CONFIG.find((role) => role.key === importRole)?.label}”导入 ${importedCount} 条信息。`,
    )
    setImportText('')
  }

  const canGoNext = activeStep < STEP_ITEMS.length - 1
  const canGoPrevious = activeStep > 0

  return (
    <div className="page-content">
      <div className="page-header page-header--compact">
        <div>
          <span className="tag">{meetingId ? '编辑会议' : '新建会议'}</span>
          <h2>{meeting.title || '填写会议信息'}</h2>
          <p>围绕基础信息、人员录入和预览确认三步完成整场会议建档。</p>
        </div>
        <div className="button-row">
          <Link className="button button--secondary" to="/meetings">
            进入内部管理
          </Link>
          {meetingId ? (
            <Link className="button button--ghost" to={`/meetings/${meeting.id}`}>
              查看详情
            </Link>
          ) : null}
        </div>
      </div>

      <div className="editor-anchor-nav">
        {STEP_ITEMS.map((step, index) => (
          <button
            type="button"
            key={step.key}
            className={`editor-anchor-nav__link ${
              index === activeStep ? 'editor-anchor-nav__link--active' : ''
            }`}
            onClick={() => setActiveStep(index)}
          >
            <span className="editor-anchor-nav__index">{index + 1}</span>
            {step.label}
          </button>
        ))}
      </div>

      <section className="section-card form-panel editor-page">
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

        <div className="editor-progress">
          <div className="editor-progress__stat">
            <strong>{meeting.region}</strong>
            <span>所属大区</span>
          </div>
          <div className="editor-progress__stat">
            <strong>{meeting.province}</strong>
            <span>所属省份</span>
          </div>
          <div className="editor-progress__stat">
            <strong>{completion.filledSlots}</strong>
            <span>已填写嘉宾席位</span>
          </div>
          <div className="editor-progress__stat">
            <strong>{meeting.status}</strong>
            <span>当前状态</span>
          </div>
        </div>

        {message ? <div className="inline-message">{message}</div> : null}

          {activeStep === 0 ? (
            <div className="editor-section-stack" style={{ marginTop: 20 }}>
              <div className="field-grid">
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

                <div className="field field--full">
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
              </div>

              <section className="choice-panel">
                <div className="choice-panel__header">
                  <div>
                    <h3>所属大区</h3>
                    <p>先选大区，再进入对应省份，减少误选。</p>
                  </div>
                </div>
                <div className="choice-grid">
                  {REGIONS.map((region) => (
                    <button
                      type="button"
                      key={region}
                      className={`choice-card ${meeting.region === region ? 'choice-card--active' : ''}`}
                      onClick={() => handleBaseFieldChange('region', region)}
                    >
                      <strong>{region}</strong>
                      <span>{REGION_PROVINCES[region].length} 个省级区域</span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="choice-panel">
                <div className="choice-panel__header">
                  <div>
                    <h3>所属省份</h3>
                    <p>当前大区：{meeting.region}</p>
                  </div>
                </div>
                <div className="chip-grid">
                  {provinceOptions.map((province) => (
                    <button
                      type="button"
                      key={province}
                      className={`choice-chip ${meeting.province === province ? 'choice-chip--active' : ''}`}
                      onClick={() => handleBaseFieldChange('province', province)}
                    >
                      {province}
                    </button>
                  ))}
                </div>
              </section>

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
          <div className="editor-section-stack" style={{ marginTop: 20 }}>
            <section className="role-jump-nav">
              <div className="role-jump-nav__label">角色快速导航</div>
              <div className="button-row">
                {ROLE_CONFIG.map((role) => (
                  <button
                    type="button"
                    key={role.key}
                    className="button button--ghost"
                    onClick={() => scrollToSection(`role-${role.key}`)}
                  >
                    {role.label}
                  </button>
                ))}
              </div>
            </section>

            <section className="smart-import-panel">
              <div className="smart-import-panel__header">
                <div>
                  <h3>智能填写</h3>
                  <p>把你拿到的专家信息直接粘贴进来，系统会自动识别并填入当前角色的空位。</p>
                </div>
                <div className="field smart-import-panel__role">
                  <label htmlFor="import-role">导入到角色</label>
                  <select
                    id="import-role"
                    value={importRole}
                    onChange={(event) => setImportRole(event.target.value)}
                  >
                    {ROLE_CONFIG.map((role) => (
                      <option key={role.key} value={role.key}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="field">
                <label htmlFor="smart-import-text">专家信息粘贴框</label>
                <textarea
                  id="smart-import-text"
                  placeholder={`支持示例：\n姓名：张三，医院：复旦大学附属中山医院，科室：感染病科，职称：主任医师\n\n或\n张三，复旦大学附属中山医院，感染病科，主任医师\n李四，上海交通大学医学院附属瑞金医院，呼吸与危重症医学科，副主任医师`}
                  value={importText}
                  onChange={(event) => setImportText(event.target.value)}
                />
              </div>

              <div className="smart-import-panel__footer">
                <div className="helper-text">
                  默认只填充当前角色的空白席位，不会覆盖已经手工填写的内容。
                </div>
                <div className="button-row">
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={() => {
                      setImportText('')
                      setImportMessage('')
                    }}
                  >
                    清空
                  </button>
                  <button
                    type="button"
                    className="button button--primary"
                    onClick={handleSmartImport}
                  >
                    智能填写
                  </button>
                </div>
              </div>

              {importMessage ? <div className="inline-message">{importMessage}</div> : null}
            </section>

            <div className="role-grid">
              {ROLE_CONFIG.map((role) => (
                <RoleSection
                  key={role.key}
                  role={role}
                  sectionId={`role-${role.key}`}
                  participants={meeting.attendees[role.key]}
                  onAddParticipant={handleAddParticipant}
                  onChangeParticipant={handleParticipantChange}
                  onRemoveParticipant={handleRemoveParticipant}
                />
              ))}
            </div>
          </div>
        ) : null}

        {activeStep === 2 ? (
          <div style={{ marginTop: 20 }}>
            <MeetingPreview meeting={meeting} />
          </div>
        ) : null}

        <div className="preview-actions editor-footer">
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
            当前已完成 {completion.filledSlots} / {completion.totalSlots} 个标准席位录入。
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
    </div>
  )
}

export default MeetingEditorPage
