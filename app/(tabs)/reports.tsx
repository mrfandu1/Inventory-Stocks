import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useData } from '@/contexts/DataContext';
import { LinearGradient } from 'expo-linear-gradient';
import {
  BarChart3,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  ArrowUp,
  ArrowDown,
} from 'lucide-react-native';

const screenWidth = Dimensions.get('window').width;

type TimeRange = 'hour' | 'day' | 'month';

export default function ReportsScreen() {
  const { sales, saleItems, inventoryItems, isLoading } = useData();
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('day');

  // Analytics calculations
  const analytics = useMemo(() => {
    if (!sales || !saleItems) {
      return {
        totalRevenue: 0,
        totalSales: 0,
        avgOrderValue: 0,
        topItems: [],
        salesByTime: { labels: [], data: [] },
        revenueByTime: { labels: [], data: [] },
        salesGrowth: 0,
      };
    }

    // Calculate total revenue and sales
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total_amount, 0);
    const totalSales = sales.length;
    const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Calculate top selling items
    const itemSales: { [key: string]: { quantity: number; revenue: number; name: string } } = {};
    
    saleItems.forEach(item => {
      const inventoryItem = inventoryItems?.find(inv => inv.id === item.inventory_item_id);
      const itemName = inventoryItem?.name || 'Unknown Item';
      
      if (!itemSales[item.inventory_item_id]) {
        itemSales[item.inventory_item_id] = { quantity: 0, revenue: 0, name: itemName };
      }
      itemSales[item.inventory_item_id].quantity += item.quantity;
      itemSales[item.inventory_item_id].revenue += item.total_price;
    });

    const topItems = Object.values(itemSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Calculate sales by time period
    const now = new Date();
    const salesByTime: { [key: string]: { sales: number; revenue: number } } = {};

    sales.forEach(sale => {
      const saleDate = new Date(sale.created_at);
      let timeKey = '';

      switch (selectedTimeRange) {
        case 'hour':
          // Last 24 hours
          timeKey = saleDate.getHours().toString().padStart(2, '0') + ':00';
          break;
        case 'day':
          // Last 30 days
          timeKey = saleDate.toISOString().split('T')[0];
          break;
        case 'month':
          // Last 12 months
          timeKey = saleDate.getFullYear() + '-' + (saleDate.getMonth() + 1).toString().padStart(2, '0');
          break;
      }

      if (!salesByTime[timeKey]) {
        salesByTime[timeKey] = { sales: 0, revenue: 0 };
      }
      salesByTime[timeKey].sales += 1;
      salesByTime[timeKey].revenue += sale.total_amount;
    });

    // Generate time series data
    const timeLabels: string[] = [];
    const salesData: number[] = [];
    const revenueData: number[] = [];

    // Generate labels based on time range
    if (selectedTimeRange === 'hour') {
      for (let i = 23; i >= 0; i--) {
        const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
        const label = hour.getHours().toString().padStart(2, '0') + ':00';
        timeLabels.push(label);
        salesData.push(salesByTime[label]?.sales || 0);
        revenueData.push(salesByTime[label]?.revenue || 0);
      }
    } else if (selectedTimeRange === 'day') {
      for (let i = 29; i >= 0; i--) {
        const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const label = day.toISOString().split('T')[0];
        const shortLabel = (day.getMonth() + 1) + '/' + day.getDate();
        timeLabels.push(shortLabel);
        salesData.push(salesByTime[label]?.sales || 0);
        revenueData.push(salesByTime[label]?.revenue || 0);
      }
    } else {
      for (let i = 11; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = month.getFullYear() + '-' + (month.getMonth() + 1).toString().padStart(2, '0');
        const shortLabel = month.toLocaleDateString('en', { month: 'short' });
        timeLabels.push(shortLabel);
        salesData.push(salesByTime[label]?.sales || 0);
        revenueData.push(salesByTime[label]?.revenue || 0);
      }
    }

    // Calculate growth (comparing current period to previous)
    const currentPeriodRevenue = revenueData.slice(-7).reduce((sum, val) => sum + val, 0);
    const previousPeriodRevenue = revenueData.slice(-14, -7).reduce((sum, val) => sum + val, 0);
    const salesGrowth = previousPeriodRevenue > 0 
      ? ((currentPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100 
      : 0;

    return {
      totalRevenue,
      totalSales,
      avgOrderValue,
      topItems,
      salesByTime: { labels: timeLabels, data: salesData },
      revenueByTime: { labels: timeLabels, data: revenueData },
      salesGrowth,
    };
  }, [sales, saleItems, inventoryItems, selectedTimeRange]);

  const MetricCard = ({ title, value, icon, color, growth }: any) => (
    <View style={[styles.metricCard, { borderLeftColor: color }]}>
      <View style={styles.metricHeader}>
        <View style={[styles.metricIcon, { backgroundColor: color + '20' }]}>
          {icon}
        </View>
        {growth !== undefined && (
          <View style={[styles.growthBadge, { backgroundColor: growth >= 0 ? '#10B981' : '#EF4444' }]}>
            <TrendingUp color="white" size={12} />            <Text style={styles.growthText}>
              {typeof growth === 'number' 
                ? `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%` 
                : '0.0%'
              }
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricTitle}>{title}</Text>
    </View>
  );

  const TimeRangeButton = ({ range, label }: { range: TimeRange; label: string }) => (
    <TouchableOpacity
      style={[
        styles.timeRangeButton,
        selectedTimeRange === range && styles.timeRangeButtonActive,
      ]}
      onPress={() => setSelectedTimeRange(range)}
    >
      <Text
        style={[
          styles.timeRangeButtonText,
          selectedTimeRange === range && styles.timeRangeButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#3B82F6', '#1E40AF']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Sales Analytics</Text>
        <Text style={styles.headerSubtitle}>Track your business performance</Text>
      </LinearGradient>

      {/* Key Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Metrics</Text>
        <View style={styles.metricsGrid}>
          <MetricCard
            title="Total Revenue"
            value={`$${analytics.totalRevenue.toFixed(2)}`}
            icon={<DollarSign color="#10B981" size={20} />}
            color="#10B981"
            growth={analytics.salesGrowth}
          />
          <MetricCard
            title="Total Sales"
            value={analytics.totalSales.toString()}
            icon={<BarChart3 color="#3B82F6" size={20} />}
            color="#3B82F6"
          />
          <MetricCard
            title="Avg Order Value"
            value={`$${analytics.avgOrderValue.toFixed(2)}`}
            icon={<TrendingUp color="#F59E0B" size={20} />}
            color="#F59E0B"
          />
          <MetricCard
            title="Products Sold"
            value={analytics.topItems.reduce((sum, item) => sum + item.quantity, 0).toString()}
            icon={<Package color="#8B5CF6" size={20} />}
            color="#8B5CF6"
          />
        </View>
      </View>

      {/* Time Range Selector */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sales Over Time</Text>
        <View style={styles.timeRangeSelector}>
          <TimeRangeButton range="hour" label="24 Hours" />
          <TimeRangeButton range="day" label="30 Days" />
          <TimeRangeButton range="month" label="12 Months" />
        </View>

        {/* Sales Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Sales Count Over Time</Text>
          <View style={styles.simpleChart}>
            {analytics.salesByTime.labels.slice(-10).map((label, index) => {
              const value = analytics.salesByTime.data.slice(-10)[index];
              const maxValue = Math.max(...analytics.salesByTime.data.slice(-10));
              const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
                return (
                <View key={index} style={styles.chartBar}>
                  <View style={[styles.chartBarFill, { height: `${height}%` }]} />
                  <Text style={styles.chartBarLabel}>{label}</Text>
                  <Text style={styles.chartBarValue}>{typeof value === 'number' ? value : 0}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Revenue Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Revenue Over Time</Text>
          <View style={styles.simpleChart}>
            {analytics.revenueByTime.labels.slice(-8).map((label, index) => {
              const value = analytics.revenueByTime.data.slice(-8)[index];
              const maxValue = Math.max(...analytics.revenueByTime.data.slice(-8));
              const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
                return (
                <View key={index} style={styles.chartBar}>
                  <View style={[styles.chartBarFill, { height: `${height}%`, backgroundColor: '#10B981' }]} />
                  <Text style={styles.chartBarLabel}>{label}</Text>
                  <Text style={styles.chartBarValue}>${typeof value === 'number' ? value.toFixed(0) : '0'}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Top Selling Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Selling Items</Text>
        {analytics.topItems.length > 0 ? (
          <View style={styles.topItemsList}>
            {analytics.topItems.map((item, index) => (
              <View key={index} style={styles.topItemCard}>
                <View style={styles.topItemRank}>
                  <Text style={styles.topItemRankText}>{index + 1}</Text>
                </View>
                <View style={styles.topItemInfo}>
                  <Text style={styles.topItemName}>{item.name}</Text>
                  <Text style={styles.topItemStats}>
                    {item.quantity} sold • ${item.revenue.toFixed(2)} revenue
                  </Text>
                </View>
                <View style={styles.topItemRevenue}>
                  <Text style={styles.topItemRevenueText}>
                    ${item.revenue.toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.noDataContainer}>
            <Package color="#9CA3AF" size={48} />
            <Text style={styles.noDataText}>No sales data available</Text>
            <Text style={styles.noDataSubtext}>Start making sales to see analytics</Text>
          </View>
        )}
      </View>
    </ScrollView>
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
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    flex: 1,
    minWidth: '47%',
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  growthText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  metricTitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  timeRangeSelector: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  timeRangeButtonActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  timeRangeButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  timeRangeButtonTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    padding: 16,
    paddingBottom: 8,
  },
  topItemsList: {
    gap: 12,
  },
  topItemCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  topItemRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  topItemRankText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  topItemInfo: {
    flex: 1,
  },
  topItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  topItemStats: {
    fontSize: 14,
    color: '#6B7280',
  },
  topItemRevenue: {
    alignItems: 'flex-end',
  },
  topItemRevenueText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  noDataContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noDataText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 16,
    marginBottom: 8,
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  simpleChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 200,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: 2,
    height: 160,
  },
  chartBarFill: {
    width: '80%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
    minHeight: 2,
  },
  chartBarLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  chartBarValue: {
    fontSize: 9,
    color: '#374151',
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
});
