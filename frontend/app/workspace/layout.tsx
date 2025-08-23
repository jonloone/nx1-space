import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NexusOne Intelligence Platform',
  description: 'AI-powered data intelligence platform',
};

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}