import React, {useState, useEffect} from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {colors, shadow} from './theme';
import orderService from '../services/orderService';

function OrdersPage({onBack}) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingOrderId, setDeletingOrderId] = useState(null);

  const handleDeleteOrder = async (order) => {
    Alert.alert(
      'Delete Order',
      `Are you sure you want to delete order ${order.id}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingOrderId(order.mongodbId || order.id);
              await orderService.deleteOrder(order.mongodbId || order.id);
              Alert.alert('Success', 'Order deleted successfully');
              fetchOrders();
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to delete order');
            } finally {
              setDeletingOrderId(null);
            }
          },
        },
      ]
    );
  };

  const filters = ['All', 'Pending', 'In Transit', 'Delivered'];

  useEffect(() => {
    fetchOrders();
  }, [activeFilter, searchQuery]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getOrders({
        status: activeFilter,
        search: searchQuery,
        page: 1,
        limit: 50
      });

      if (response.success) {
        setOrders(response.data || []);
      } else {
        Alert.alert('Error', response.message || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Fetch orders error:', error);
      Alert.alert('Error', 'Failed to load orders. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Delivered':
        return {
          icon: '✓',
          color: '#4CAF50',
          bg: 'rgba(76, 175, 80, 0.1)',
        };
      case 'In Transit':
      case 'Shipped':
        return {
          icon: '🚚',
          color: colors.red,
          bg: 'rgba(198, 40, 40, 0.1)',
        };
      case 'Pending':
      case 'Processing':
        return {
          icon: '⏱',
          color: '#FF9800',
          bg: 'rgba(255, 152, 0, 0.1)',
        };
      case 'Cancelled':
        return {
          icon: '✕',
          color: '#F44336',
          bg: 'rgba(244, 67, 54, 0.1)',
        };
      default:
        return {
          icon: '•',
          color: colors.muted,
          bg: 'rgba(0, 0, 0, 0.05)',
        };
    }
  };

  const filteredOrders = orders;

  return (
    <View style={styles.page}>
      {/* Professional Top Navbar */}
      <View style={styles.navbar}>
        <View style={styles.navTopRow}>
          <Pressable onPress={onBack} style={styles.navBackBtn}>
            <Icon name="arrow-left" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.navTitle}>Orders Management</Text>
          <Pressable style={styles.navRefreshBtn} onPress={onRefresh}>
            <Icon name="refresh" size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Integrated Search Bar */}
        <View style={styles.navSearchSection}>
          <View style={styles.navSearchBar}>
            <Icon name="magnify" size={20} color="rgba(255,255,255,0.7)" />
            <TextInput
              placeholder="Search by ID or Customer..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.navSearchInput}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Icon name="close-circle" size={18} color="rgba(255,255,255,0.7)" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Dynamic Filter Pills */}
        <View style={styles.navFilterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.navFilterRow}>
            {filters.map(filter => (
              <Pressable
                key={filter}
                onPress={() => setActiveFilter(filter)}
                style={[
                  styles.navFilterPill,
                  activeFilter === filter && styles.navFilterPillActive,
                ]}>
                <Text
                  style={[
                    styles.navFilterText,
                    activeFilter === filter && styles.navFilterTextActive,
                  ]}>
                  {filter}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Orders List Content */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.red} />
          <Text style={styles.loaderText}>Syncing orders...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.orderList}
          contentContainerStyle={styles.orderListContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.red]} />
          }>
          {orders.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="package-variant" size={64} color={colors.muted} />
              <Text style={styles.emptyTitle}>No Orders Found</Text>
              <Text style={styles.emptyText}>
                {searchQuery
                  ? 'Try a different search term'
                  : 'New orders will appear here once placed'}
              </Text>
            </View>
          ) : (
            orders.map(order => {
              const statusStyle = getStatusStyle(order.status);
              const formattedDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'}) : 'N/A';
              
              return (
                <View key={order.mongodbId || order.id} style={styles.orderCard}>
                  {/* Card Header: Order ID & Status */}
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.cardOrderId}>{order.id}</Text>
                      <Text style={styles.cardDate}>{formattedDate}</Text>
                    </View>
                    <View style={[styles.statusBadge, {backgroundColor: statusStyle.bg}]}>
                      <Text style={[styles.statusText, {color: statusStyle.color}]}>
                        {order.status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardDivider} />

                  {/* Card Body: Customer, Items, Value, Priority */}
                  <View style={styles.cardBody}>
                    <View style={styles.cardInfoRow}>
                      <View style={[styles.cardInfoCol, {flex: 2}]}>
                        <Text style={styles.cardLabel}>CUSTOMER</Text>
                        <Text style={styles.cardValue} numberOfLines={1}>{order.customer}</Text>
                      </View>
                      <View style={styles.cardInfoCol}>
                        <Text style={styles.cardLabel}>PRIORITY</Text>
                        <Text style={[styles.cardValue, {color: order.priority === 'Urgent' || order.priority === 'High' ? colors.red : '#495057'}]}>
                          {order.priority}
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.cardInfoRow, {marginTop: 12}]}>
                      <View style={styles.cardInfoCol}>
                        <Text style={styles.cardLabel}>ITEMS</Text>
                        <Text style={styles.cardValue}>{order.totalItems}</Text>
                      </View>
                      <View style={styles.cardInfoCol}>
                        <Text style={styles.cardLabel}>ORDER VALUE</Text>
                        <Text style={styles.cardValueAmount}>{order.amount}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Action Links */}
                  <View style={styles.cardActionsRow}>
                    <Pressable 
                      style={styles.cardAction}
                      onPress={() => Alert.alert('Quick View', `Order ID: ${order.id}\nStatus: ${order.status}\nValue: ${order.amount}`)}>
                      <Text style={styles.actionText}>VIEW ORDER DETAILS</Text>
                    </Pressable>
                    {(order.status === 'Pending' || order.status === 'Cancelled') && (
                      <Pressable 
                        style={[styles.cardAction, styles.cardActionDelete]}
                        onPress={() => handleDeleteOrder(order)}
                        disabled={deletingOrderId === (order.mongodbId || order.id)}>
                        <Text style={styles.actionTextDelete}>
                          {deletingOrderId === (order.mongodbId || order.id) ? 'DELETING...' : 'DELETE ORDER'}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            })
          )}
          <View style={{height: 40}} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  // ── Professional Navbar ──
  navbar: {
    backgroundColor: colors.red,
    paddingTop: 12,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...shadow,
    zIndex: 10,
  },
  navTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  navBackBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  navRefreshBtn: {
    padding: 8,
  },
  navSearchSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  navSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
  },
  navSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 10,
    fontWeight: '500',
  },
  navFilterSection: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 4,
  },
  navFilterRow: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  navFilterPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F3F5',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  navFilterPillActive: {
    backgroundColor: colors.red,
    borderColor: colors.red,
  },
  navFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#495057',
  },
  navFilterTextActive: {
    color: '#FFFFFF',
  },

  // ── List & Professional Card ──
  orderList: {
    flex: 1,
  },
  orderListContent: {
    padding: 16,
    paddingTop: 20,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    ...shadow,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardOrderId: {
    fontSize: 15,
    fontWeight: '900',
    color: '#212529',
    letterSpacing: 0.3,
  },
  cardDate: {
    fontSize: 11,
    fontWeight: '600',
    color: '#868E96',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F3F5',
    marginBottom: 12,
  },
  cardBody: {
    marginBottom: 16,
  },
  cardInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardInfoCol: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ADB5BD',
    letterSpacing: 1,
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#495057',
  },
  cardValueAmount: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.red,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cardAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FFE3E3',
    gap: 4,
  },
  cardActionDelete: {
    backgroundColor: '#FFF0F0',
    borderColor: '#FECDD2',
  },
  actionText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.red,
    letterSpacing: 0.5,
  },
  actionTextDelete: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D32F2F',
    letterSpacing: 0.5,
  },

  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loaderText: {
    marginTop: 16,
    fontSize: 14,
    color: colors.muted,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default OrdersPage;
