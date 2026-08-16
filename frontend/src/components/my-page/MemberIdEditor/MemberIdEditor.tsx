import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
  USERNAME_MAX_CHANGES,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  normalizeUsername,
  validateUsername,
} from '@machinefit/shared';
import { userApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';

type MemberIdEditorProps = {
  displayName: string;
  usernameChangeCount?: number;
};

function mapUsernameError(code: string | undefined, fallback: string): string {
  switch (code) {
    case 'USERNAME_TAKEN':
      return 'myPage.memberIdTaken';
    case 'USERNAME_TOO_SHORT':
    case 'USERNAME_EMPTY':
      return 'auth.displayNameMin';
    case 'USERNAME_TOO_LONG':
      return 'myPage.memberIdTooLong';
    case 'USERNAME_HAS_SPACE':
    case 'USERNAME_INVALID_CHARS':
      return 'myPage.memberIdInvalidChars';
    case 'USERNAME_REAL_NAME_LIKE':
      return 'myPage.memberIdRealName';
    case 'USERNAME_PHONE_LIKE':
    case 'USERNAME_EMAIL_LIKE':
      return 'myPage.memberIdPersonalInfo';
    case 'USERNAME_PROFANITY':
    case 'USERNAME_IMPERSONATION':
    case 'USERNAME_RESERVED':
      return 'myPage.memberIdForbidden';
    case 'USERNAME_CHANGE_LIMIT':
      return 'myPage.memberIdChangeLimit';
    default:
      return fallback;
  }
}

export function MemberIdEditor({
  displayName,
  usernameChangeCount = 0,
}: MemberIdEditorProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);
  const showToast = useUIStore((s) => s.showToast);
  const inputRef = useRef<HTMLInputElement>(null);

  const used = Math.max(0, Math.min(USERNAME_MAX_CHANGES, usernameChangeCount));
  const remaining = Math.max(0, USERNAME_MAX_CHANGES - used);
  const canChange = remaining > 0;

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
    onError: (error) => {
      const payload = axios.isAxiosError(error)
        ? (error.response?.data as { error?: { code?: string; message?: string } } | undefined)
        : undefined;
      const key = mapUsernameError(payload?.error?.code, 'errors.submitFailed');
      showToast(t(key, { max: USERNAME_MAX_CHANGES }), 'error');
    },
  });

  const openEditor = () => {
    if (!canChange) {
      showToast(t('myPage.memberIdChangeLimit', { max: USERNAME_MAX_CHANGES }), 'error');
      return;
    }
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
    if (!canChange) {
      showToast(t('myPage.memberIdChangeLimit', { max: USERNAME_MAX_CHANGES }), 'error');
      return;
    }
    // Legacy usernames may predate stricter rules — unchanged values stay as-is.
    if (normalizeUsername(draft) === normalizeUsername(displayName)) {
      setEditing(false);
      setDraft(displayName);
      return;
    }
    const validated = validateUsername(draft);
    if (!validated.ok) {
      const key = mapUsernameError(`USERNAME_${validated.code}`, 'errors.submitFailed');
      showToast(t(key), 'error');
      inputRef.current?.focus();
      return;
    }
    mutation.mutate(validated.normalized);
  };

  if (!editing) {
    return (
      <dd className="profile-card__member-id">
        <span className="profile-card__member-id-value">{displayName || '—'}</span>
        {displayName ? (
          canChange ? (
            <>
              <button
                type="button"
                className="profile-card__member-id-change"
                onClick={openEditor}
                aria-label={t('myPage.changeMemberIdAria')}
              >
                {t('myPage.changeMemberId')}
              </button>
              <span className="profile-card__member-id-remaining">
                {t('myPage.memberIdChangesRemaining', {
                  remaining,
                  max: USERNAME_MAX_CHANGES,
                })}
              </span>
            </>
          ) : (
            <span className="profile-card__member-id-limit" role="status">
              {t('myPage.memberIdChangeExhausted', { max: USERNAME_MAX_CHANGES })}
            </span>
          )
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
        maxLength={USERNAME_MAX_LENGTH}
        autoComplete="off"
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
      <p className="profile-card__member-id-rules">
        {t('myPage.memberIdRules', { min: USERNAME_MIN_LENGTH, max: USERNAME_MAX_LENGTH })}
      </p>
      <p className="profile-card__member-id-remaining">
        {t('myPage.memberIdChangesRemaining', {
          remaining,
          max: USERNAME_MAX_CHANGES,
        })}
      </p>
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
