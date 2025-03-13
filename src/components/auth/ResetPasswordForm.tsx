
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const ResetPasswordForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we're in a password recovery flow
  useEffect(() => {
    if (location.hash && location.hash.includes('type=recovery')) {
      setIsRecoveryMode(true);
    }
  }, [location]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isRecoveryMode) {
      // This is for setting a new password after clicking the recovery link
      if (!password) {
        toast.error('Por favor ingrese una nueva contraseña');
        setLoading(false);
        return;
      }
      
      if (password.length < 6) {
        toast.error('La contraseña debe tener al menos 6 caracteres');
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        toast.error('Las contraseñas no coinciden');
        setLoading(false);
        return;
      }

      try {
        // Update password using token that's already in the URL hash
        const { error } = await supabase.auth.updateUser({ 
          password 
        });

        if (error) {
          toast.error('Error al actualizar la contraseña: ' + error.message);
          console.error('Reset password error:', error);
        } else {
          toast.success('Contraseña actualizada con éxito');
          navigate('/login');
        }
      } catch (error) {
        console.error('Error:', error);
        toast.error('Error al procesar la solicitud');
      } finally {
        setLoading(false);
      }
    } else {
      // This is for requesting a password reset email
      if (!email) {
        toast.error('Por favor ingrese su correo electrónico');
        setLoading(false);
        return;
      }

      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });

        if (error) {
          toast.error('Error al enviar el correo de recuperación');
          console.error('Reset password error:', error);
        } else {
          toast.success('Se ha enviado un correo de recuperación');
          navigate('/login');
        }
      } catch (error) {
        console.error('Error:', error);
        toast.error('Error al procesar la solicitud');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>
          {isRecoveryMode ? 'Establecer Nueva Contraseña' : 'Recuperar Contraseña'}
        </CardTitle>
        <CardDescription>
          {isRecoveryMode 
            ? 'Ingrese su nueva contraseña' 
            : 'Ingrese su correo electrónico para recuperar su contraseña'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleResetPassword} className="space-y-4">
          {!isRecoveryMode && (
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                required
              />
            </div>
          )}

          {isRecoveryMode && (
            <>
              <div className="space-y-2">
                <Label htmlFor="password">Nueva contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </>
          )}

          <Button 
            type="submit" 
            className="w-full mt-4"
            disabled={loading}
          >
            {loading 
              ? 'Procesando...' 
              : (isRecoveryMode ? 'Actualizar contraseña' : 'Enviar correo de recuperación')
            }
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <div className="flex flex-col space-y-1 mt-2 w-full items-center">
          <Button
            variant="link"
            className="text-sm"
            onClick={() => navigate('/login')}
            type="button"
          >
            Volver al inicio de sesión
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ResetPasswordForm;
