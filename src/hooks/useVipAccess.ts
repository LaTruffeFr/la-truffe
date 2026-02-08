import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function useVipAccess() {
  const { user, isAdmin, isVip: isVipRole } = useAuth();
  const [searchParams] = useSearchParams();

  const isVip = useMemo(() => {
    // Check URL parameter ?vip=true (for demo/testing)
    const vipParam = searchParams.get('vip');
    if (vipParam === 'true') {
      return true;
    }

    // Check if user has VIP or admin role from database
    if (isVipRole || isAdmin) {
      return true;
    }

    return false;
  }, [searchParams, isAdmin, isVipRole]);

  // VIP users have unlimited credits
  const hasUnlimitedCredits = isVip;

  return { isVip, hasUnlimitedCredits };
}
