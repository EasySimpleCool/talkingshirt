import './globals.css'

export const metadata = {
  title: 'Talking Shirt',
  description: 'Interactive shirt customization experience',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
} 