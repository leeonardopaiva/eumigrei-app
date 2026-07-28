import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0869d6',
          borderRadius: '50%',
          color: '#fff',
          fontSize: 320,
          fontWeight: 800,
          fontFamily: 'sans-serif',
        }}
      >
        G
      </div>
    ),
    { width: 512, height: 512 },
  );
}
