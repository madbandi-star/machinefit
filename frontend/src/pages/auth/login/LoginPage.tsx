import { AuthLandingScreen } from '@/components/auth/AuthLandingScreen/AuthLandingScreen';
import '@/styles/auth.css';

/** Social-login landing (`/login`). Password / demo form removed. */
export function LoginPage() {
  return <AuthLandingScreen variant="login" />;
}
