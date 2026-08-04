import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
          borderRadius: 36,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: 105, height: 105, border: '28px solid #075e9b', borderRightColor: 'transparent', borderRadius: '50%' }} />
          <div style={{ width: 46, height: 46, marginLeft: -28, borderRadius: '50%', background: '#0787f9' }} />
        </div>
      </div>
    ),
    { ...size },
  );
}
