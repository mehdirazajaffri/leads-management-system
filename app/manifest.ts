import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Leads Management System',
    short_name: 'Leads Manager',
    description: 'Manage leads, track conversions, and analyze performance',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#465FFF',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/apple-icon.svg',
        sizes: '180x180',
        type: 'image/svg+xml',
      },
    ],
  }
}

