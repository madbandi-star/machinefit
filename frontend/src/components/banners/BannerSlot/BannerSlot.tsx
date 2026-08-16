import { AdSlot } from '@/ads/AdSlot';
import type { BannerSlotKey } from '@machinefit/shared';
import { BANNER_SLOT_TO_AD_PLACEMENT } from '@machinefit/shared';

interface BannerSlotProps {
  slot: BannerSlotKey;
  maxVisible?: number;
  className?: string;
}

/**
 * Page-bottom CMS promo slot — delegates to the unified AdSlot / policy engine.
 * Falls back to legacy public banner API when ad tables are not migrated yet.
 */
export function BannerSlot({ slot, maxVisible = 1, className }: BannerSlotProps) {
  const placement = BANNER_SLOT_TO_AD_PLACEMENT[slot] ?? slot;
  return (
    <AdSlot
      placement={placement}
      event="PAGE_VIEW"
      maxVisible={maxVisible}
      className={className}
    />
  );
}
