import React, { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, shadow } from './theme';
import orderService from '../services/orderService';

// ─── Status helpers ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  Pending:              { color: '#F59E0B', bg: '#FEF3C7', icon: 'clock-outline' },
  Approved:             { color: '#3B82F6', bg: '#DBEAFE', icon: 'check-circle-outline' },
  Processing:           { color: '#8B5CF6', bg: '#EDE9FE', icon: 'cog-outline' },
  'Ready For Dispatch': { color: '#06B6D4', bg: '#CFFAFE', icon: 'package-variant-closed' },
  Shipped:              { color: '#F97316', bg: '#FFEDD5', icon: 'truck-delivery-outline' },
  'In Transit':         { color: '#F97316', bg: '#FFEDD5', icon: 'truck-fast-outline' },
  Delivered:            { color: '#10B981', bg: '#D1FAE5', icon: 'check-decagram' },
  Cancelled:            { color: '#EF4444', bg: '#FEE2E2', icon: 'close-circle-outline' },
};

const getStatusCfg = (status) =>
  STATUS_CONFIG[status] || { color: colors.muted, bg: '#F3F4F6', icon: 'help-circle-outline' };

// All positive stages in timeline order
const TIMELINE_STAGES = [
  'Pending',
  'Approved',
  'Processing',
  'Ready For Dispatch',
  'Shipped',
  'Delivered',
];

// ─── Component ─────────────────────────────────────────────────────────────────
function OrderDetailPage({ orderId, onBack, onRepeatOrder }) {
  const [order,      setOrder]      = useState(null);
  const [trackData,  setTrackData]  = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [repeating,  setRepeating]  = useState(false);
  const [activeTab,  setActiveTab]  = useState('details'); // 'details' | 'track'

  const fetchOrderData = useCallback(async () => {
    try {
      const [orderRes, trackRes] = await Promise.all([
        orderService.getOrderById(orderId),
        orderService.trackOrder(orderId),
      ]);
      if (orderRes.success) setOrder(orderRes.data);
      if (trackRes.success) setTrackData(trackRes.data);
    } catch (error) {
      console.error('fetchOrderData error:', error);
      Alert.alert('Error', 'Failed to load order details. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrderData();
  }, [fetchOrderData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrderData();
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Order',
      `Are you sure you want to cancel order ${order?.id}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelling(true);
              const res = await orderService.cancelOrder(orderId, 'Cancelled by dealer');
              if (res.success) {
                Alert.alert('Order Cancelled', 'Your order has been cancelled successfully.');
                fetchOrderData(); // Refresh to show updated status
              } else {
                Alert.alert('Error', res.message || 'Failed to cancel order');
              }
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to cancel order');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const handleRepeat = async () => {
    try {
      setRepeating(true);
      const res = await orderService.repeatOrder(orderId);
      if (res.success) {
        Alert.alert(
          '✅ Order Repeated',
          `New order ${res.data?.orderId} has been placed successfully.`,
          [{ text: 'View Orders', onPress: onBack }]
        );
        if (onRepeatOrder) onRepeatOrder(res.data?.orderId);
      } else {
        Alert.alert('Error', res.message || 'Failed to repeat order');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to repeat order');
    } finally {
      setRepeating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.red} />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle-outline" size={64} color={colors.muted} />
        <Text style={styles.errorTitle}>Order Not Found</Text>
        <Pressable style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const statusCfg      = getStatusCfg(order.status);
  const canBeCancelled = !['Delivered', 'Cancelled', 'Shipped', 'In Transit'].includes(order.status);
  const formattedDate  = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : 'N/A';

  const lineItems = order.lineItems || [];

  return (
    <View style={styles.container}>
      {/* ── Top Nav ─────────────────────────────────────────────────────── */}
      <View style={styles.topNav}>
        <Pressable onPress={onBack} style={styles.navBack}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </Pressable>
        <View style={styles.navCenter}>
          <Text style={styles.navTitle}>Order Details</Text>
          <Text style={styles.navSubtitle}>{order.id}</Text>
        </View>
        <Pressable onPress={onRefresh} style={styles.navRefresh}>
          <Icon name="refresh" size={22} color="#fff" />
        </Pressable>
      </View>

      {/* ── Tab Bar ─────────────────────────────────────────────────────── */}
      <View style={styles.tabBar}>
        {['details', 'track'].map((tab) => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Icon
              name={tab === 'details' ? 'file-document-outline' : 'map-marker-path'}
              size={18}
              color={activeTab === tab ? colors.red : colors.muted}
            />
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'details' ? 'Details' : 'Track Order'}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.red]} />}
        contentContainerStyle={styles.scroll}
      >
        {activeTab === 'details' ? (
          <DetailsTab order={order} lineItems={lineItems} statusCfg={statusCfg} formattedDate={formattedDate} />
        ) : (
          <TrackTab order={order} trackData={trackData} />
        )}

        {/* ── Action Buttons ───────────────────────────────────────────── */}
        <View style={styles.actionsRow}>
          {canBeCancelled && (
            <Pressable
              style={[styles.actionBtn, styles.cancelBtn]}
              onPress={handleCancel}
              disabled={cancelling}
            >
              {cancelling
                ? <ActivityIndicator size="small" color={colors.red} />
                : <Icon name="close-circle-outline" size={18} color={colors.red} />
              }
              <Text style={[styles.actionBtnText, { color: colors.red }]}>
                {cancelling ? 'Cancelling...' : 'Cancel Order'}
              </Text>
            </Pressable>
          )}

          <Pressable
            style={[styles.actionBtn, styles.repeatBtn]}
            onPress={handleRepeat}
            disabled={repeating}
          >
            {repeating
              ? <ActivityIndicator size="small" color="#fff" />
              : <Icon name="repeat" size={18} color="#fff" />
            }
            <Text style={[styles.actionBtnText, { color: '#fff' }]}>
              {repeating ? 'Placing...' : 'Repeat Order'}
            </Text>
          </Pressable>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Details Tab ───────────────────────────────────────────────────────────────
function DetailsTab({ order, lineItems, statusCfg, formattedDate }) {
  return (
    <>
      {/* Status Banner */}
      <View style={[styles.statusBanner, { backgroundColor: statusCfg.bg }]}>
        <Icon name={statusCfg.icon} size={32} color={statusCfg.color} />
        <View style={styles.statusBannerText}>
          <Text style={[styles.statusBannerLabel, { color: statusCfg.color }]}>
            {order.status}
          </Text>
          <Text style={styles.statusBannerDate}>{formattedDate}</Text>
        </View>
      </View>

      {/* Order Info Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Order Information</Text>
        <InfoRow label="Order ID"      value={order.id} />
        <InfoRow label="Date & Time"   value={formattedDate} />
        <InfoRow label="Priority"      value={order.priority || 'Normal'} />
        <InfoRow label="Source"        value={order.source || 'DealerApp'} />
        {order.deliveryAddress ? (
          <InfoRow label="Delivery To" value={order.deliveryAddress} />
        ) : null}
        {order.notes ? (
          <InfoRow label="Notes" value={order.notes} />
        ) : null}
      </View>

      {/* Line Items */}
      {lineItems.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ordered Products ({lineItems.length})</Text>
          {lineItems.map((item, idx) => (
            <View key={item._id || idx} style={[styles.lineItem, idx > 0 && styles.lineItemBorder]}>
              <View style={styles.lineItemIcon}>
                <Icon name="package-variant" size={20} color={colors.red} />
              </View>
              <View style={styles.lineItemInfo}>
                <Text style={styles.lineItemName}>{item.name}</Text>
                <Text style={styles.lineItemSku}>SKU: {item.sku}</Text>
                <View style={styles.lineItemMeta}>
                  <Text style={styles.lineItemQty}>Qty: {item.quantity}</Text>
                  <Text style={styles.lineItemPrice}>
                    @ ₹{Number(item.unitPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Text>
                  {item.gstPercent > 0 && (
                    <Text style={styles.lineItemGst}>GST {item.gstPercent}%</Text>
                  )}
                </View>
              </View>
              <Text style={styles.lineItemTotal}>
                ₹{Number(item.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Order Summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Order Summary</Text>
        <SummaryRow label="Subtotal"     value={`₹${Number(order.subTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} />
        <SummaryRow label="GST"          value={`₹${Number(order.totalGst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} />
        <View style={styles.summaryDivider} />
        <SummaryRow
          label="Total Amount"
          value={`₹${Number(order.value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          bold
          valueColor={colors.red}
        />
      </View>
    </>
  );
}

// ─── Track Tab ────────────────────────────────────────────────────────────────
function TrackTab({ order, trackData }) {
  const stages = trackData?.stages || [];
  const history = trackData?.history || [];

  // If no track data yet, show a basic pending state
  if (!trackData) {
    return (
      <View style={[styles.card, { alignItems: 'center', paddingVertical: 32 }]}>
        <Icon name="map-marker-path" size={48} color={colors.muted} />
        <Text style={{ color: colors.muted, marginTop: 12, fontWeight: '600' }}>
          Tracking info not available yet
        </Text>
      </View>
    );
  }

  return (
    <>
      {/* Live Status */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Live Order Status</Text>
        <View style={styles.liveStatus}>
          <Icon name="map-marker-radius" size={20} color={colors.red} />
          <Text style={styles.liveStatusText}>
            Current Status:{' '}
            <Text style={{ color: colors.red, fontWeight: '900' }}>{order.status}</Text>
          </Text>
        </View>
      </View>

      {/* Stage Timeline */}
      {stages.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Progress</Text>
          {stages.map((s, idx) => {
            const cfg = getStatusCfg(s.stage);
            return (
              <View key={s.stage} style={styles.timelineRow}>
                {/* Connector line */}
                <View style={styles.timelineLeft}>
                  <View style={[
                    styles.timelineDot,
                    s.completed && { backgroundColor: cfg.color, borderColor: cfg.color },
                    s.active && styles.timelineDotActive,
                  ]}>
                    {s.completed && (
                      <Icon
                        name={s.active ? cfg.icon : 'check'}
                        size={12}
                        color="#fff"
                      />
                    )}
                  </View>
                  {idx < stages.length - 1 && (
                    <View style={[
                      styles.timelineConnector,
                      s.completed && { backgroundColor: cfg.color },
                    ]} />
                  )}
                </View>
                {/* Content */}
                <View style={styles.timelineContent}>
                  <Text style={[
                    styles.timelineStage,
                    s.active && { color: cfg.color, fontWeight: '900' },
                    !s.completed && !s.active && { color: colors.muted },
                  ]}>
                    {s.stage}
                  </Text>
                  {s.at && (
                    <Text style={styles.timelineDate}>
                      {new Date(s.at).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </Text>
                  )}
                  {s.note ? <Text style={styles.timelineNote}>{s.note}</Text> : null}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* History Log */}
      {history.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Status History</Text>
          {[...history].reverse().map((h, idx) => {
            const cfg = getStatusCfg(h.status);
            return (
              <View key={idx} style={[styles.historyRow, idx > 0 && { borderTopWidth: 1, borderTopColor: '#F1F3F5', paddingTop: 10, marginTop: 10 }]}>
                <View style={[styles.historyDot, { backgroundColor: cfg.color }]} />
                <View style={styles.historyContent}>
                  <Text style={[styles.historyStatus, { color: cfg.color }]}>{h.status}</Text>
                  {h.at && (
                    <Text style={styles.historyDate}>
                      {new Date(h.at).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </Text>
                  )}
                  {h.note ? <Text style={styles.historyNote}>{h.note}</Text> : null}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </>
  );
}

// ─── Small shared components ───────────────────────────────────────────────────
function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function SummaryRow({ label, value, bold, valueColor }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, bold && { fontWeight: '900', color: '#212529' }]}>{label}</Text>
      <Text style={[styles.summaryValue, bold && { fontWeight: '900', fontSize: 16 }, valueColor && { color: valueColor }]}>
        {value}
      </Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
  },
  loadingText: {
    marginTop: 16,
    color: colors.muted,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#F0F2F5',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
    marginTop: 16,
    marginBottom: 24,
  },
  backBtn: {
    backgroundColor: colors.red,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },

  // ── Nav ──
  topNav: {
    backgroundColor: colors.red,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...shadow,
  },
  navBack: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  navCenter: {
    flex: 1,
    marginLeft: 12,
  },
  navTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '900',
  },
  navSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 1,
  },
  navRefresh: {
    padding: 8,
  },

  // ── Tabs ──
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    gap: 6,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.red,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted,
  },
  tabTextActive: {
    color: colors.red,
  },

  scroll: {
    padding: 16,
  },

  // ── Status Banner ──
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 14,
  },
  statusBannerText: {
    flex: 1,
  },
  statusBannerLabel: {
    fontSize: 18,
    fontWeight: '900',
  },
  statusBannerDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },

  // ── Card ──
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    ...shadow,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#212529',
    marginBottom: 14,
  },

  // ── Info rows ──
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    flex: 1,
  },
  infoValue: {
    fontSize: 13,
    color: '#212529',
    fontWeight: '700',
    flex: 2,
    textAlign: 'right',
  },

  // ── Line items ──
  lineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  lineItemBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F1F3F5',
  },
  lineItemIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(198,40,40,0.08)',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 10,
  },
  lineItemInfo: {
    flex: 1,
  },
  lineItemName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#212529',
    marginBottom: 2,
  },
  lineItemSku: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  lineItemMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  lineItemQty: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  lineItemPrice: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
  },
  lineItemGst: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8B5CF6',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  lineItemTotal: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.red,
    marginLeft: 8,
    alignSelf: 'center',
  },

  // ── Summary ──
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 13,
    color: '#212529',
    fontWeight: '700',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E9ECEF',
    marginVertical: 8,
  },

  // ── Track ──
  liveStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  timelineLeft: {
    alignItems: 'center',
    width: 28,
    marginRight: 12,
  },
  timelineDot: {
    width: 28, height: 28,
    borderRadius: 14,
    backgroundColor: '#E9ECEF',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotActive: {
    shadowColor: colors.red,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    minHeight: 20,
    backgroundColor: '#E9ECEF',
    marginVertical: 2,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 16,
  },
  timelineStage: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  timelineDate: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  timelineNote: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 3,
    fontStyle: 'italic',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  historyDot: {
    width: 10, height: 10, borderRadius: 5,
    marginTop: 4,
  },
  historyContent: {
    flex: 1,
  },
  historyStatus: {
    fontSize: 13,
    fontWeight: '800',
  },
  historyDate: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  historyNote: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },

  // ── Action buttons ──
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  cancelBtn: {
    backgroundColor: '#FFF5F5',
    borderWidth: 2,
    borderColor: colors.red,
  },
  repeatBtn: {
    backgroundColor: colors.red,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
});

export default OrderDetailPage;
