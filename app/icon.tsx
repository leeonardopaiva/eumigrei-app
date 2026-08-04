import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
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
          borderRadius: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: 18, height: 18, border: '5px solid #075e9b', borderRightColor: 'transparent', borderRadius: '50%' }} />
          <div style={{ width: 8, height: 8, marginLeft: -5, borderRadius: '50%', background: '#0787f9' }} />
        </div>
      </div>
    ),
    { ...size },
  );
}
