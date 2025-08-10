import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Package, FolderOpen, TrendingUp, TriangleAlert as AlertTriangle, Plus, DollarSign } from 'lucide-react-native';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { inventoryItems, sales, isLoading } = useData();
  const router = useRouter();

  // Ensure all arrays are defined before calculations
  const safeInventoryItems = inventoryItems || [];
  const safeSales = sales || [];

  const totalItems = safeInventoryItems.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
  const totalValue = safeInventoryItems.reduce((sum: number, item: any) => sum + ((item.unit_price || 0) * (item.quantity || 0)), 0);
  const lowStockItems = safeInventoryItems.filter((item: any) => {
    const reorderLevel = item.reorder_level || 10;
    return (item.quantity || 0) < reorderLevel;
  });
  const recentSales = safeSales.slice(-5).reverse();

  const StatCard = ({ title, value, icon, color, onPress }: any) => (
    <TouchableOpacity style={styles.statCard} onPress={onPress}>
      <LinearGradient
        colors={[color, `${color}DD`]}
        style={styles.statCardGradient}
      >
        <View style={styles.statCardHeader}>
          {icon}
          <Text style={styles.statCardTitle}>{title}</Text>
        </View>
        <Text style={styles.statCardValue}>{value}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const QuickActionCard = ({ title, icon, onPress, color }: any) => (
    <TouchableOpacity style={styles.quickActionCard} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: color }]}>
        {icon}
      </View>
      <Text style={styles.quickActionTitle}>{title}</Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#3B82F6', '#8B5CF6']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Welcome back, {user?.name}!</Text>
        <Text style={styles.headerSubtitle}>Here's your inventory overview</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Items"
            value={totalItems.toLocaleString()}
            icon={<Package color="white" size={24} />}
            color="#3B82F6"
            onPress={() => router.push('/inventory')}
          />
          <StatCard
            title="Total Value"
            value={`$${totalValue.toLocaleString()}`}
            icon={<DollarSign color="white" size={24} />}
            color="#10B981"
          />
          <StatCard
            title="Low Stock"
            value={lowStockItems.length.toString()}
            icon={<AlertTriangle color="white" size={24} />}
            color="#EF4444"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <QuickActionCard
              title="Add Item"
              icon={<Plus color="white" size={20} />}
              onPress={() => router.push('/inventory')}
              color="#3B82F6"
            />
            <QuickActionCard
              title="View History"
              icon={<TrendingUp color="white" size={20} />}
              onPress={() => router.push('/history')}
              color="#10B981"
            />
            <QuickActionCard
              title="Sales Report"
              icon={<DollarSign color="white" size={20} />}
              onPress={() => router.push('/reports')}
              color="#F59E0B"
            />
          </View>
        </View>

        {lowStockItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Low Stock Alert</Text>
            <View style={styles.alertCard}>
              <AlertTriangle color="#EF4444" size={24} />
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>
                  {lowStockItems.length} items running low
                </Text>
                <Text style={styles.alertText}>
                  Consider restocking these items soon
                </Text>
              </View>
            </View>
            {lowStockItems.slice(0, 3).map(item => (
              <View key={item.id} style={styles.lowStockItem}>
                <View style={styles.lowStockItemInfo}>
                  <Text style={styles.lowStockItemName}>{item.name}</Text>
                  <Text style={styles.lowStockItemQuantity}>
                    {item.quantity} remaining
                  </Text>
                </View>
                <View style={styles.lowStockQuantityBadge}>
                  <Text style={styles.lowStockQuantityText}>
                    {item.quantity}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {recentSales.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Sales</Text>
            {recentSales.map(sale => (
              <View key={sale.id} style={styles.transactionItem}>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionItemName}>
                    Sale #{sale.id.slice(-8)}
                  </Text>
                  <Text style={styles.transactionType}>
                    {new Date(sale.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.transactionQuantity}>
                  ${sale.total_amount.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  statCardGradient: {
    padding: 16,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statCardTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
    marginLeft: 8,
  },
  statCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  alertContent: {
    flex: 1,
    marginLeft: 12,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 2,
  },
  alertText: {
    fontSize: 14,
    color: '#7F1D1D',
  },
  lowStockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  lowStockItemInfo: {
    flex: 1,
  },
  lowStockItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  lowStockItemQuantity: {
    fontSize: 12,
    color: '#6B7280',
  },
  lowStockQuantityBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  lowStockQuantityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  transactionType: {
    fontSize: 12,
    color: '#6B7280',
  },
  transactionQuantity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
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
});