import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { InventoryItem, Sale, SaleItem } from '@/types';

interface DataContextType {
  inventoryItems: InventoryItem[];
  sales: Sale[];
  saleItems: SaleItem[];
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<void>;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => Promise<void>;
  addSale: (sale: Omit<Sale, 'id' | 'created_at' | 'updated_at' | 'user_id'>, items: Omit<SaleItem, 'id' | 'sale_id' | 'created_at'>[]) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
  clearAllData: () => Promise<void>;
  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user, session } = useAuth();
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load data when user is authenticated
  useEffect(() => {
    if (user && session) {
      loadAllData();
    } else {
      // Clear data when user logs out
      setInventoryItems([]);
      setSales([]);
      setSaleItems([]);
    }
  }, [user, session]);

  const loadAllData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      await Promise.all([
        loadInventoryItems(),
        loadSales(),
        loadSaleItems(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadInventoryItems = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading inventory items:', error);
      return;
    }

    setInventoryItems(data || []);
  };

  const loadSales = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading sales:', error);
      return;
    }

    setSales(data || []);
  };

  const loadSaleItems = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('sale_items')
      .select(`
        *,
        sales!inner(user_id)
      `)
      .eq('sales.user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading sale items:', error);
      return;
    }

    setSaleItems(data || []);
  };

  const addInventoryItem = async (item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('inventory_items')
      .insert([
        {
          ...item,
          user_id: user.id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error adding inventory item:', error);
      throw error;
    }

    setInventoryItems(prev => [data, ...prev]);
  };

  const updateInventoryItem = async (id: string, updates: Partial<InventoryItem>) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('inventory_items')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating inventory item:', error);
      throw error;
    }

    setInventoryItems(prev => prev.map(item => item.id === id ? data : item));
  };

  const addSale = async (
    sale: Omit<Sale, 'id' | 'created_at' | 'updated_at' | 'user_id'>, 
    items: Omit<SaleItem, 'id' | 'sale_id' | 'created_at'>[]
  ) => {
    if (!user) return;

    // Start a transaction
    const { data: saleData, error: saleError } = await supabase
      .from('sales')
      .insert([
        {
          ...sale,
          user_id: user.id,
        },
      ])
      .select()
      .single();

    if (saleError) {
      console.error('Error adding sale:', saleError);
      throw saleError;
    }

    // Add sale items
    const saleItemsData = items.map(item => ({
      ...item,
      sale_id: saleData.id,
    }));

    const { data: saleItemsResult, error: saleItemsError } = await supabase
      .from('sale_items')
      .insert(saleItemsData)
      .select();

    if (saleItemsError) {
      console.error('Error adding sale items:', saleItemsError);
      throw saleItemsError;
    }

    // Update inventory quantities
    for (const item of items) {
      const inventoryItem = inventoryItems.find(inv => inv.id === item.inventory_item_id);
      if (inventoryItem) {
        const newQuantity = Math.max(0, inventoryItem.quantity - item.quantity);
        await updateInventoryItem(item.inventory_item_id, { quantity: newQuantity });
      }
    }

    setSales(prev => [saleData, ...prev]);
    setSaleItems(prev => [...(saleItemsResult || []), ...prev]);
  };

  const deleteInventoryItem = async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting inventory item:', error);
      throw error;
    }

    setInventoryItems(prev => prev.filter(item => item.id !== id));
  };

  const clearAllData = async () => {
    console.log('DataContext clearAllData function called');
    if (!user) {
      console.log('No user found, cannot clear data');
      return;
    }

    try {
      console.log('Starting data clearing process...');
      setIsLoading(true);
      
      // First get all sale IDs for this user
      const { data: userSales } = await supabase
        .from('sales')
        .select('id')
        .eq('user_id', user.id);

      // Delete all sale items first (they reference sales)
      if (userSales && userSales.length > 0) {
        const saleIds = userSales.map(sale => sale.id);
        const { error: saleItemsError } = await supabase
          .from('sale_items')
          .delete()
          .in('sale_id', saleIds);

        if (saleItemsError) {
          console.error('Error deleting sale items:', saleItemsError);
        }
      }

      // Delete all sales
      const { error: salesError } = await supabase
        .from('sales')
        .delete()
        .eq('user_id', user.id);

      if (salesError) {
        console.error('Error deleting sales:', salesError);
        throw salesError;
      }

      // Delete all inventory items
      const { error: inventoryError } = await supabase
        .from('inventory_items')
        .delete()
        .eq('user_id', user.id);

      if (inventoryError) {
        console.error('Error deleting inventory items:', inventoryError);
        throw inventoryError;
      }

      // Clear local state
      setInventoryItems([]);
      setSales([]);
      setSaleItems([]);
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DataContext.Provider value={{
      inventoryItems,
      sales,
      saleItems,
      addInventoryItem,
      updateInventoryItem,
      addSale,
      deleteInventoryItem,
      clearAllData,
      isLoading,
    }}>
      {children}
    </DataContext.Provider>
  );
}