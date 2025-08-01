
    import React, { useState } from 'react';
    import PageTransition from '@/hooks/usePageTransition';
    import PageSection from '@/components/PageSection';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { Link } from 'react-router-dom';
    import { motion } from 'framer-motion';
    import { LogIn, UserCircle } from 'lucide-react';
    import { useToast } from '@/components/ui/use-toast';
    import { Helmet } from 'react-helmet-async';


    const ClientLoginPage = () => {
      const [username, setUsername] = useState('');
      const [password, setPassword] = useState('');
      const { toast } = useToast();

      const handleSubmit = (e) => {
        e.preventDefault();
        // This is a placeholder for actual login logic.
        // In a real app, you would make an API call here.
        toast({
          title: "Login Attempt (Placeholder)",
          description: "Functionality not implemented. Username: " + username,
        });
        // console.log('Login attempt:', { username, password });
        setUsername('');
        setPassword('');
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
                  <CardTitle className="text-3xl">Client Login</CardTitle>
                  <CardDescription>Access your ChexPro account securely.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <Label htmlFor="username">Username or Email</Label>
                      <Input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="yourusername or email@example.com"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      <LogIn className="mr-2 h-4 w-4" /> Login
                    </Button>
                  </form>
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
  