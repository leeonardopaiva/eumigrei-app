import type React from 'react';

export const DEFAULT_AVATAR_URL =
  'data:image/svg+xml,%3Csvg%20width%3D%22200%22%20height%3D%22200%22%20viewBox%3D%220%200%20200%20200%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Crect%20width%3D%22200%22%20height%3D%22200%22%20rx%3D%22100%22%20fill%3D%22%23E0F7FA%22/%3E%3Ccircle%20cx%3D%22100%22%20cy%3D%2276%22%20r%3D%2236%22%20fill%3D%22%2328B8C7%22/%3E%3Cpath%20d%3D%22M42%20170C48%20138%2072%20120%20100%20120C128%20120%20152%20138%20158%20170%22%20fill%3D%22%2328B8C7%22/%3E%3C/svg%3E';

export const handleAvatarError = (event: React.SyntheticEvent<HTMLImageElement>) => {
  if (event.currentTarget.src === DEFAULT_AVATAR_URL) {
    return;
  }

  event.currentTarget.src = DEFAULT_AVATAR_URL;
};
