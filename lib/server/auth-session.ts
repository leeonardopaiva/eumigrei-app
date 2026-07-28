import 'server-only';

import { cache } from 'react';
import { getServerAuthSession } from '@/lib/auth';

export const getCachedServerAuthSession = cache(getServerAuthSession);
