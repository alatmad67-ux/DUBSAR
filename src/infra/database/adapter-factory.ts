
'use client';

import { DatabaseAdapter, DB_COMMANDS } from './adapter';

/**
 * محول المعاينة (Browser Preview Adapter)
 */
class MockAdapter implements DatabaseAdapter {
  private async getStore(key: string): Promise<any[]> {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(`dubsar_mock_${key}`);
    return data ? JSON.parse(data) : [];
  }

  private async setStore(key: string, data: any[]) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`dubsar_mock_${key}`, JSON.stringify(data));
    }
  }

  async execute(command: string, args?: any): Promise<any> {
    console.log(`[MockDB Desktop] Exec: ${command}`, args);
    
    if (command === DB_COMMANDS.CREATE_PRODUCT) {
      const products = await this.getStore('products');
      const newProduct = { ...args.product, id: Math.random().toString(36).substring(7) };
      products.push(newProduct);
      await this.setStore('products', products);
      return newProduct;
    }

    if (command === DB_COMMANDS.LOGIN) {
      const users = await this.getStore('users');
      const user = users.find((candidate) => candidate.username === args.username && candidate.pin === args.pin);
      if (user) {
        return user;
      }
      throw new Error("بيانات خاطئة");
    }

    if (command === DB_COMMANDS.GET_SETUP_STATUS) {
      const users = await this.getStore('users');
      return { needsSetup: !users.some((user) => ['owner', 'manager', 'admin'].includes(user.role) && user.active !== false), userCount: users.length };
    }

    if (command === DB_COMMANDS.CREATE_FIRST_ADMIN) {
      const users = await this.getStore('users');
      if (users.some((user) => ['owner', 'manager', 'admin'].includes(user.role) && user.active !== false)) {
        throw new Error("تم إنشاء المدير مسبقاً");
      }
      if (users.some((user) => user.username.toLowerCase() === args.username.toLowerCase())) {
        throw new Error("اسم المستخدم مستخدم مسبقاً");
      }
      const user = { id: Math.random().toString(36).substring(7), username: args.username, displayName: args.display_name, role: 'owner', permissions: ['*'], active: true, pin: args.pin };
      users.push(user);
      await this.setStore('users', users);
      return user;
    }

    if (command === DB_COMMANDS.SAVE_APP_SETTINGS) {
      await this.setStore('app_settings', [args.settings]);
      return args.settings;
    }

    if (command === DB_COMMANDS.GET_APP_SETTINGS) {
      const settings = await this.getStore('app_settings');
      if (!settings[0]) throw new Error("لم يتم العثور على إعدادات النشاط");
      return settings[0];
    }

    if (command === DB_COMMANDS.CREATE_CATEGORY) {
      const categories = await this.getStore('categories');
      const category = { ...args.category, id: Math.random().toString(36).substring(7) };
      categories.push(category);
      await this.setStore('categories', categories);
      return category;
    }

    if (command === DB_COMMANDS.PROCESS_SALE) {
      const sales = await this.getStore('sales');
      const invoiceNo = `POS-${Date.now().toString().slice(-6)}`;
      const newSale = {
        id: `sale_${Date.now()}`,
        invoiceNo,
        items: args.cart || [],
        customerName: args.customer?.name || 'زبون نقدي',
        customerId: args.customer?.id,
        totalAmount: (args.cart || []).reduce((sum: number, it: any) => sum + (it.price * it.quantity), 0),
        paidAmount: args.payment?.paidAmount || 0,
        paymentMethod: args.payment?.method || 'cash',
        priceType: args.payment?.priceType || 'retail',
        createdAt: Date.now()
      };
      sales.unshift(newSale);
      await this.setStore('sales', sales);
      return newSale;
    }

    if (command === DB_COMMANDS.UPDATE_SALE) {
      const sales = await this.getStore('sales');
      const idx = sales.findIndex((s: any) => s.id === args.id || s.invoiceNo === args.id);
      const updatedSale = {
        ...(idx >= 0 ? sales[idx] : {}),
        id: args.id,
        items: args.cart || [],
        customerName: args.customer?.name || 'زبون نقدي',
        customerId: args.customer?.id,
        totalAmount: (args.cart || []).reduce((sum: number, it: any) => sum + (it.price * it.quantity), 0),
        paidAmount: args.payment?.paidAmount || 0,
        paymentMethod: args.payment?.method || 'cash',
        priceType: args.payment?.priceType || 'retail',
        updatedAt: Date.now()
      };
      if (idx >= 0) sales[idx] = updatedSale;
      else sales.unshift(updatedSale);
      await this.setStore('sales', sales);
      return updatedSale;
    }

    if (command === DB_COMMANDS.UPDATE_CUSTOMER) {
      const customers = await this.getStore('customers');
      const idx = customers.findIndex((c: any) => c.id === args.id);
      if (idx >= 0) {
        customers[idx] = { ...customers[idx], ...args.customer };
        await this.setStore('customers', customers);
      }
      return { success: true };
    }

    if (command === DB_COMMANDS.UPDATE_SUPPLIER) {
      const suppliers = await this.getStore('suppliers');
      const idx = suppliers.findIndex((s: any) => s.id === args.id);
      if (idx >= 0) {
        suppliers[idx] = { ...suppliers[idx], ...args.supplier };
        await this.setStore('suppliers', suppliers);
      }
      return { success: true };
    }

    return { success: true };
  }

  async query(command: string, args?: any): Promise<any[]> {
    if (command === DB_COMMANDS.GET_PRODUCTS) return this.getStore('products');
    if (command === DB_COMMANDS.GET_CATEGORIES) return this.getStore('categories');
    if (command === DB_COMMANDS.GET_CUSTOMERS) return this.getStore('customers');
    if (command === DB_COMMANDS.GET_SUPPLIERS) return this.getStore('suppliers');
    if (command === DB_COMMANDS.GET_SALES) return this.getStore('sales');
    return [];
  }
}

/**
 * محول Tauri الفعلي (Production Desktop Adapter)
 */
class TauriProxyAdapter implements DatabaseAdapter {
  private async invokeCommand(command: string, args?: any): Promise<any> {
    // استيراد ديناميكي لمكتبة Tauri لمنع خطأ الـ Build في المتصفح
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke(command, args);
  }

  async execute(command: string, args?: any): Promise<any> {
    return await this.invokeCommand(command, args);
  }

  async query(command: string, args?: any): Promise<any[]> {
    const result = await this.invokeCommand(command, args);
    if (!Array.isArray(result)) {
      throw new Error(`Command ${command} returned an invalid list response`);
    }
    return result;
  }
}

export class AdapterFactory {
  static getAdapter(): DatabaseAdapter {
    const isDesktop = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__;
    
    if (isDesktop) {
      console.log("[DUBSAR 2.0] Mode: Native Desktop");
      return new TauriProxyAdapter();
    }

    console.log("[DUBSAR 2.0] Mode: Browser Preview");
    return new MockAdapter();
  }
}
