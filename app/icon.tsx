import { ImageResponse } from 'next/og'

export const size = { width: 192, height: 192 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '40px',
        }}
      >
        <div style={{ color: 'white', fontSize: 72, fontWeight: 800, fontFamily: 'sans-serif', lineHeight: 1 }}>
          MC
        </div>
        <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 22, fontFamily: 'sans-serif', marginTop: 10 }}>
          comidas
        </div>
      </div>
    ),
    { ...size }
  )
}
