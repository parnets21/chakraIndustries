import React, {useState} from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

// ─── Theme ────────────────────────────────────────────────────────────────────
const colors = {
  red: '#D0281A',
  bg: '#F2F0EC',
  text: '#1A1A1A',
  muted: '#888888',
  line: '#E8E4DE',
  green: '#1A7A3C',
  greenLight: '#E4F5EC',
  amber: '#B86A00',
  amberLight: '#FEF3E2',
  teal: '#1A7A6E',
  tealLight: '#E4F5F3',
};

const shadow = {
  shadowColor: '#000',
  shadowOffset: {width: 0, height: 2},
  shadowOpacity: 0.07,
  shadowRadius: 6,
  elevation: 3,
};

// ─── Filter Tabs ──────────────────────────────────────────────────────────────
const FILTERS = ['All', 'Pending', 'Dispatched', 'Delivered'];

// ─── Orders Data ──────────────────────────────────────────────────────────────
const ORDERS = [
  {
    id: 'ORD-2024-4821',
    desc: 'Coconut Oil 1L · 48 units',
    value: '₹42,500',
    units: '48',
    eta: '29 May',
    placed: 'Placed 29 May, 8:15 AM',
    status: 'Dispatched',
    statusColor: colors.teal,
    statusBg: colors.tealLight,
    action: '🚚 Track',
    filter: 'Dispatched',
  },
  {
    id: 'ORD-2024-4803',
    desc: 'Mixed SKU Bulk Order',
    value: '₹1,18,000',
    units: '200+',
    eta: '31 May',
    placed: 'Placed 28 May, 3:45 PM',
    status: 'Processing',
    statusColor: colors.amber,
    statusBg: colors.amberLight,
    action: '📄 Invoice',
    filter: 'Pending',
  },
  {
    id: 'ORD-2024-4790',
    desc: 'Sesame Oil 500ml · 96 units',
    value: '₹67,200',
    units: '96',
    eta: '25 May',
    placed: 'Placed 24 May, 11:00 AM',
    status: 'Delivered',
    statusColor: colors.green,
    statusBg: colors.greenLight,
    action: '☆ Review',
    filter: 'Delivered',
  },
  {
    id: 'ORD-2024-4778',
    desc: 'Mustard Oil 1L · 60 units',
    value: '₹31,800',
    units: '60',
    eta: '22 May',
    placed: 'Placed 20 May, 9:30 AM',
    status: 'Delivered',
    statusColor: colors.green,
    statusBg: colors.greenLight,
    action: '☆ Review',
    filter: 'Delivered',
  },
];

// ─── Order Card ───────────────────────────────────────────────────────────────
function OrderCard({order}) {
  return (
    <View style={styles.card}>
      {/* Top row: order ID + status pill */}
      <View style={styles.cardTop}>
        <View style={styles.cardTopLeft}>
          <Text style={styles.orderId}>{order.id}</Text>
          <Text style={styles.orderDesc}>{order.desc}</Text>
        </View>
        <View style={[styles.statusPill, {backgroundColor: order.statusBg}]}>
          <Text style={[styles.statusText, {color: order.statusColor}]}>
            {order.status}
          </Text>
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{order.value}</Text>
          <Text style={styles.statLabel}>Order value</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{order.units}</Text>
          <Text style={styles.statLabel}>Units</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{order.eta}</Text>
          <Text style={styles.statLabel}>ETA</Text>
        </View>
      </View>

      {/* Bottom row: placed time + action */}
      <View style={styles.cardBottom}>
        <Text style={styles.placedText}>{order.placed}</Text>
        <Pressable>
          <Text style={styles.actionText}>{order.action}</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function OrderManagementSection({onBack}) {
  const [activeFilter, setActiveFilter] = useState('All');

  const filteredOrders =
    activeFilter === 'All'
      ? ORDERS
      : ORDERS.filter(o => o.filter === activeFilter);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>My Orders</Text>
        <Pressable style={styles.searchBtn}>
          <Text style={styles.searchIcon}>🔍</Text>
        </Pressable>
      </View>

      {/* ── Filter Tabs ── */}
      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}>
          {FILTERS.map(f => (
            <Pressable
              key={f}
              onPress={() => setActiveFilter(f)}
              style={[
                styles.filterTab,
                activeFilter === f && styles.filterTabActive,
              ]}>
              <Text
                style={[
                  styles.filterText,
                  activeFilter === f && styles.filterTextActive,
                ]}>
                {f}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* ── Orders List ── */}
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollBody}>
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No orders in this category</Text>
          </View>
        ) : (
          filteredOrders.map(order => (
            <OrderCard key={order.id} order={order} />
          ))
        )}
        <View style={{height: 30}} />
      </ScrollView>

    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  // ── Header ──
  header: {
    height: 56,
    backgroundColor: colors.red,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  backIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginTop: -1,
  },
  headerTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  searchBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIcon: {
    fontSize: 20,
  },

  // ── Filter Tabs ──
  filterWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  filterTab: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: '#FFFFFF',
  },
  filterTabActive: {
    backgroundColor: colors.red,
    borderColor: colors.red,
  },
  filterText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },

  // ── Scroll ──
  scroll: {
    flex: 1,
  },
  scrollBody: {
    padding: 14,
    gap: 12,
  },

  // ── Order Card ──
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    ...shadow,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  cardTopLeft: {
    flex: 1,
    paddingRight: 10,
  },
  orderId: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  orderDesc: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 3,
  },
  statusPill: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
  },

  // ── Stats Row ──
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  statItem: {
    flex: 1,
  },
  statValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  statLabel: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.line,
    marginHorizontal: 10,
  },

  // ── Card Bottom ──
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 12,
  },
  placedText: {
    color: colors.muted,
    fontSize: 12,
  },
  actionText: {
    color: colors.red,
    fontSize: 13,
    fontWeight: '800',
  },

  // ── Empty State ──
  emptyState: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '700',
  },
});

export default OrderManagementSection;