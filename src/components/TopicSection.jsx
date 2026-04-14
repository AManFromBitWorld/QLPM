import { SUBPROJECTS } from '../data/config.js'
import { getParticipantDisplay } from '../utils/meeting.js'

function TopicSection({
  topics,
  speakers,
  panelists,
  onTopicChange,
  onTogglePanelist,
}) {
  return (
    <section className="role-grid">
      {topics.map((topic, index) => (
        <article className="role-section" key={topic.id}>
          <div className="role-section__header">
            <div>
              <h3>讲题 {topic.order}</h3>
              <p>独立维护讲题内容、对应讲者和相关讨论嘉宾，适合多讲题会议编排。</p>
            </div>
            <span className="tag">第 {index + 1} 讲题</span>
          </div>

          <div className="role-section__slots">
            <div className="field-grid">
              <div className="field field--full">
                <label htmlFor={`topic-title-${topic.id}`}>讲题标题</label>
                <input
                  id={`topic-title-${topic.id}`}
                  type="text"
                  placeholder="例如：重症感染患者经验性抗菌治疗策略"
                  value={topic.title}
                  onChange={(event) => onTopicChange(topic.id, 'title', event.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor={`topic-project-${topic.id}`}>讲题所属子项目</label>
                <select
                  id={`topic-project-${topic.id}`}
                  value={topic.project}
                  onChange={(event) => onTopicChange(topic.id, 'project', event.target.value)}
                >
                  {SUBPROJECTS.map((project) => (
                    <option key={project.value} value={project.value}>
                      {project.value}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor={`topic-order-${topic.id}`}>讲题顺序</label>
                <input
                  id={`topic-order-${topic.id}`}
                  type="text"
                  value={`第 ${topic.order} 讲题`}
                  readOnly
                />
              </div>

              <div className="field">
                <label htmlFor={`topic-speaker-${topic.id}`}>对应讲者</label>
                <select
                  id={`topic-speaker-${topic.id}`}
                  value={topic.speakerId}
                  onChange={(event) => onTopicChange(topic.id, 'speakerId', event.target.value)}
                >
                  <option value="">请选择讲者</option>
                  {speakers.map((speaker, speakerIndex) => (
                    <option key={speaker.id} value={speaker.id}>
                      {getParticipantDisplay(speaker, speakerIndex, '讲者')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor={`topic-duration-${topic.id}`}>时长</label>
                <input
                  id={`topic-duration-${topic.id}`}
                  type="text"
                  placeholder="例如：20 分钟"
                  value={topic.duration}
                  onChange={(event) => onTopicChange(topic.id, 'duration', event.target.value)}
                />
              </div>

              <div className="field field--full">
                <label htmlFor={`topic-intro-${topic.id}`}>讲题简介</label>
                <textarea
                  id={`topic-intro-${topic.id}`}
                  placeholder="可填写讲题背景、重点问题或案例摘要。"
                  value={topic.intro}
                  onChange={(event) => onTopicChange(topic.id, 'intro', event.target.value)}
                />
              </div>

              <div className="field field--full">
                <label htmlFor={`topic-note-${topic.id}`}>备注</label>
                <textarea
                  id={`topic-note-${topic.id}`}
                  placeholder="可记录材料准备、时间安排或讲题特殊需求。"
                  value={topic.note}
                  onChange={(event) => onTopicChange(topic.id, 'note', event.target.value)}
                />
              </div>
            </div>

            <div className="field">
              <label>相关讨论嘉宾</label>
              <div className="checkbox-grid">
                {panelists.map((panelist, panelistIndex) => (
                  <label className="checkbox-card" key={panelist.id}>
                    <input
                      type="checkbox"
                      checked={topic.panelistIds.includes(panelist.id)}
                      onChange={() => onTogglePanelist(topic.id, panelist.id)}
                    />
                    <span>{getParticipantDisplay(panelist, panelistIndex, '讨论嘉宾')}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </article>
      ))}
    </section>
  )
}

export default TopicSection
