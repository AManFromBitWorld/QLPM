import { ROLE_CONFIG } from '../data/config.js'

function renderValue(value, fallback = '待补充') {
  return value ? value : <span className="placeholder-text">{fallback}</span>
}

function MeetingPreview({ meeting, previewRef }) {
  return (
    <div className="preview-document" ref={previewRef}>
      <div className="preview-document__hero">
        <div className="button-row" style={{ gap: 8 }}>
          <span className="tag">{meeting.region}</span>
          <span className="tag">{meeting.province}</span>
          <span className="tag">{meeting.project}</span>
        </div>
        <h3>{meeting.title || '未命名会议'}</h3>
        <p>用于会前核对嘉宾资料、导出会议档案和执行团队内部确认。</p>
      </div>

      <div className="preview-document__body">
        <section className="detail-grid">
          <article className="detail-card">
            <span>所属大区</span>
            <strong>{renderValue(meeting.region)}</strong>
          </article>
          <article className="detail-card">
            <span>所属省份</span>
            <strong>{renderValue(meeting.province)}</strong>
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
          <article className="detail-card detail-card--full">
            <span>备注信息</span>
            <strong>{renderValue(meeting.note)}</strong>
          </article>
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
