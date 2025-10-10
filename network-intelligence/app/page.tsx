import { redirect } from 'next/navigation'

/**
 * Root page - redirects to Fleet Tracking demo (Template-driven OpIntel)
 */
export default function HomePage() {
  redirect('/fleet-demo')
}
