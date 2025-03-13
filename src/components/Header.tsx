
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { LogOut } from 'lucide-react';

const Header: React.FC = () => {
  const location = useLocation();
  const { isLoggedIn, isAdmin, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm py-4 px-6">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <Link to="/" className="font-bold text-xl text-fiuna-red">
            Quincho FIUNA
          </Link>
        </div>
        
        <div className="flex items-center space-x-4">
          <Link to="/calendario" className={`text-gray-600 hover:text-fiuna-red ${location.pathname === '/calendario' ? 'font-semibold text-fiuna-red' : ''}`}>
            Calendario
          </Link>
          <Link to="/nueva-reserva" className={`text-gray-600 hover:text-fiuna-red ${location.pathname === '/nueva-reserva' ? 'font-semibold text-fiuna-red' : ''}`}>
            Reservar
          </Link>
          
          {isLoggedIn && isAdmin ? (
            <>
              <Link to="/admin">
                <Button size="sm" variant="outline" className="mr-2">
                  Panel Admin
                </Button>
              </Link>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={logout}
                className="flex items-center gap-1"
              >
                <LogOut className="h-4 w-4" />
                Salir
              </Button>
            </>
          ) : (
            <Link to="/login">
              <Button size="sm" variant="outline">
                Admin
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
