import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Copy, FileDown, Pencil, Printer, Trash2 } from 'lucide-react'
import MeetingPreview from '../components/MeetingPreview.jsx'
import { buildRoleSummary, exportMeetingToExcel, exportMeetingToPdf, printMeetingDocument } from '../utils/export.js'

function MeetingDetailPage({ meetings, onDeleteMeeting, onDuplicateMeeting }) {
  const { meetingId } = useParams()
  const navigate = useNavigate()
  const previewRef = useRef(null)
  const [exportingPdf, setExportingPdf] = useState(false)

  const meeting = useMemo(
    () => meetings.find((item) => item.id === meetingId),
    [meetingId, meetings],
  )

  if (!meeting) {
    return (
      <section className="section-card empty-state">
        <strong>未找到会议记录</strong>
        <div>这条记录可能已被删除，或链接已失效。</div>
        <div className="button-row" style={{ justifyContent: 'center', marginTop: 20 }}>
          <Link className="button button--secondary" to="/meetings">
            返回会议列表
          </Link>
        </div>
      </section>
    )
  }

  const roleSummary = buildRoleSummary(meeting)

  const handleDuplicate = () => {
    const copiedMeeting = onDuplicateMeeting(meeting.id)
    if (copiedMeeting) {
      navigate(`/meetings/${copiedMeeting.id}/edit`)
    }
  }

  const handleDelete = () => {
    const shouldDelete = window.confirm('确定删除这场会议记录吗？')
    if (!shouldDelete) {
      return
    }

    onDeleteMeeting(meeting.id)
    navigate('/meetings')
  }

  const handleExportPdf = async () => {
    setExportingPdf(true)
    try {
      await exportMeetingToPdf(meeting, previewRef.current)
    } finally {
      setExportingPdf(false)
    }
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <span className="tag">会议详情</span>
          <h2>{meeting.title || '未命名会议'}</h2>
          <p>可用于查看完整资料、导出文件、复制会议模板或继续编辑。</p>
        </div>
        <div className="button-row">
          <Link className="button button--secondary" to={`/meetings/${meeting.id}/edit`}>
            <Pencil size={16} />
            编辑会议
          </Link>
          <button className="button button--ghost" type="button" onClick={handleDuplicate}>
            <Copy size={16} />
            复制会议
          </button>
          <button className="button button--danger" type="button" onClick={handleDelete}>
            <Trash2 size={16} />
            删除
          </button>
        </div>
      </div>

      <section className="section-card detail-panel">
        <div className="summary-grid">
          <article className="summary-card">
            <strong>{meeting.region}</strong>
            <span>所属大区</span>
          </article>
          <article className="summary-card">
            <strong>{meeting.province}</strong>
            <span>所属省份</span>
          </article>
          <article className="summary-card">
            <strong>{meeting.project}</strong>
            <span>所属子项目</span>
          </article>
          <article className="summary-card">
            <strong>{meeting.status}</strong>
            <span>会议状态</span>
          </article>
          <article className="summary-card">
            <strong>
              {roleSummary.reduce((count, role) => count + role.filled, 0)} /{' '}
              {roleSummary.reduce((count, role) => count + role.total, 0)}
            </strong>
            <span>已填写席位</span>
          </article>
        </div>

        <div className="button-row" style={{ marginBottom: 20 }}>
          <button
            type="button"
            className="button button--secondary"
            onClick={() => exportMeetingToExcel(meeting)}
          >
            <FileDown size={16} />
            导出 Excel
          </button>
          <button
            type="button"
            className="button button--secondary"
            onClick={handleExportPdf}
            disabled={exportingPdf}
          >
            <FileDown size={16} />
            {exportingPdf ? '导出中...' : '导出 PDF'}
          </button>
          <button
            type="button"
            className="button button--secondary"
            onClick={() => printMeetingDocument(meeting, previewRef.current)}
          >
            <Printer size={16} />
            打印页面
          </button>
        </div>

        <MeetingPreview meeting={meeting} previewRef={previewRef} />
      </section>
    </div>
  )
}

export default MeetingDetailPage
