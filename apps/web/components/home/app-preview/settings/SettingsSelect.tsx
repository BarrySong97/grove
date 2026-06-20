interface Option<T extends string> {
  value: T
  label: string
}

export function SettingsSelect<T extends string>({
  value,
  options,
  ariaLabel,
  onChange,
}: {
  value: T
  options: ReadonlyArray<Option<T>>
  ariaLabel: string
  onChange: (value: T) => void
}) {
  return (
    <select
      aria-label={ariaLabel}
      className="grove-field-thin-focus grove-settings-field min-w-0 flex-1 appearance-auto border-0 font-medium"
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
