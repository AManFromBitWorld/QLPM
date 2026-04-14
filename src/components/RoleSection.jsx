import { MinusCircle, PlusCircle } from 'lucide-react'
import { PERSON_FIELDS } from '../data/config.js'
import { getRoleParticipantCount } from '../utils/meeting.js'

function RoleSection({
  role,
  participants,
  onAddParticipant,
  onChangeParticipant,
  onRemoveParticipant,
}) {
  const filledCount = getRoleParticipantCount(participants)

  return (
    <section className="role-section">
      <div className="role-section__header">
        <div>
          <h3>{role.label}</h3>
          <p>
            默认 {role.minimum} 人，当前 {participants.length} 个席位，已填写 {filledCount} 位。
          </p>
          <span className="helper-text">{role.description}</span>
        </div>
        <button
          type="button"
          className="button button--ghost"
          onClick={() => onAddParticipant(role.key)}
        >
          <PlusCircle size={16} />
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
                  className="button button--secondary"
                  onClick={() => onRemoveParticipant(role.key, person.id)}
                  disabled={!removable}
                >
                  <MinusCircle size={16} />
                  删除
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
