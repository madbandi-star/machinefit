import { BannerSlot } from '@/components/banners/BannerSlot/BannerSlot';
import '@/styles/banners.css';
import '@/styles/community.css';

/** CMS promo at the bottom of community hub / board list screens. */
export function CommunityBottomBanner() {
  return <BannerSlot slot="COMMUNITY_BOTTOM" className="community-bottom-banner" />;
}
