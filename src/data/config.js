export const PROJECT_NAME = '精准抗感染专项系列会议'

export const SUBPROJECTS = [
  {
    value: '焦点对话',
    description: '聚焦临床热点与诊疗决策，适合重点议题研讨与经验交流。',
    cover:
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80',
  },
  {
    value: 'MDT大师班',
    description: '围绕多学科协作和病例研判，支持复杂病例的结构化筹备。',
    cover:
      'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1200&q=80',
  },
  {
    value: '科研解码',
    description: '聚焦研究进展、数据解读和学术传播，便于科研型会议管理。',
    cover:
      'https://images.unsplash.com/photo-1532187643603-ba119ca4109e?auto=format&fit=crop&w=1200&q=80',
  },
]

export const REGIONS = ['东区', '西区', '北区', '南区']

export const REGION_PROVINCES = {
  东区: ['上海', '江苏', '浙江', '安徽', '福建', '江西', '山东'],
  西区: ['重庆', '四川', '贵州', '云南', '西藏', '陕西', '甘肃', '青海', '宁夏', '新疆'],
  北区: ['北京', '天津', '河北', '山西', '内蒙古', '辽宁', '吉林', '黑龙江', '河南'],
  南区: ['广东', '广西', '海南', '湖南', '湖北'],
}

export const ROLE_CONFIG = [
  {
    key: 'chair',
    label: '主席',
    minimum: 1,
    description: '会议总控与核心学术把关。',
  },
  {
    key: 'host',
    label: '主持',
    minimum: 2,
    description: '负责现场节奏、嘉宾串联与议程推进。',
  },
  {
    key: 'speaker',
    label: '讲者',
    minimum: 3,
    description: '负责主题分享、病例讲解与数据呈现。',
  },
  {
    key: 'panelist',
    label: '讨论嘉宾',
    minimum: 6,
    description: '参与病例讨论、观点交锋与问题回应。',
  },
]

export const PERSON_FIELDS = [
  { key: 'hospital', label: '医院', placeholder: '例如：上海交通大学医学院附属瑞金医院' },
  { key: 'name', label: '姓名', placeholder: '请输入专家姓名' },
  { key: 'department', label: '科室', placeholder: '例如：感染科 / 呼吸与危重症医学科' },
  { key: 'title', label: '职称', placeholder: '例如：主任医师 / 教授' },
]

export const STEP_ITEMS = [
  { key: 'base', label: '基础信息', description: '填写会议主题、时间、大区、省份和所属项目。' },
  { key: 'guests', label: '人员录入', description: '按角色录入医院、姓名、科室、职称。' },
  { key: 'preview', label: '预览确认', description: '提交前统一核对，便于导出归档。' },
]
