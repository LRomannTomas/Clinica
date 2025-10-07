import { Rol } from "./roles";


export interface Perfil {
  id: string;              
  perfil: 'admin' | 'paciente' | 'especialista';
  nombre: string;
  apellido: string;
  edad: number;
  dni: string;
  obra_social?: string;    
  especialidades?: string[];
  email: string;
  foto_url?: string;       
  fotos_url?: string[];    
  aprobado?: boolean;     
  email_confirmado_at?: string | null; 
  creado_at?: string;
}
