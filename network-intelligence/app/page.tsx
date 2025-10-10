import { redirect } from 'next/navigation'

/**
 * Root page - redirects to OpIntel demo (Operational Intelligence Platform)
 */
export default function HomePage() {
  redirect('/opintel-demo')
}
