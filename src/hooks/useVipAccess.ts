import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

// Email admin qui a accès VIP
const VIP_ADMIN_EMAIL = 'latruffe.consulting@gmail.com';

export function useVipAccess() {
  const { user, userEmail, isAdmin } = useAuth();
  const [searchParams] = useSearchParams();

  const isVip = useMemo(() => {
    // Check URL parameter ?vip=true
    const vipParam = searchParams.get('vip');
    if (vipParam === 'true') {
      return true;
    }

    // Check if user is admin or has VIP email
    if (isAdmin) {
      return true;
    }

    // Check specific VIP email
    const email = userEmail || user?.email;
    if (email === VIP_ADMIN_EMAIL) {
      return true;
    }

    return false;
  }, [searchParams, isAdmin, userEmail, user?.email]);

  return { isVip };
}
