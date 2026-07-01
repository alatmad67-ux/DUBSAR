
export type UserRole = 
  | 'admin' 
  | 'sales_employee' 
  | 'workshop_technician' 
  | 'warehouse_employee' 
  | 'retail_customer' 
  | 'wholesale_customer';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  phoneNumber?: string;
  photoURL?: string;
  createdAt: number;
}

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ['all'],
  sales_employee: ['view_catalog', 'create_order', 'manage_pos', 'check_compatibility'],
  workshop_technician: ['view_tasks', 'update_task_status', 'view_workshop_history'],
  warehouse_employee: ['manage_inventory', 'view_stock', 'manage_warehousing'],
  retail_customer: ['view_catalog', 'view_orders', 'check_compatibility'],
  wholesale_customer: ['view_catalog', 'view_orders', 'view_wholesale_prices', 'check_compatibility'],
};
