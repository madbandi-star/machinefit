import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { userApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';

const DISPLAY_NAME_MIN = 2;
const DISPLAY_NAME_MAX = 100;

function normalizeDisplayName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

type MemberIdEditorProps = {
  displayName: string;
};

export function MemberIdEditor({ displayName }: MemberIdEditorProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);
  const showToast = useUIStore((s) => s.showToast);
  const inputRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(displayName);

  useEffect(() => {
    if (editing) return;
    setDraft(displayName);
  }, [displayName, editing]);

  useEffect(() => {
    if (!editing) return;
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    el.select();
  }, [editing]);

  const mutation = useMutation({
    mutationFn: async (nextName: string) => {
      const res = await userApi.updateMe({ displayName: nextName });
      return res.data.data;
    },
    onSuccess: (user) => {
      updateUser(user);
      queryClient.setQueryData(QUERY_KEYS.me, user);
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.me });
      setEditing(false);
      setDraft(user.displayName);
      showToast(t('myPage.memberIdChanged'), 'success');
    },
    onError: () => {
      showToast(t('errors.submitFailed'), 'error');
    },
  });

  const openEditor = () => {
    setDraft(displayName);
    setEditing(true);
  };

  const cancelEdit = () => {
    if (mutation.isPending) return;
    setDraft(displayName);
    setEditing(false);
  };

  const saveEdit = () => {
    if (mutation.isPending) return;
    const next = normalizeDisplayName(draft);
    if (next.length < DISPLAY_NAME_MIN) {
      showToast(t('auth.displayNameMin'), 'error');
      inputRef.current?.focus();
      return;
    }
    if (next.length > DISPLAY_NAME_MAX) {
      showToast(t('myPage.memberIdTooLong'), 'error');
      inputRef.current?.focus();
      return;
    }
    if (next === normalizeDisplayName(displayName)) {
      setEditing(false);
      setDraft(displayName);
      return;
    }
    mutation.mutate(next);
  };

  if (!editing) {
    return (
      <dd className="profile-card__member-id">
        <span className="profile-card__member-id-value">{displayName || '—'}</span>
        {displayName ? (
          <button
            type="button"
            className="profile-card__member-id-change"
            onClick={openEditor}
            aria-label={t('myPage.changeMemberIdAria')}
          >
            {t('myPage.changeMemberId')}
          </button>
        ) : null}
      </dd>
    );
  }

  return (
    <dd className="profile-card__member-id profile-card__member-id--editing">
      <input
        ref={inputRef}
        className="input profile-card__member-id-input"
        type="text"
        value={draft}
        maxLength={DISPLAY_NAME_MAX}
        autoComplete="nickname"
        enterKeyHint="done"
        disabled={mutation.isPending}
        placeholder={t('myPage.memberIdPlaceholder')}
        aria-label={t('myPage.memberId')}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            saveEdit();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelEdit();
          }
        }}
      />
      <button
        type="button"
        className="profile-card__member-id-save"
        onClick={saveEdit}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? t('myPage.memberIdSaving') : t('myPage.saveMemberId')}
      </button>
      <button
        type="button"
        className="profile-card__member-id-cancel"
        onClick={cancelEdit}
        disabled={mutation.isPending}
      >
        {t('myPage.cancelMemberId')}
      </button>
    </dd>
  );
}
