import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Copy, Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { REGIONS, SUBPROJECTS } from '../data/config.js'
import { buildRoleSummary, buildSearchIndex } from '../utils/export.js'

function MeetingsPage({ meetings, onDeleteMeeting, onDuplicateMeeting }) {
  const navigate = useNavigate()
  const [searchText, setSearchText] = useState('')
  const [projectFilter, setProjectFilter] = useState('全部子项目')
  const [regionFilter, setRegionFilter] = useState('全部大区')
  const [dateFilter, setDateFilter] = useState('')

  const filteredMeetings = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase()

    return meetings.filter((meeting) => {
      const projectMatches =
        projectFilter === '全部子项目' || meeting.project === projectFilter
      const regionMatches = regionFilter === '全部大区' || meeting.region === regionFilter
      const dateMatches = !dateFilter || meeting.date === dateFilter
      const searchMatches =
        !normalizedSearch || buildSearchIndex(meeting).includes(normalizedSearch)

      return projectMatches && regionMatches && dateMatches && searchMatches
    })
  }, [dateFilter, meetings, projectFilter, regionFilter, searchText])

  const regionSummary = REGIONS.map((region) => ({
    region,
    count: meetings.filter((meeting) => meeting.region === region).length,
  }))

  const handleDuplicate = (meetingId) => {
    const copiedMeeting = onDuplicateMeeting(meetingId)
    if (copiedMeeting) {
      navigate(`/meetings/${copiedMeeting.id}/edit`)
    }
  }

  const handleDelete = (meetingId) => {
    const shouldDelete = window.confirm('确定删除这场会议记录吗？该操作无法撤销。')
    if (!shouldDelete) {
      return
    }

    onDeleteMeeting(meetingId)
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <span className="tag">后台管理</span>
          <h2>历史会议管理</h2>
          <p>支持搜索、筛选、编辑、复制、删除和详情查看，便于长期积累会议资料。</p>
        </div>
        <Link className="button button--primary" to="/meetings/new">
          <Plus size={16} />
          新建会议
        </Link>
      </div>

      <section className="section-card list-panel">
        <div className="summary-grid" style={{ marginBottom: 20 }}>
          {regionSummary.map((item) => (
            <article className="summary-card" key={item.region}>
              <strong>{item.region}</strong>
              <span>{item.count} 场会议</span>
            </article>
          ))}
        </div>

        <div className="list-toolbar">
          <div className="field">
            <label htmlFor="meeting-search">搜索会议</label>
            <input
              id="meeting-search"
              type="text"
              placeholder="按主题、项目、大区、省份、嘉宾姓名、医院等搜索"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="meeting-filter">子项目筛选</label>
            <select
              id="meeting-filter"
              value={projectFilter}
              onChange={(event) => setProjectFilter(event.target.value)}
            >
              <option value="全部子项目">全部子项目</option>
              {SUBPROJECTS.map((project) => (
                <option key={project.value} value={project.value}>
                  {project.value}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="region-filter">大区筛选</label>
            <select
              id="region-filter"
              value={regionFilter}
              onChange={(event) => setRegionFilter(event.target.value)}
            >
              <option value="全部大区">全部大区</option>
              {REGIONS.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="date-filter">会议日期</label>
            <input
              id="date-filter"
              type="date"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
            />
          </div>

          <div className="helper-text" style={{ paddingBottom: 10 }}>
            <Search size={14} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />
            当前结果 {filteredMeetings.length} 条
          </div>
        </div>

        {filteredMeetings.length === 0 ? (
          <div className="empty-state">
            <strong>暂无符合条件的会议记录</strong>
            <div>可以先新建会议，或调整搜索词与筛选条件。</div>
          </div>
        ) : (
          <div className="meeting-grid">
            {filteredMeetings.map((meeting) => {
              const roleSummary = buildRoleSummary(meeting)

              return (
                <article className="meeting-card" key={meeting.id}>
                  <div className="meeting-card__top">
                    <div>
                      <div className="button-row" style={{ gap: 8 }}>
                        <span className="tag">{meeting.region}</span>
                        <span className="tag">{meeting.province}</span>
                        <span className="tag">{meeting.project}</span>
                      </div>
                      <h3>{meeting.title || '未命名会议'}</h3>
                      <p>
                        最后更新：{new Date(meeting.updatedAt).toLocaleString('zh-CN')}
                      </p>
                    </div>
                    <span
                      className={`status-pill ${
                        meeting.status === '已确认'
                          ? 'status-pill--confirmed'
                          : 'status-pill--draft'
                      }`}
                    >
                      {meeting.status}
                    </span>
                  </div>

                  <div className="meeting-meta">
                    <div>
                      <span>所属大区</span>
                      <strong>{meeting.region}</strong>
                    </div>
                    <div>
                      <span>会议日期</span>
                      <strong>{meeting.date || '待定'}</strong>
                    </div>
                    <div>
                      <span>所属省份</span>
                      <strong>{meeting.province}</strong>
                    </div>
                    <div>
                      <span>嘉宾席位</span>
                      <strong>
                        {roleSummary.reduce((count, role) => count + role.filled, 0)} /{' '}
                        {roleSummary.reduce((count, role) => count + role.total, 0)}
                      </strong>
                    </div>
                  </div>

                  <div className="helper-text">
                    {roleSummary
                      .map((role) => `${role.label} ${role.filled}/${role.total}`)
                      .join(' · ')}
                  </div>

                  <div className="button-row">
                    <Link className="button button--secondary" to={`/meetings/${meeting.id}`}>
                      <Eye size={16} />
                      详情
                    </Link>
                    <Link
                      className="button button--secondary"
                      to={`/meetings/${meeting.id}/edit`}
                    >
                      <Pencil size={16} />
                      编辑
                    </Link>
                    <button
                      type="button"
                      className="button button--ghost"
                      onClick={() => handleDuplicate(meeting.id)}
                    >
                      <Copy size={16} />
                      复制
                    </button>
                    <button
                      type="button"
                      className="button button--danger"
                      onClick={() => handleDelete(meeting.id)}
                    >
                      <Trash2 size={16} />
                      删除
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

export default MeetingsPage
