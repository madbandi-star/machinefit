import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './RichTextEditor.css';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  onImageSelect?: (file: File) => void | Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

function exec(command: string, value?: string) {
  document.execCommand(command, false, value);
}

export function RichTextEditor({
  value,
  onChange,
  onImageSelect,
  disabled = false,
  placeholder,
}: RichTextEditorProps) {
  const { t } = useTranslation('admin');
  const ref = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.innerHTML !== value) {
      el.innerHTML = value || '';
    }
  }, [value]);

  const emit = () => {
    onChange(ref.current?.innerHTML ?? '');
  };

  return (
    <div className={`notice-rte${disabled ? ' notice-rte--disabled' : ''}`}>
      <div className="notice-rte__toolbar" role="toolbar" aria-label={t('notices.editorToolbar')}>
        <button type="button" disabled={disabled} onClick={() => { exec('bold'); emit(); }}>
          <strong>B</strong>
        </button>
        <button type="button" disabled={disabled} onClick={() => { exec('italic'); emit(); }}>
          <em>I</em>
        </button>
        <button type="button" disabled={disabled} onClick={() => { exec('underline'); emit(); }}>
          <u>U</u>
        </button>
        <button type="button" disabled={disabled} onClick={() => { exec('formatBlock', 'h2'); emit(); }}>
          H2
        </button>
        <button type="button" disabled={disabled} onClick={() => { exec('insertUnorderedList'); emit(); }}>
          •
        </button>
        <button type="button" disabled={disabled} onClick={() => { exec('insertOrderedList'); emit(); }}>
          1.
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            const url = window.prompt(t('notices.linkPrompt'));
            if (url) {
              exec('createLink', url);
              emit();
            }
          }}
        >
          Link
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            exec(
              'insertHTML',
              '<table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td></td><td></td></tr></tbody></table>'
            );
            emit();
          }}
        >
          Table
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            exec('insertHTML', '<pre><code>code</code></pre>');
            emit();
          }}
        >
          Code
        </button>
        {onImageSelect ? (
          <>
            <button
              type="button"
              disabled={disabled}
              onClick={() => fileRef.current?.click()}
            >
              Image
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) void onImageSelect(file);
              }}
            />
          </>
        ) : null}
      </div>
      <div
        ref={ref}
        className="notice-rte__editor"
        contentEditable={!disabled}
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        onInput={emit}
        onBlur={emit}
        suppressContentEditableWarning
      />
    </div>
  );
}
