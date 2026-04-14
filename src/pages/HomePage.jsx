import { Link } from 'react-router-dom'
import { CalendarDays, Files } from 'lucide-react'
import { PROJECT_NAME, REGIONS, ROLE_CONFIG, SUBPROJECTS } from '../data/config.js'
import { getFilledParticipantCount } from '../utils/meeting.js'

function HomePage({ meetings }) {
  const totalParticipants = meetings.reduce(
    (count, meeting) => count + getFilledParticipantCount(meeting),
    0,
  )

  const projectSummary = SUBPROJECTS.map((project) => ({
    ...project,
    count: meetings.filter((meeting) => meeting.project === project.value).length,
  }))

  const regionSummary = REGIONS.map((region) => ({
    region,
    count: meetings.filter((meeting) => meeting.region === region).length,
  }))

  return (
    <div className="page-content">
      <section className="section-card home-hero">
        <div className="home-hero__content">
          <div className="home-hero__main">
            <div>
              <span className="tag">{PROJECT_NAME}</span>
              <h2 className="home-hero__headline">
                让线上会议筹备从信息收集开始就标准、清晰、可复用
              </h2>
              <p className="home-hero__text">
                以固定角色框架承接每场会议的嘉宾统筹，同时保留灵活扩展能力，支持会前准备、执行联动、资料归档与导出打印。
              </p>
            </div>

            <div className="button-row">
              <Link className="button button--primary" to="/meetings/new">
                <CalendarDays size={18} />
                新建会议
              </Link>
              <Link className="button button--secondary" to="/meetings">
                <Files size={18} />
                查看历史会议
              </Link>
            </div>
          </div>

          <aside className="home-hero__aside">
            <div className="home-hero__aside-card">
              <strong>标准角色框架</strong>
              <p>
                主席 1 人、主持 2 人、讲者 3 人、讨论嘉宾 6 人，支持动态增减席位。
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section className="section-card form-panel">
        <div className="page-header">
          <div>
            <h2>项目概览</h2>
            <p>三个子项目共享统一的信息结构，便于不同类型会议快速复用。</p>
          </div>
          <span className="tag">固定结构 + 灵活调整</span>
        </div>

        <div className="metrics-grid">
          <article className="metric-card">
            <strong>{meetings.length}</strong>
            <span>累计会议记录</span>
          </article>
          <article className="metric-card">
            <strong>{totalParticipants}</strong>
            <span>累计录入嘉宾</span>
          </article>
          <article className="metric-card">
            <strong>{ROLE_CONFIG.reduce((count, role) => count + role.minimum, 0)}</strong>
            <span>默认席位基线</span>
          </article>
          <article className="metric-card">
            <strong>{SUBPROJECTS.length}</strong>
            <span>子项目数量</span>
          </article>
        </div>
      </section>

      <section className="section-card form-panel">
        <div className="page-header">
          <div>
            <h2>子项目入口</h2>
            <p>不同学术场景可直接沿用统一模板，缩短每场会议的建档时间。</p>
          </div>
        </div>

        <div className="project-grid">
          {projectSummary.map((project) => (
            <article
              className="project-card"
              key={project.value}
              style={{ backgroundImage: `url(${project.cover})` }}
            >
              <div className="project-card__body">
                <span className="tag">{project.count} 场会议</span>
                <h3>{project.value}</h3>
                <p>{project.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section-card form-panel">
        <div className="page-header">
          <div>
            <h2>大区管理</h2>
            <p>按东区、西区、北区、南区管理会议，便于区域统筹、分类查看和导出归档。</p>
          </div>
        </div>

        <div className="summary-grid">
          {regionSummary.map((item) => (
            <article className="summary-card" key={item.region}>
              <strong>{item.region}</strong>
              <span>{item.count} 场会议</span>
            </article>
          ))}
        </div>
      </section>

      <section className="section-card form-panel">
        <div className="page-header">
          <div>
            <h2>核心能力</h2>
            <p>围绕医学学术会议的执行链路，将录入、确认、输出和复用放在同一系统中。</p>
          </div>
        </div>

        <div className="summary-grid">
          <article className="summary-card">
            <strong>结构化收集</strong>
            <span>按角色分区录入医院、姓名、科室、职称，减少遗漏和格式不统一。</span>
          </article>
          <article className="summary-card">
            <strong>讲题动态配置</strong>
            <span>每场会议支持 2 至 4 个讲题模块，单独维护主题、讲者和讨论嘉宾。</span>
          </article>
          <article className="summary-card">
            <strong>会前预览</strong>
            <span>提交前统一校对整场会议信息，支持返回编辑，适合执行团队复核。</span>
          </article>
          <article className="summary-card">
            <strong>导出归档</strong>
            <span>支持 Excel、PDF 和打印输出，便于资料整理、共享和留档。</span>
          </article>
        </div>
      </section>
    </div>
  )
}

export default HomePage
