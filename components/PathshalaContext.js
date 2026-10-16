'use client';

import { createContext, useContext } from 'react';

// The pathshala this page belongs to: { slug, name, sanghName }
const PathshalaContext = createContext({ slug: '', name: '', sanghName: '' });

export const PathshalaProvider = PathshalaContext.Provider;

// Kept after logout so an admin with several pathshalas lands back in the one they used last
export const LAST_ADMIN_PATHSHALA_KEY = 'jainPathshalaLastAdminPathshala';

export function usePathshala() {
  return useContext(PathshalaContext);
}
