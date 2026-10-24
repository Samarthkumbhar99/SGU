import { AppLayout } from '../../components/layout/AppLayout.jsx'
import { Construction } from 'lucide-react'

export default function PlaceholderPage({ title, breadcrumbs, description }) {
  return (
    <AppLayout pageTitle={title} breadcrumbs={breadcrumbs}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: '20px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #eef6ff, #d7e6f5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #d7e6f5',
          }}
        >
          <Construction size={32} color="#247bc1" />
        </div>
        <div>
          <h2 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 700, color: '#17324d' }}>
            {title}
          </h2>
          <p style={{ margin: 0, color: '#64778b', fontSize: '14px', maxWidth: '400px' }}>
            {description || 'This module is being built as part of Phase 4–7 of the implementation roadmap.'}
          </p>
        </div>
        <div
          style={{
            padding: '10px 20px',
            background: '#eef6ff',
            border: '1px solid #d7e6f5',
            borderRadius: '8px',
            fontSize: '13px',
            color: '#247bc1',
            fontWeight: 600,
          }}
        >
          Coming in next phases ✓
        </div>
      </div>
    </AppLayout>
  )
}
