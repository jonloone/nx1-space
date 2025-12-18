import { redirect } from 'next/navigation'

/**
 * Root page - redirects to Ask Data interface
 */
export default function HomePage() {
  redirect('/ask-data')
}
