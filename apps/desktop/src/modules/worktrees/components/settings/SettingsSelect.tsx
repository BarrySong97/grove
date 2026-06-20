/**
 * @purpose Renders the shared compact native select used across settings rows.
 * @role    Control primitive wrapping a styled <select> with typed options.
 * @deps    React generics (string union value)
 * @gotcha  Keeps grove-settings-field/grove-field-thin-focus CSS for hover/focus states.
 */
interface SettingsSelectOption<T extends string> {
  value: T
  label: string
}

interface SettingsSelectProps<T extends string> {
  value: T
  options: ReadonlyArray<SettingsSelectOption<T>>
  ariaLabel: string
  disabled?: boolean
  onChange: (value: T) => void
}

export function SettingsSelect<T extends string>({
  value,
  options,
  ariaLabel,
  disabled,
  onChange
}: SettingsSelectProps<T>) {
  return (
    <select
      aria-label={ariaLabel}
      className="grove-field-thin-focus grove-settings-field min-w-0 flex-1 appearance-auto border-0 font-medium"
      disabled={disabled}
      value={value}
      onChange={(event) => onChange(event.target.value as T)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
