import { ROLE_CONFIG } from '../data/config.js'
import { getParticipantNameById } from '../utils/meeting.js'

function renderValue(value, fallback = '待补充') {
  return value ? value : <span className="placeholder-text">{fallback}</span>
}

function MeetingPreview({ meeting, previewRef }) {
  return (
    <div className="preview-document" ref={previewRef}>
      <div className="preview-document__hero">
        <span className="tag">{meeting.project}</span>
        <h3>{meeting.title || '未命名会议'}</h3>
        <p>用于会前统筹、嘉宾信息确认、资料导出和执行归档。</p>
      </div>

      <div className="preview-document__body">
        <section className="detail-grid">
          <article className="detail-card">
            <span>所属大区</span>
            <strong>{renderValue(meeting.region)}</strong>
          </article>
          <article className="detail-card">
            <span>所属子项目</span>
            <strong>{renderValue(meeting.project)}</strong>
          </article>
          <article className="detail-card">
            <span>会议日期</span>
            <strong>{renderValue(meeting.date)}</strong>
          </article>
          <article className="detail-card">
            <span>会议时间</span>
            <strong>{renderValue(meeting.time)}</strong>
          </article>
          <article className="detail-card">
            <span>会议状态</span>
            <strong>{renderValue(meeting.status, '草稿')}</strong>
          </article>
          <article className="detail-card">
            <span>讲题数量</span>
            <strong>{meeting.topicCount}</strong>
          </article>
          <article className="detail-card">
            <span>备注信息</span>
            <strong>{renderValue(meeting.note)}</strong>
          </article>
        </section>

        <section>
          <div className="page-header" style={{ marginBottom: 12 }}>
            <div>
              <h2 style={{ fontSize: 22 }}>讲题列表</h2>
              <p>按讲题模块展示主题、对应讲者和讨论支持信息。</p>
            </div>
            <span className="tag">{meeting.topicCount} 个讲题</span>
          </div>

          <div className="topic-preview-grid">
            {meeting.topics.map((topic) => (
              <article className="topic-preview-card" key={topic.id}>
                <div className="topic-preview-card__top">
                  <span className="tag">第 {topic.order} 讲题</span>
                  <strong>{renderValue(topic.title)}</strong>
                </div>
                <div className="topic-preview-card__meta">
                  <div>
                    <span>讲题子项目</span>
                    <strong>{renderValue(topic.project)}</strong>
                  </div>
                  <div>
                    <span>对应讲者</span>
                    <strong>
                      {renderValue(
                        getParticipantNameById(
                          meeting.attendees?.speaker || [],
                          topic.speakerId,
                          '讲者',
                        ),
                        '待关联',
                      )}
                    </strong>
                  </div>
                  <div>
                    <span>时长</span>
                    <strong>{renderValue(topic.duration)}</strong>
                  </div>
                  <div>
                    <span>相关讨论嘉宾</span>
                    <strong>
                      {topic.panelistIds.length
                        ? topic.panelistIds
                            .map((panelistId) =>
                              getParticipantNameById(
                                meeting.attendees?.panelist || [],
                                panelistId,
                                '讨论嘉宾',
                              ),
                            )
                            .join('、')
                        : renderValue('')}
                    </strong>
                  </div>
                </div>
                <div className="topic-preview-card__block">
                  <span>讲题简介</span>
                  <p>{renderValue(topic.intro)}</p>
                </div>
                <div className="topic-preview-card__block">
                  <span>备注</span>
                  <p>{renderValue(topic.note)}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {ROLE_CONFIG.map((role) => {
          const participants = meeting.attendees?.[role.key] || []

          return (
            <section key={role.key}>
              <div className="page-header" style={{ marginBottom: 12 }}>
                <div>
                  <h2 style={{ fontSize: 22 }}>{role.label}</h2>
                  <p>按角色汇总参会人员，便于会前确认和会中执行。</p>
                </div>
                <span className="tag">共 {participants.length} 个席位</span>
              </div>

              <table className="participant-table">
                <thead>
                  <tr>
                    <th style={{ width: 88 }}>序号</th>
                    <th>医院</th>
                    <th style={{ width: 120 }}>姓名</th>
                    <th>科室</th>
                    <th style={{ width: 160 }}>职称</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((person, index) => (
                    <tr key={person.id}>
                      <td>{index + 1}</td>
                      <td>{renderValue(person.hospital)}</td>
                      <td>{renderValue(person.name)}</td>
                      <td>{renderValue(person.department)}</td>
                      <td>{renderValue(person.title)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )
        })}
      </div>
    </div>
  )
}

export default MeetingPreview
