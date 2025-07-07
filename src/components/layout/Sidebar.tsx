import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home, ClipboardList, Users, UserCircle, Package,
  Calculator, Settings, LogOut, CheckSquare, ChevronLeft, ChevronRight,
  BarChart3
} from 'lucide-react';
import Logo from '@/assets/logo.png'; // ✅ logo importado
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const Sidebar = () => {
  const { profile, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(true);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const getNavigationItems = () => {
    const baseItems = [
      { path: '/dashboard', icon: Home, label: 'Dashboard' },
      { path: '/orders', icon: ClipboardList, label: 'Ordens de Serviço' },
    ];

    if (profile?.role === 'worker') {
      baseItems.push({ path: '/my-tasks', icon: CheckSquare, label: 'Minhas Tarefas' });
    }

    if (profile?.role === 'admin' || profile?.role === 'manager') {
      return [
        ...baseItems,
        { path: '/clients', icon: UserCircle, label: 'Clientes' },
        { path: '/services', icon: Package, label: 'Serviços' },
        { path: '/budgets', icon: Calculator, label: 'Orçamentos' },
        { path: '/inventory', icon: Package, label: 'Estoque' },
        { path: '/employees', icon: Users, label: 'Funcionários' },
        { path: '/reports', icon: BarChart3, label: 'Relatórios' },
        { path: '/settings', icon: Settings, label: 'Configurações' },
      ];
    }

    return baseItems;
  };

  const navigationItems = getNavigationItems();

  return (
    <div
      className={`h-screen bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))] flex flex-col transition-all duration-300
        ${isOpen ? 'w-64' : 'w-16'} fixed lg:relative z-50`}
    >
      {/* Botão de toggle */}
      <div className="flex justify-end p-2">
        <Button
          variant="ghost"
          onClick={toggleSidebar}
          className="text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-background))] p-1 transition-colors"
        >
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </Button>
      </div>

      {/* Logo e perfil */}
      {isOpen && (
        <div className="p-4 border-b border-[hsl(var(--sidebar-border))] flex flex-col items-start">
          <img src={Logo} alt="Logo" className="w-32 mb-3" />
          <h1 className="text-xl font-bold">RM Soluções</h1>
          <p className="text-sm text-[hsl(var(--sidebar-foreground)/0.8)] mt-1">{profile?.name}</p>
          <p className="text-xs text-[hsl(var(--sidebar-foreground)/0.6)] capitalize">
            {profile?.role === 'admin'
              ? 'Administrador'
              : profile?.role === 'manager'
              ? 'Gerente'
              : 'Operário'}
          </p>
        </div>
      )}

      {/* Menu de navegação */}
      <nav className="flex-1 p-2 overflow-y-auto">
        <ul className="space-y-1">
          {navigationItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md transition-colors duration-200 ${
                    isActive
                      ? 'bg-[hsl(var(--sidebar-background))] text-white'
                      : 'text-[hsl(var(--sidebar-foreground)/0.7)] hover:bg-[hsl(var(--sidebar-background))] hover:text-white'
                  }`
                }
              >
                <item.icon size={20} />
                {isOpen && <span className="whitespace-nowrap">{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Botão de sair */}
      <div className="p-4 border-t border-[hsl(var(--sidebar-border))]">
        <Button
          onClick={signOut}
          variant="ghost"
          className="w-full justify-start text-[hsl(var(--sidebar-foreground)/0.7)] hover:text-white hover:bg-[hsl(var(--sidebar-background))] transition-colors duration-200"
        >
          <LogOut size={20} className="mr-2" />
          {isOpen && 'Sair'}
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
