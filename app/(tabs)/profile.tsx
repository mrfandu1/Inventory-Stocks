import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { LinearGradient } from 'expo-linear-gradient';
import {
  User,
  LogOut,
  Settings,
  Info,
  Database,
  Trash2,
  Download,
  Upload,
} from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { inventoryItems, sales, saleItems, clearAllData } = useData();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your categories, items, and transaction history. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            Alert.alert('Success', 'All data has been cleared');
          },
        },
      ]
    );
  };

  const exportData = () => {
    const data = {
      inventoryItems,
      sales,
      saleItems,
      exportDate: new Date().toISOString(),
    };

    if (Platform.OS === 'web') {
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      Alert.alert('Success', 'Data exported successfully');
    } else {
      Alert.alert('Export', 'Data export is only available on web platform');
    }
  };

  const StatCard = ({ title, value, icon, color }: any) => (
    <View style={[styles.statCard, { borderColor: color }]}>
      <View style={[styles.statIconContainer, { backgroundColor: color }]}>
        {icon}
      </View>
      <View style={styles.statInfo}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </View>
  );

  const ActionCard = ({ title, description, icon, onPress, color, destructive = false }: any) => (
    <TouchableOpacity
      style={[styles.actionCard, destructive && styles.actionCardDestructive]}
      onPress={onPress}
    >
      <View style={[styles.actionIconContainer, { backgroundColor: color }]}>
        {icon}
      </View>
      <View style={styles.actionInfo}>
        <Text style={[styles.actionTitle, destructive && styles.actionTitleDestructive]}>
          {title}
        </Text>
        <Text style={[styles.actionDescription, destructive && styles.actionDescriptionDestructive]}>
          {description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#3B82F6', '#8B5CF6']}
        style={styles.header}
      >
        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            <User color="white" size={32} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Inventory Items"
              value={inventoryItems.length}
              icon={<Database color="white" size={20} />}
              color="#3B82F6"
            />
            <StatCard
              title="Multi-Category Items"
              value={inventoryItems.filter(item => item.is_multi_category).length}
              icon={<Settings color="white" size={20} />}
              color="#8B5CF6"
            />
            <StatCard
              title="Total Sales"
              value={sales.length}
              icon={<Database color="white" size={20} />}
              color="#10B981"
            />
            <StatCard
              title="Items Sold"
              value={saleItems.reduce((sum, item) => sum + item.quantity, 0)}
              icon={<Info color="white" size={20} />}
              color="#F59E0B"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          <ActionCard
            title="Export Data"
            description="Download your inventory data as JSON backup"
            icon={<Download color="white" size={20} />}
            onPress={exportData}
            color="#10B981"
          />
          <ActionCard
            title="Clear All Data"
            description="Permanently delete all categories, items, and history"
            icon={<Trash2 color="white" size={20} />}
            onPress={handleClearData}
            color="#EF4444"
            destructive
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <ActionCard
            title="Logout"
            description="Sign out of your account"
            icon={<LogOut color="white" size={20} />}
            onPress={handleLogout}
            color="#6B7280"
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Inventory Manager v1.0.0
          </Text>
          <Text style={styles.footerSubtext}>
            Built with React Native & Expo
          </Text>
        </View>
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
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  statTitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  actionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionCardDestructive: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  actionTitleDestructive: {
    color: '#DC2626',
  },
  actionDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  actionDescriptionDestructive: {
    color: '#7F1D1D',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});