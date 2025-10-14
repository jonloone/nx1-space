import { redirect } from 'next/navigation'

/**
 * Root page - redirects to Operations Intelligence (Mundi OpIntel Platform)
 */
export default function HomePage() {
  redirect('/operations')
}
