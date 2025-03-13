
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    
    if (!email || !password) {
      toast.error('Por favor complete todos los campos');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('Attempting login with:', { email });
      const success = await login(email, password);
      
      if (success) {
        console.log('Login successful');
        toast.success('Inicio de sesión exitoso');
        navigate('/admin');
      } else {
        setLoading(false);
        console.log('Login failed');
        setErrorMessage('Credenciales incorrectas. Por favor intente de nuevo.');
      }
    } catch (error) {
      console.error('Error de inicio de sesión:', error);
      toast.error('Ocurrió un error al iniciar sesión');
      setLoading(false);
      setErrorMessage('Error al conectar con el servidor. Por favor intente más tarde.');
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>
          Iniciar Sesión
        </CardTitle>
        <CardDescription>
          Ingrese sus credenciales para acceder al sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          {errorMessage && (
            <div className="text-sm text-red-500 mt-2">
              {errorMessage}
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full mt-4"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <div className="flex flex-col space-y-1 mt-2 w-full items-center">
          <Button
            variant="link"
            className="text-sm"
            onClick={() => navigate('/auth/reset-password')}
            type="button"
            disabled={loading}
          >
            ¿Olvidaste tu contraseña?
          </Button>
          
          <Button
            variant="link"
            className="text-sm"
            onClick={() => navigate('/auth/signup')}
            type="button"
            disabled={loading}
          >
            Registrarse como administrador
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default LoginForm;
