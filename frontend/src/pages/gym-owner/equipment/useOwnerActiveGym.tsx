import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ownerApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';

const STORAGE_KEY = 'mf.inspection.activeGymId';

export function useOwnerActiveGym() {
  const { data: gyms = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.ownerGyms,
    queryFn: async () => {
      const res = await ownerApi.listGyms();
      return res.data.data;
    },
  });

  const [gymId, setGymId] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) ?? '';
    } catch {
      return '';
    }
  });

  useEffect(() => {
    if (!gyms.length) return;
    if (gymId && gyms.some((g) => g.id === gymId)) return;
    const next = gyms[0]?.id ?? '';
    setGymId(next);
  }, [gyms, gymId]);

  useEffect(() => {
    if (!gymId) return;
    try {
      localStorage.setItem(STORAGE_KEY, gymId);
    } catch {
      /* ignore */
    }
  }, [gymId]);

  const activeGym = useMemo(() => gyms.find((g) => g.id === gymId) ?? null, [gyms, gymId]);

  return { gyms, gymId, setGymId, activeGym, isLoading };
}

export function OwnerGymPicker({
  gyms,
  gymId,
  onChange,
}: {
  gyms: Array<{ id: string; name: string }>;
  gymId: string;
  onChange: (id: string) => void;
}) {
  if (!gyms.length) return null;
  return (
    <div className="inspection-gym-select">
      <label htmlFor="inspection-gym">헬스장</label>
      <select
        id="inspection-gym"
        value={gymId}
        onChange={(e) => onChange(e.target.value)}
      >
        {gyms.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
      </select>
    </div>
  );
}
