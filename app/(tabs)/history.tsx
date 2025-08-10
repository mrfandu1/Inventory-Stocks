import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useData } from '@/contexts/DataContext';
import { Sale, SaleItem } from '@/types';
import {
  History,
  Search,
  TrendingUp,
  Calendar,
  DollarSign,
  Filter,
  Package,
  User,
} from 'lucide-react-native';

export default function HistoryScreen() {
  const { sales, saleItems, inventoryItems, isLoading } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'completed' | 'pending' | 'cancelled'>('all');

  const safeSales = sales || [];
  const safeSaleItems = saleItems || [];
  const safeInventoryItems = inventoryItems || [];

  const filteredSales = safeSales
    .filter(sale => {
      const matchesSearch = 
        sale.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sale.customer_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sale.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = selectedFilter === 'all' || sale.status === selectedFilter;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const getSaleItems = (saleId: string) => {
    return safeSaleItems.filter(item => item.sale_id === saleId);
  };

  const getInventoryItemName = (itemId: string) => {
    const item = safeInventoryItems.find(i => i.id === itemId);
    return item?.name || 'Unknown Item';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const FilterButton = ({ 
    type, 
    label 
  }: { 
    type: 'all' | 'completed' | 'pending' | 'cancelled'; 
    label: string; 
  }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === type && styles.filterButtonActive,
      ]}
      onPress={() => setSelectedFilter(type)}
    >
      <Text
        style={[
          styles.filterButtonText,
          selectedFilter === type && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const SaleCard = ({ sale }: { sale: Sale }) => {
    const saleItemsForSale = getSaleItems(sale.id);
    const totalItems = saleItemsForSale.reduce((sum, item) => sum + item.quantity, 0);

    return (
      <View style={styles.saleCard}>
        <View style={styles.saleHeader}>
          <View style={styles.saleInfo}>
            <Text style={styles.saleId}>Sale #{sale.id.slice(-8)}</Text>
            <Text style={styles.saleDate}>{formatDate(sale.created_at)}</Text>
          </View>
          <View style={styles.saleStatus}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(sale.status) }]}>
              <Text style={styles.statusText}>{sale.status.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {sale.customer_name && (
          <View style={styles.customerInfo}>
            <User color="#6B7280" size={16} />
            <Text style={styles.customerName}>{sale.customer_name}</Text>
            {sale.customer_email && (
              <Text style={styles.customerEmail}>({sale.customer_email})</Text>
            )}
          </View>
        )}

        <View style={styles.saleDetails}>
          <View style={styles.saleMetric}>
            <Package color="#6B7280" size={16} />
            <Text style={styles.saleMetricText}>{totalItems} items</Text>
          </View>
          <View style={styles.saleMetric}>
            <DollarSign color="#6B7280" size={16} />
            <Text style={styles.saleMetricText}>${sale.total_amount.toFixed(2)}</Text>
          </View>
          {sale.payment_method && (
            <View style={styles.saleMetric}>
              <Text style={styles.paymentMethod}>{sale.payment_method}</Text>
            </View>
          )}
        </View>

        {saleItemsForSale.length > 0 && (
          <View style={styles.saleItems}>
            <Text style={styles.saleItemsTitle}>Items:</Text>
            {saleItemsForSale.map((item) => (              <View key={item.id} style={styles.saleItem}>
                <Text style={styles.saleItemName}>
                  {getInventoryItemName(item.inventory_item_id)}
                  {item.subtype && <Text style={styles.subtypeText}> ({item.subtype})</Text>}
                </Text>
                <Text style={styles.saleItemDetails}>
                  {item.quantity} × ${item.unit_price.toFixed(2)} = ${item.total_price.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading sales history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sales History</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search color="#6B7280" size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by customer, email, or sale ID..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.filtersContainer}>
        <Text style={styles.filtersTitle}>Status</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterButtons}>
            <FilterButton type="all" label="All" />
            <FilterButton type="completed" label="Completed" />
            <FilterButton type="pending" label="Pending" />
            <FilterButton type="cancelled" label="Cancelled" />
          </View>
        </ScrollView>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredSales.length === 0 ? (
          <View style={styles.emptyState}>
            <History color="#9CA3AF" size={48} />
            <Text style={styles.emptyStateText}>
              {safeSales.length === 0 ? 'No sales yet' : 'No sales found'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {safeSales.length === 0 
                ? 'Sales will appear here once you record them' 
                : 'Try adjusting your search or filters'
              }
            </Text>
          </View>
        ) : (
          filteredSales.map(sale => (
            <SaleCard key={sale.id} sale={sale} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  saleCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  saleInfo: {
    flex: 1,
  },
  saleId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  saleDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  saleStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  customerEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  saleDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  saleMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  saleMetricText: {
    fontSize: 14,
    color: '#6B7280',
  },
  paymentMethod: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3B82F6',
    textTransform: 'uppercase',
  },
  saleItems: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  saleItemsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  saleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },  saleItemName: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
  },
  subtypeText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  saleItemDetails: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
});
