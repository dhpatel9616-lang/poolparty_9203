import MobileLayout from '@/components/MobileLayout';
import LoginForm from './components/LoginForm';

export default function SignUpLoginPage() {
  return (
    <MobileLayout hideTabBar>
      <LoginForm />
    </MobileLayout>
  );
}