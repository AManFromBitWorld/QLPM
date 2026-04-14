function cleanValue(value) {
  return value.replace(/^[：:;\s]+|[；;，,\s]+$/g, '').trim()
}

function isHospital(text) {
  return /(医院|医学院|附属|中心医院|人民医院|协和|诊所|health|clinic)/i.test(text)
}

function isDepartment(text) {
  return /(科|室|中心|病区|门诊|实验室|研究所)/.test(text)
}

function isTitle(text) {
  return /(主任|教授|医师|主治|研究员|副高|护士长|院长|博士生导师|硕士生导师)/.test(text)
}

function isName(text) {
  return /^[\u4e00-\u9fa5·]{2,8}$/.test(text)
}

function parseLabeledBlock(block) {
  const extract = (label) => {
    const match = block.match(new RegExp(`${label}[：:]\\s*([^\\n，,；;]+)`, 'i'))
    return match ? cleanValue(match[1]) : ''
  }

  const item = {
    hospital: extract('医院'),
    name: extract('姓名'),
    department: extract('科室'),
    title: extract('职称'),
  }

  return item.hospital || item.name || item.department || item.title ? item : null
}

function parseFreeTextLine(line) {
  const parts = line
    .split(/[，,；;｜|]/)
    .map((part) => cleanValue(part))
    .filter(Boolean)

  if (parts.length === 0) {
    return null
  }

  const item = {
    hospital: '',
    name: '',
    department: '',
    title: '',
  }

  const remaining = []

  parts.forEach((part) => {
    if (!item.hospital && isHospital(part)) {
      item.hospital = part
      return
    }

    if (!item.department && isDepartment(part)) {
      item.department = part
      return
    }

    if (!item.title && isTitle(part)) {
      item.title = part
      return
    }

    if (!item.name && isName(part)) {
      item.name = part
      return
    }

    remaining.push(part)
  })

  remaining.forEach((part) => {
    if (!item.name) {
      item.name = part
      return
    }

    if (!item.hospital) {
      item.hospital = part
      return
    }

    if (!item.department) {
      item.department = part
      return
    }

    if (!item.title) {
      item.title = part
    }
  })

  return item.hospital || item.name || item.department || item.title ? item : null
}

export function parseExpertText(text) {
  const normalized = text.replace(/\r/g, '').trim()
  if (!normalized) {
    return []
  }

  const hasLabels = /(姓名|医院|科室|职称)[：:]/.test(normalized)

  if (hasLabels) {
    return normalized
      .split(/\n\s*\n|(?=姓名[：:])/)
      .map((block) => block.trim())
      .filter(Boolean)
      .map(parseLabeledBlock)
      .filter(Boolean)
  }

  return normalized
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseFreeTextLine)
    .filter(Boolean)
}
