import AuthPage from '@/components/AuthPage';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Sign in · Habesha Store', robots: { index: false } };

export default function Page(props) { return <AuthPage mode="signin" {...props} />; }
