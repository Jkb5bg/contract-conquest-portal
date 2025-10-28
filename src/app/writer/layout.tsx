import { WriterAuthProvider } from '@/contexts/WriterAuthContext';

export default function WriterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <WriterAuthProvider>{children}</WriterAuthProvider>;
}
