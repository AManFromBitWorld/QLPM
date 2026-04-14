import { useEffect, useMemo, useRef, useState } from 'react'
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
import {
  createEmptyParticipant,
  createMeetingDraft,
  formatMeetingRegions,
  formatMeetingProvinces,
  getRoleParticipantCount,
  getRoleStatus,
  normalizeMeeting,
} from '../utils/meeting.js'
import { getCollaboratorName, saveCollaboratorName } from '../utils/collaboration.js'
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

function touchRoleMeta(currentMeeting, roleKey, collaboratorName) {
  return {
    ...currentMeeting.roleMeta,
    [roleKey]: {
      updatedBy: collaboratorName || '协作成员',
      updatedAt: new Date().toISOString(),
    },
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
  const [importRole, setImportRole] = useState(ROLE_CONFIG[0].key)
  const [importText, setImportText] = useState('')
  const [importMessage, setImportMessage] = useState('')
  const [collaboratorName, setCollaboratorName] = useState(() => getCollaboratorName())
  const [syncMessage, setSyncMessage] = useState('')
  const isFirstAutosave = useRef(true)
  const autosaveTimer = useRef(null)
  const meetingRef = useRef(meeting)

  const completion = useMemo(() => getMeetingCompletion(meeting), [meeting])
  const provinceOptions = [
    ...new Set(
      (meeting.regions || []).flatMap((region) => REGION_PROVINCES[region] || []),
    ),
  ]

  useEffect(() => {
    if (editingMeeting) {
      const syncTimer = window.setTimeout(() => {
        setMeeting(normalizeMeeting(editingMeeting))
      }, 0)

      return () => window.clearTimeout(syncTimer)
    }
    return undefined
  }, [editingMeeting])

  useEffect(() => {
    meetingRef.current = meeting
  }, [meeting])

  useEffect(() => {
    saveCollaboratorName(collaboratorName)
  }, [collaboratorName])

  const handleBaseFieldChange = (field, value) => {
    setMeeting((currentMeeting) => ({
      ...currentMeeting,
      [field]: value,
    }))
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
      roleMeta: touchRoleMeta(currentMeeting, roleKey, collaboratorName),
    }))
  }

  const handleAddParticipant = (roleKey) => {
    setMeeting((currentMeeting) => ({
      ...currentMeeting,
      attendees: {
        ...currentMeeting.attendees,
        [roleKey]: [...currentMeeting.attendees[roleKey], createEmptyParticipant()],
      },
      roleMeta: touchRoleMeta(currentMeeting, roleKey, collaboratorName),
    }))
  }

  const handleRemoveParticipant = (roleKey, personId) => {
    setMeeting((currentMeeting) => ({
      ...currentMeeting,
      attendees: {
        ...currentMeeting.attendees,
        [roleKey]: currentMeeting.attendees[roleKey].filter((person) => person.id !== personId),
      },
      roleMeta: touchRoleMeta(currentMeeting, roleKey, collaboratorName),
    }))
  }

  const handleSave = async (status) => {
    try {
      const savedMeeting = await onSaveMeeting({
        ...meeting,
        status,
      })
      setMeeting(savedMeeting)
      setMessage(status === '已确认' ? '会议已确认并保存。' : '会议草稿已保存。')
      if (!meetingId) {
        navigate(`/meetings/${savedMeeting.id}/edit`, { replace: true })
      }
    } catch {
      setMessage('保存失败，请检查协作配置或网络连接。')
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
      roleMeta: touchRoleMeta(currentMeeting, importRole, collaboratorName),
    }))
    setImportMessage(
      `已为“${ROLE_CONFIG.find((role) => role.key === importRole)?.label}”导入 ${importedCount} 条信息。`,
    )
    setImportText('')
  }

  const handleRegionSelect = (region) => {
    setMeeting((currentMeeting) => {
      const exists = currentMeeting.regions.includes(region)
      const nextRegions = exists
        ? currentMeeting.regions.filter((item) => item !== region)
        : [...currentMeeting.regions, region]
      const allowedProvinces = new Set(
        nextRegions.flatMap((item) => REGION_PROVINCES[item] || []),
      )
      const nextProvinces = currentMeeting.provinces.filter((province) =>
        allowedProvinces.has(province),
      )

      return {
        ...currentMeeting,
        regions: nextRegions,
        provinces: nextProvinces,
      }
    })
  }

  const handleProvinceToggle = (province) => {
    setMeeting((currentMeeting) => {
      const exists = currentMeeting.provinces.includes(province)

      if (exists) {
        const nextProvinces = currentMeeting.provinces.filter((item) => item !== province)
        return {
          ...currentMeeting,
          provinces: nextProvinces,
        }
      }

      return {
        ...currentMeeting,
        provinces: [...currentMeeting.provinces, province],
      }
    })
  }

  const canGoNext = activeStep < STEP_ITEMS.length - 1
  const canGoPrevious = activeStep > 0
  const autosavePayload = useMemo(
    () =>
      JSON.stringify({
        regions: meeting.regions,
        provinces: meeting.provinces,
        project: meeting.project,
        title: meeting.title,
        date: meeting.date,
        time: meeting.time,
        note: meeting.note,
        status: meeting.status,
        attendees: meeting.attendees,
        roleMeta: meeting.roleMeta,
      }),
    [meeting],
  )

  useEffect(() => {
    if (isFirstAutosave.current) {
      isFirstAutosave.current = false
      return
    }

    window.clearTimeout(autosaveTimer.current)
    autosaveTimer.current = window.setTimeout(async () => {
      try {
        setSyncMessage('自动保存中...')
        const savedMeeting = await onSaveMeeting(meetingRef.current)
        setMeeting(savedMeeting)
        setSyncMessage('已自动保存并同步')
        if (!meetingId) {
          navigate(`/meetings/${savedMeeting.id}/edit`, { replace: true })
        }
      } catch {
        setSyncMessage('自动保存失败，请检查协作配置')
      }
    }, 900)

    return () => {
      window.clearTimeout(autosaveTimer.current)
    }
  }, [autosavePayload, meetingId, navigate, onSaveMeeting])

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
              onClick={() => void handleSave('草稿')}
            >
              <Save size={16} />
              保存草稿
            </button>
            <button
              type="button"
              className="button button--primary"
              onClick={() => void handleSave('已确认')}
            >
              <CheckCircle2 size={16} />
              保存并确认
            </button>
          </div>
        </div>

        {message ? <div className="inline-message">{message}</div> : null}
        {syncMessage ? <div className="inline-message">{syncMessage}</div> : null}

        {activeStep === 0 ? (
          <div className="editor-section-stack editor-section-stack--dense" style={{ marginTop: 20 }}>
            <div className="basic-workspace">
              <section className="selection-panel selection-panel--sidebar">
                <div className="selection-panel__intro">
                  <div>
                    <h3>地域选择</h3>
                    <p>先锁定大区与省份，再进入右侧基础表单。</p>
                  </div>
                  <div className="selection-panel__stats">
                  <div className="selection-stat">
                      <span>已选大区</span>
                      <strong>{meeting.regions.length > 0 ? meeting.regions.length : '未选择'}</strong>
                    </div>
                    <div className="selection-stat">
                      <span>已选省份</span>
                      <strong>{meeting.provinces.length}</strong>
                    </div>
                  </div>
                </div>

                <div className="selection-block">
                  <div className="selection-block__header">
                    <div>
                      <span className="selection-block__step">步骤 1</span>
                      <h4>选择大区</h4>
                    </div>
                    <p>先确定本场会议所属的管理范围。</p>
                  </div>
                  <div className="choice-grid choice-grid--compact">
                    {REGIONS.map((region) => (
                      <button
                        type="button"
                        key={region}
                        className={`choice-card ${meeting.regions.includes(region) ? 'choice-card--active' : ''}`}
                        onClick={() => handleRegionSelect(region)}
                      >
                        <strong>{region}</strong>
                        <span>{REGION_PROVINCES[region].length} 个省级区域</span>
                      </button>
                    ))}
                  </div>
                </div>

                {meeting.regions.length > 0 ? (
                  <div className="selection-block selection-block--secondary">
                    <div className="selection-block__header selection-block__header--inline">
                      <div>
                        <span className="selection-block__step">步骤 2</span>
                        <h4>勾选涉及省份</h4>
                      </div>
                      <p>当前大区：{formatMeetingRegions(meeting)}，支持多选。</p>
                    </div>
                    <div className="chip-grid chip-grid--compact">
                      {provinceOptions.map((province) => (
                        <button
                          type="button"
                          key={province}
                          className={`choice-chip ${
                            meeting.provinces.includes(province) ? 'choice-chip--active' : ''
                          }`}
                          onClick={() => handleProvinceToggle(province)}
                        >
                          {province}
                        </button>
                      ))}
                    </div>

                    {meeting.provinces.length > 0 ? (
                      <div className="selection-tags-bar">
                        <div className="helper-text">
                          已选省份：{formatMeetingProvinces(meeting)}
                        </div>
                        <div className="selection-tags-bar__actions">
                          <div className="selected-tags selected-tags--compact">
                            {meeting.provinces.map((province) => (
                              <button
                                type="button"
                                key={province}
                                className="selected-tag"
                                onClick={() => handleProvinceToggle(province)}
                              >
                                {province}
                                <span>×</span>
                              </button>
                            ))}
                          </div>
                          <button
                            type="button"
                            className="button button--secondary"
                            onClick={() =>
                              setMeeting((currentMeeting) => ({
                                ...currentMeeting,
                                provinces: [],
                              }))
                            }
                          >
                            清空省份
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="selection-inline-hint">
                        请选择一个或多个省份后，再继续填写本场会议基础信息。
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="selection-inline-hint">
                    请选择东区、西区、北区或南区后，继续勾选本场会议涉及的省份。
                  </div>
                )}
              </section>

              {meeting.provinces.length > 0 ? (
                <section className="base-form-panel">
                  <div className="selection-block__header selection-block__header--inline">
                    <div>
                      <span className="selection-block__step">步骤 3</span>
                      <h4>基础表单</h4>
                    </div>
                    <p>地区范围已锁定，继续补齐会议档案。</p>
                  </div>
                  <div className="field-grid field-grid--dense">
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
                </section>
              ) : (
                <div className="empty-state empty-state--compact basic-workspace__placeholder">
                  <strong>右侧表单待解锁</strong>
                  <div>先在左侧完成大区和省份多选，基础信息表单会立即显示。</div>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {activeStep === 1 ? (
          <div className="editor-section-stack editor-section-stack--dense" style={{ marginTop: 20 }}>
            <div className="people-workspace">
              <aside className="people-sidebar">
                <div className="people-sidebar__header">
                  <h3>人员录入</h3>
                  <p>先定位角色，再连续填写医院、姓名、科室、职称。</p>
                </div>

                <section className="collaboration-panel">
                  <div className="field">
                    <label htmlFor="collaborator-name">填写人</label>
                    <input
                      id="collaborator-name"
                      type="text"
                      placeholder="请输入你的姓名"
                      value={collaboratorName}
                      onChange={(event) => setCollaboratorName(event.target.value)}
                    />
                  </div>
                  <div className="helper-text">
                    自动保存会把你记录为当前角色的最近更新人。
                  </div>
                </section>

                <div className="people-sidebar__summary">
                  <div className="people-sidebar__metric">
                    <span>已填席位</span>
                    <strong>
                      {completion.filledSlots}/{completion.totalSlots}
                    </strong>
                  </div>
                  <div className="people-sidebar__metric">
                    <span>涉及省份</span>
                    <strong>{meeting.provinces.length || '未选'}</strong>
                  </div>
                </div>

                <section className="role-jump-nav role-jump-nav--stacked role-jump-nav--flat">
                  <div className="role-jump-nav__head">
                    <div className="role-jump-nav__label">角色导航</div>
                    <p>点击后直接跳转到对应角色分区。</p>
                  </div>
                  <div className="role-jump-nav__grid">
                    {ROLE_CONFIG.map((role) => (
                      <button
                        type="button"
                        key={role.key}
                      className="role-jump-nav__button"
                      onClick={() => scrollToSection(`role-${role.key}`)}
                    >
                      <div>
                        <strong>{role.label}</strong>
                        <div className="role-jump-nav__meta">
                          {meeting.roleMeta?.[role.key]?.updatedBy
                            ? `最近更新：${meeting.roleMeta[role.key].updatedBy}`
                            : '尚未填写'}
                        </div>
                      </div>
                      <div className="role-jump-nav__status">
                        <span>{getRoleStatus(meeting.attendees[role.key])}</span>
                        <em>
                          {getRoleParticipantCount(meeting.attendees[role.key])}/
                          {meeting.attendees[role.key].length}
                        </em>
                      </div>
                    </button>
                  ))}
                </div>
                </section>

                <section className="smart-import-panel smart-import-panel--compact smart-import-panel--flat">
                  <div className="smart-import-panel__header smart-import-panel__header--stacked">
                    <div>
                      <h3>智能填写</h3>
                      <p>粘贴专家资料后，自动补入当前角色的空白席位。</p>
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

                  <div className="smart-import-panel__footer smart-import-panel__footer--stacked">
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
                        智能填写当前角色
                      </button>
                    </div>
                  </div>

                  {importMessage ? <div className="inline-message">{importMessage}</div> : null}
                </section>
              </aside>

              <div className="people-main">
                <div className="people-main__header">
                  <div>
                    <h3>角色表单</h3>
                    <p>按照主席、主持、讲者、讨论嘉宾的顺序连续录入。</p>
                  </div>
                  <div className="helper-text">支持新增扩展席位，适配特殊场次。</div>
                </div>

                <div className="role-grid">
                  {ROLE_CONFIG.map((role) => (
                    <RoleSection
                      key={role.key}
                      role={role}
                      sectionId={`role-${role.key}`}
                      participants={meeting.attendees[role.key]}
                      collaborationMeta={meeting.roleMeta?.[role.key]}
                      onAddParticipant={handleAddParticipant}
                      onChangeParticipant={handleParticipantChange}
                      onRemoveParticipant={handleRemoveParticipant}
                    />
                  ))}
                </div>
              </div>
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
