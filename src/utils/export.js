import { ROLE_CONFIG } from '../data/config.js'
import { flattenParticipants, formatMeetingDateTime } from './meeting.js'

function buildFileName(meeting, suffix) {
  const raw = `${meeting.project}-${meeting.title || '未命名会议'}-${suffix}`
  return raw.replace(/[\\/:*?"<>|]/g, '-')
}

export async function exportMeetingToExcel(meeting) {
  const XLSX = await import('xlsx')
  const workbook = XLSX.utils.book_new()
  const summaryRows = [
    ['项目名称', '精准抗感染专项系列会议'],
    ['所属大区', meeting.region],
    ['所属省份', meeting.province],
    ['所属子项目', meeting.project],
    ['会议主题', meeting.title || '未填写'],
    ['会议日期', meeting.date || '未填写'],
    ['会议时间', meeting.time || '未填写'],
    ['会议状态', meeting.status || '草稿'],
    ['备注信息', meeting.note || ''],
    ['最后更新时间', new Date(meeting.updatedAt).toLocaleString('zh-CN')],
  ]

  const participantRows = flattenParticipants(meeting).map((person) => ({
    角色: person.roleLabel,
    序号: person.order,
    医院: person.hospital || '',
    姓名: person.name || '',
    科室: person.department || '',
    职称: person.title || '',
  }))

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows)
  const participantSheet = XLSX.utils.json_to_sheet(participantRows)

  summarySheet['!cols'] = [{ wch: 14 }, { wch: 42 }]
  participantSheet['!cols'] = [
    { wch: 12 },
    { wch: 8 },
    { wch: 32 },
    { wch: 14 },
    { wch: 26 },
    { wch: 20 },
  ]

  XLSX.utils.book_append_sheet(workbook, summarySheet, '会议概览')
  XLSX.utils.book_append_sheet(workbook, participantSheet, '参会人员')
  XLSX.writeFile(workbook, `${buildFileName(meeting, '会议资料')}.xlsx`)
}

export async function exportMeetingToPdf(meeting, element) {
  if (!element) {
    return
  }

  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ])

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
  })

  const imageData = canvas.toDataURL('image/png')
  const pdf = new jsPDF('p', 'pt', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 20
  const renderWidth = pageWidth - margin * 2
  const renderHeight = (canvas.height * renderWidth) / canvas.width

  let heightLeft = renderHeight
  let position = margin

  pdf.addImage(imageData, 'PNG', margin, position, renderWidth, renderHeight)
  heightLeft -= pageHeight - margin * 2

  while (heightLeft > 0) {
    position = heightLeft - renderHeight + margin
    pdf.addPage()
    pdf.addImage(imageData, 'PNG', margin, position, renderWidth, renderHeight)
    heightLeft -= pageHeight - margin * 2
  }

  pdf.save(`${buildFileName(meeting, '会议资料')}.pdf`)
}

export function printMeetingDocument(meeting, element) {
  if (!element) {
    return
  }

  const printWindow = window.open('', '_blank', 'noopener,noreferrer')
  if (!printWindow) {
    return
  }

  printWindow.document.write(`
    <html lang="zh-CN">
      <head>
        <title>${buildFileName(meeting, '打印')}</title>
        <style>
          body {
            margin: 0;
            padding: 24px;
            font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
            color: #1f3147;
            background: #ffffff;
          }
          .preview-document {
            border: 1px solid #dce6ef;
            border-radius: 8px;
            overflow: hidden;
          }
          .preview-document__hero {
            padding: 24px;
            background: #f3f8fc;
            border-bottom: 1px solid #dce6ef;
          }
          .preview-document__body {
            padding: 20px;
          }
          .detail-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
            margin-bottom: 20px;
          }
          .detail-card {
            border: 1px solid #dce6ef;
            border-radius: 8px;
            padding: 14px;
          }
          .detail-card span {
            display: block;
            font-size: 12px;
            color: #64788f;
            margin-bottom: 8px;
          }
          .participant-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 18px;
            font-size: 13px;
          }
          .participant-table th,
          .participant-table td {
            border: 1px solid #dce6ef;
            padding: 8px;
            text-align: left;
            vertical-align: top;
          }
          .participant-table thead {
            background: #f4f8fb;
          }
          .tag {
            display: inline-block;
            padding: 4px 8px;
            background: #eef5fb;
            border-radius: 999px;
            color: #0f5d95;
            font-size: 12px;
          }
          h2, h3, h4, p { margin-top: 0; }
        </style>
      </head>
      <body>
        ${element.outerHTML}
      </body>
    </html>
  `)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 300)
}

export function buildRoleSummary(meeting) {
  return ROLE_CONFIG.map((role) => {
    const participants = meeting.attendees?.[role.key] || []
    const filled = participants.filter(
      (person) => person.hospital || person.name || person.department || person.title,
    ).length

    return {
      ...role,
      filled,
      total: participants.length,
    }
  })
}

export function buildSearchIndex(meeting) {
  const participantText = flattenParticipants(meeting)
    .map((person) =>
      [person.hospital, person.name, person.department, person.title].join(' '),
    )
    .join(' ')

  return [
    meeting.title,
    meeting.project,
    meeting.region,
    meeting.province,
    meeting.note,
    formatMeetingDateTime(meeting),
    participantText,
  ]
    .join(' ')
    .toLowerCase()
}
