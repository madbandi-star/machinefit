import { splitGuideBlocks } from '@/utils/splitGuideBlocks';
import './GuideProse.css';

type GuideProseVariant = 'body' | 'lead' | 'muted' | 'compact' | 'dialog' | 'subtitle';

interface GuideProseProps {
  text: string;
  className?: string;
  variant?: GuideProseVariant;
}

export function GuideProse({ text, className, variant = 'body' }: GuideProseProps) {
  const blocks = splitGuideBlocks(text);
  if (blocks.length === 0) return null;

  return (
    <div className={['guide-prose', `guide-prose--${variant}`, className].filter(Boolean).join(' ')}>
      {blocks.map((block, index) => {
        if (block.type === 'list') {
          return (
            <ul key={index} className="guide-prose__list">
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          );
        }
        if (block.type === 'note') {
          return (
            <p key={index} className="guide-prose__note" role="note">
              {block.text}
            </p>
          );
        }
        return <p key={index}>{block.text}</p>;
      })}
    </div>
  );
}
