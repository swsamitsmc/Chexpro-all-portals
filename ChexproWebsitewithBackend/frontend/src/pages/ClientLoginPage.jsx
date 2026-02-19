
import { useState } from 'react';
import PageTransition from '@/components/ui/PageTransition';
import PageSection from '@/components/PageSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, UserCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { ENV_CONFIG } from '@/config/envConfig';
import { ZitadelLoginButton } from '@/components/auth/ZitadelLoginButton';
import { useZitadelAuth } from '@/hooks/useZitadelAuth';

const ClientLoginPage = () => {
  const { t } = useTranslation();
  const { configured: zitadelConfigured } = useZitadelAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { toast } = useToast();

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Get CSRF token for the request
      const csrfResponse = await fetch(`${ENV_CONFIG.API_BASE_URL}/api/auth/csrf-token`, {
        credentials: 'include'
      });

      if (!csrfResponse.ok) {
        throw new Error('Failed to get CSRF token');
      }

      const { csrfToken } = await csrfResponse.json();

      // Attempt login
      const loginResponse = await fetch(`${ENV_CONFIG.API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        credentials: 'include',
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          rememberMe: formData.rememberMe
        })
      });

      const data = await loginResponse.json();

      if (loginResponse.ok) {
        toast({
          title: "Login Successful",
          description: `Welcome back, ${formData.username}!`,
        });

        // Reset form
        setFormData({
          username: '',
          password: '',
          rememberMe: false
        });

        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);

      } else {
        toast({
          title: "Login Failed",
          description: data.error || 'Invalid credentials. Please try again.',
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Error",
        description: "Unable to connect to the server. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageTransition>
      <Helmet>
        <title>Client Login - ChexPro</title>
        <meta name="description" content="Log in to your ChexPro client account to manage background checks, access reports, and initiate new screening requests." />
      </Helmet>
      <PageSection className="flex items-center justify-center min-h-[calc(100vh-10rem)] bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Card className="w-full max-w-md shadow-2xl glassmorphism">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 inline-block rounded-full bg-primary/10">
                <UserCircle className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-3xl">{t('pages.clientLogin.title')}</CardTitle>
              <CardDescription>Access your ChexPro account securely.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="username">Username or Email</Label>
                  <Input
                    id="username"
                    type="text"
                    value={formData.username}
                    onChange={handleInputChange('username')}
                    placeholder="yourusername or email@example.com"
                    className={errors.username ? 'border-red-500' : ''}
                    disabled={isLoading}
                    required
                  />
                  {errors.username && (
                    <p className="text-sm text-red-500 mt-1">{errors.username}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange('password')}
                    placeholder="••••••••"
                    className={errors.password ? 'border-red-500' : ''}
                    disabled={isLoading}
                    required
                  />
                  {errors.password && (
                    <p className="text-sm text-red-500 mt-1">{errors.password}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleInputChange('rememberMe')}
                    disabled={isLoading}
                    className="rounded"
                  />
                  <Label htmlFor="rememberMe" className="text-sm">Remember me</Label>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Login
                    </>
                  )}
                </Button>
              </form>
              
              {/* Zitadel SSO Login */}
              {zitadelConfigured && (
                <>
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        Or continue with
                      </span>
                    </div>
                  </div>
                  
                  <ZitadelLoginButton 
                    className="w-full"
                    returnTo="/dashboard"
                  />
                </>
              )}
              
              <div className="mt-6 text-center text-sm">
                <p className="text-muted-foreground">
                  <Link to="#" className="font-medium text-primary hover:underline">
                    Forgot Password?
                  </Link>
                </p>
                <p className="text-muted-foreground mt-2">
                  Don't have an account?{' '}
                  <Link to="/request-demo" className="font-medium text-primary hover:underline">
                    Request a Demo
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </PageSection>
    </PageTransition>
  );
};

export default ClientLoginPage;
