export function MerchantAutocomplete({
  value,
  onChange,
  merchants,
}: {
  value: string
  onChange: (v: string) => void
  merchants: { id: string; name: string }[]
}) {
  return (
    <label className="mb-3 block text-sm">
      <span className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Merchant</span>
      <input
        list="merchant-suggestions"
        type="text"
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      />
      <datalist id="merchant-suggestions">
        {merchants.map((m) => (
          <option key={m.id} value={m.name} />
        ))}
      </datalist>
    </label>
  )
}
