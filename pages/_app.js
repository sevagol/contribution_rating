import { SessionProvider } from 'next-auth/react'
import '../styles/globals.css'

export default function App({ Component, pageProps }) {
  return (
    <SessionProvider session={pageProps.session}>
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
        <Component {...pageProps} />
      </div>
    </SessionProvider>
  )
}
