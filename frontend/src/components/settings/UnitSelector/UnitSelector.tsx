import { useSettingsStore } from '@/store/settings.store';

export function UnitSelector() {
  const unitHeight = useSettingsStore((s) => s.unitHeight);
  const unitWeight = useSettingsStore((s) => s.unitWeight);
  const setUnitHeight = useSettingsStore((s) => s.setUnitHeight);
  const setUnitWeight = useSettingsStore((s) => s.setUnitWeight);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <label>
        Height Unit
        <select
          className="input"
          value={unitHeight}
          onChange={(e) => setUnitHeight(e.target.value as 'cm' | 'ft_in')}
        >
          <option value="cm">cm</option>
          <option value="ft_in">ft/in</option>
        </select>
      </label>
      <label>
        Weight Unit
        <select
          className="input"
          value={unitWeight}
          onChange={(e) => setUnitWeight(e.target.value as 'kg' | 'lb')}
        >
          <option value="kg">kg</option>
          <option value="lb">lb</option>
        </select>
      </label>
    </div>
  );
}
