import { Plus, X } from 'lucide-react'
import { PERSON_FIELDS } from '../data/config.js'
import {
  getRoleClaimLabel,
  getRoleParticipantCount,
  getRoleStatus,
  isRoleClaimActive,
} from '../utils/meeting.js'

function RoleSection({
  role,
  participants,
  collaborationMeta,
  roleClaim,
  currentSessionId,
  onActivateRole,
  onAddParticipant,
  onChangeParticipant,
  onRemoveParticipant,
  sectionId,
}) {
  const filledCount = getRoleParticipantCount(participants)
  const roleStatus = getRoleStatus(participants)
  const claimLabel = getRoleClaimLabel(roleClaim, currentSessionId)
  const lockedByOther =
    isRoleClaimActive(roleClaim) &&
    roleClaim?.sessionId &&
    roleClaim.sessionId !== currentSessionId

  return (
    <section className="role-section" id={sectionId}>
      <div className="role-section__header">
        <div>
          <h3>{role.label}</h3>
          <p>
            默认 {role.minimum} 人，当前 {participants.length} 个席位，已填写 {filledCount} 位。
          </p>
          <div className="role-section__meta-row">
            <span className="helper-text">{role.description}</span>
            <span className="role-section__status">{roleStatus}</span>
            {claimLabel ? <span className="role-section__claim">{claimLabel}</span> : null}
            {collaborationMeta?.updatedBy ? (
              <span className="helper-text">
                最近更新：{collaborationMeta.updatedBy}
              </span>
            ) : null}
          </div>
          {lockedByOther ? (
            <div className="role-section__lock-note">{claimLabel}，当前已锁定，避免互相覆盖。</div>
          ) : null}
        </div>
        <button
          type="button"
          className="role-section__action"
          onClick={() => onAddParticipant(role.key)}
          disabled={lockedByOther}
        >
          <Plus size={14} />
          新增席位
        </button>
      </div>

      <div className="role-section__slots">
        {participants.map((person, index) => {
          const removable = participants.length > role.minimum
          const isExtension = index + 1 > role.minimum

          return (
            <article className="person-card" key={person.id}>
              <div className="person-card__top">
                <div>
                  <strong>
                    {role.label} {index + 1}
                  </strong>
                  <div className="person-card__meta">
                    {isExtension ? '扩展席位' : '标准席位'}
                  </div>
                </div>
                <button
                  type="button"
                  className="person-card__remove"
                  onClick={() => onRemoveParticipant(role.key, person.id)}
                  disabled={!removable || lockedByOther}
                  aria-label={`删除${role.label}${index + 1}`}
                  title={
                    lockedByOther
                      ? claimLabel
                      : removable
                        ? '删除席位'
                        : '标准席位不可删除'
                  }
                >
                  <X size={14} />
                </button>
              </div>

              <div className="person-card__grid">
                {PERSON_FIELDS.map((field) => (
                  <div className="field" key={field.key}>
                    <label htmlFor={`${role.key}-${person.id}-${field.key}`}>
                      {field.label}
                    </label>
                    <input
                      id={`${role.key}-${person.id}-${field.key}`}
                      type="text"
                      placeholder={field.placeholder}
                      value={person[field.key]}
                      disabled={lockedByOther}
                      onFocus={() => onActivateRole(role.key)}
                      onChange={(event) =>
                        onChangeParticipant(role.key, person.id, field.key, event.target.value)
                      }
                    />
                  </div>
                ))}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default RoleSection
