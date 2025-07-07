
import { ServiceOrder, Client } from '@/types';

export const mockServiceOrders: ServiceOrder[] = [
  {
    id: '1',
    orderNumber: 'OS-2024-001',
    openingDate: '2024-01-15',
    clientName: 'Empresa ABC Ltda',
    clientContact: '(11) 9999-1234',
    clientAddress: 'Rua das Flores, 123 - São Paulo, SP',
    serviceDescription: 'Manutenção preventiva em equipamentos industriais',
    saleValue: 2500.00,
    status: 'production',
    urgency: 'high',
    assignedWorkerId: '3',
    assignedWorkerName: 'Carlos Operário',
    deadline: '2024-01-25',
    observations: [
      {
        id: '1',
        date: '2024-01-16',
        userId: '3',
        userName: 'Carlos Operário',
        text: 'Iniciando análise dos equipamentos'
      }
    ]
  },
  {
    id: '2',
    orderNumber: 'OS-2024-002',
    openingDate: '2024-01-16',
    clientName: 'Indústria XYZ S/A',
    clientContact: '(11) 8888-5678',
    clientAddress: 'Av. Industrial, 456 - Guarulhos, SP',
    serviceDescription: 'Instalação de novo sistema de automação',
    saleValue: 15000.00,
    status: 'planning',
    urgency: 'medium',
    assignedWorkerId: '3',
    assignedWorkerName: 'Carlos Operário',
    deadline: '2024-02-15',
    observations: []
  },
  {
    id: '3',
    orderNumber: 'OS-2024-003',
    openingDate: '2024-01-17',
    clientName: 'Metalúrgica Delta',
    clientContact: '(11) 7777-9012',
    clientAddress: 'Rua dos Metais, 789 - Osasco, SP',
    serviceDescription: 'Reparo em sistema hidráulico',
    saleValue: 800.00,
    status: 'received',
    urgency: 'low',
    deadline: '2024-01-30',
    observations: []
  }
];

export const mockClients: Client[] = [
  {
    id: '1',
    name: 'Empresa ABC Ltda',
    contact: '(11) 9999-1234',
    address: 'Rua das Flores, 123 - São Paulo, SP'
  },
  {
    id: '2',
    name: 'Indústria XYZ S/A',
    contact: '(11) 8888-5678',
    address: 'Av. Industrial, 456 - Guarulhos, SP'
  },
  {
    id: '3',
    name: 'Metalúrgica Delta',
    contact: '(11) 7777-9012',
    address: 'Rua dos Metais, 789 - Osasco, SP'
  }
];
