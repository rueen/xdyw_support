/**
 * 病例状态枚举与展示配置
 */
export const RECORD_STATUS = {
  pending_review: { label: '待医生判读', color: 'blue' },
  suitable: { label: '符合用药', color: 'green' },
  unsuitable: { label: '不符合用药', color: 'red' },
  incomplete: { label: '资料不全', color: 'orange' },
  pending_follow_up: { label: '待复诊', color: 'purple' },
  completed: { label: '已完诊', color: 'default' }
}

/**
 * 付费状态枚举与展示配置
 */
export const PAYMENT_STATUS = {
  pending_payment: { label: '待付费', color: 'gold' },
  paid: { label: '已付费', color: 'green' },
  refunded: { label: '已退费', color: 'red' }
}

/** 操作日志类型文字映射 */
export const OPERATION_LABELS = {
  create: '创建病例',
  update: '修改病例信息',
  review_suitable: '医生判读：符合用药',
  review_unsuitable: '医生判读：不符合用药',
  review_incomplete: '医生判读：资料不全',
  supplement: '业务员补充资料',
  visited: '业务员操作：已就诊',
  follow_up: '业务员操作：已复诊',
  complete: '标记：已完诊',
  pay: '标记：已付费',
  refund: '标记：已退费'
}
