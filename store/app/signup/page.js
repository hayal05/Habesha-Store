import AuthPage from '@/components/AuthPage';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Create account · Habesha Store', robots: { index: false } };

export default function Page(props) { return <AuthPage mode="signup" {...props} />; }
