import React, {useState, useEffect, useCallback} from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const colors = {
  red: '#C62828',
  text: '#212121',
  muted: '#757575',
  green: '#1D9E75',
};

const shadow = {
  shadowColor: '#000',
  shadowOpacity: 0.1,
  shadowRadius: 8,
  shadowOffset: {width: 0, height: 2},
  elevation: 3,
};

// ── API helper ─────────────────────────────────────────────────────────────────
async function fetchFinance(path) {
  try {
    const token = await AsyncStorage.getItem('chakra_token');
    const BASE =
      (await AsyncStorage.getItem('chakra_api_url')) ||
      'https://erp.majesticmall.net/api';
    const res = await fetch(`${BASE}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Request failed');
    return json.data;
  } catch (e) {
    throw e;
  }
}

// ── Main Component ──────────────────────────────────────────────────────────────
function FinanceLedgerSection({onBack}) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState({
    outstanding: 0,
    creditNotes: 0,
    paymentsMadeToday: 0,
    paymentsReceivedToday: 0,
  });

  const loadData = useCallback(async () => {
    setError('');
    try {
      const [historyData, statsData] = await Promise.all([
        fetchFinance('/finance/payment-history'),
        fetchFinance('/finance/dashboard'),
      ]);

      // Map payment history to display format
      const rows = (historyData || []).slice(0, 50).map(item => {
        const isReceipt = item.type === 'Receipt';
        const isPayment = item.type === 'Payment';
        return {
          id: item.id || item._id,
          type: item.type,
          typeColor: isReceipt ? colors.green : isPayment ? '#1976D2' : '#7C3AED',
          typeBg: isReceipt ? '#E8F5F0' : isPayment ? '#E3F2FD' : '#F3E8FF',
          title: item.reference || item.type,
          date: item.date
            ? new Date(item.date).toLocaleDateString('en-IN', {day: 'numeric', month: 'short', year: 'numeric'})
            : '—',
          description: item.party || (item.narration ? item.narration.slice(0, 40) : ''),
          amount: isReceipt
            ? `+₹${Number(item.amount || 0).toLocaleString('en-IN')}`
            : `-₹${Number(item.amount || 0).toLocaleString('en-IN')}`,
          amountColor: isReceipt ? colors.green : colors.red,
          status: item.source === 'Tally' ? 'Tally' : 'Confirmed',
          statusColor: item.source === 'Tally' ? '#1D9E75' : colors.green,
          statusBg: item.source === 'Tally' ? '#E8F5F0' : '#E8F5F0',
          source: item.source || 'ERP',
        };
      });

      setTransactions(rows);

      if (statsData) {
        setSummary({
          outstanding:
            (statsData.totalAccountsPayable || 0) +
            (statsData.totalAccountsReceivable || 0),
          creditNotes: 0,
          paymentsMadeToday: statsData.paymentsMadeToday || 0,
          paymentsReceivedToday: statsData.paymentsReceivedToday || 0,
        });
      }
    } catch (e) {
      setError(e.message || 'Failed to load finance data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const filteredTransactions =
    activeFilter === 'All'
      ? transactions
      : activeFilter === 'Invoices'
      ? transactions.filter(t => t.type === 'Invoice')
      : activeFilter === 'Payments'
      ? transactions.filter(t => t.type === 'Payment')
      : activeFilter === 'Receipts'
      ? transactions.filter(t => t.type === 'Receipt')
      : activeFilter === 'Journal'
      ? transactions.filter(t => t.type === 'Journal')
      : transactions.filter(t => t.type === 'Contra');

  const handleExportPDF = () => {
    Alert.alert('Export PDF', 'Download transaction history as PDF?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Download', onPress: () => Alert.alert('Info', 'PDF export coming soon')},
    ]);
  };

  const handleFilter = () => {
    Alert.alert('Filter', 'Use the filter chips above to narrow transactions by type.');
  };

  if (loading) {
    return (
      <View style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
        <ActivityIndicator size="large" color={colors.red} />
        <Text style={{color: colors.muted, marginTop: 12, fontSize: 14}}>Loading finance data…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Navigation */}
      <View style={styles.topNav}>
        <View style={styles.topNavLeft}>
          <Pressable style={styles.backBtn} onPress={onBack}>
            <Icon name="arrow-left" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.topNavTitle}>Finance & Ledger</Text>
        </View>
        <View style={styles.topNavRight}>
          <Pressable style={styles.iconBtn} onPress={() => { setLoading(true); loadData(); }}>
            <Icon name="refresh" size={22} color="#FFFFFF" />
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={handleFilter}>
            <Icon name="filter-variant" size={24} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      {/* Summary Section */}
      <View style={styles.outstandingSection}>
        <Text style={styles.outstandingLabel}>TOTAL OUTSTANDING</Text>
        <Text style={styles.outstandingAmount}>
          ₹{Number(summary.outstanding).toLocaleString('en-IN')}
        </Text>

        {error ? (
          <View style={styles.errorBanner}>
            <Icon name="alert-circle-outline" size={16} color="#FFF" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>PAYMENTS TODAY</Text>
            <Text style={styles.summaryValue}>{summary.paymentsMadeToday}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>RECEIPTS TODAY</Text>
            <Text style={[styles.summaryValue, {color: '#A5D6A7'}]}>
              {summary.paymentsReceivedToday}
            </Text>
          </View>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}>
          {['All', 'Payments', 'Receipts', 'Journal', 'Contra'].map(filter => (
            <Pressable
              key={filter}
              onPress={() => setActiveFilter(filter)}
              style={[
                styles.filterChip,
                activeFilter === filter && styles.filterChipActive,
              ]}>
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === filter && styles.filterChipTextActive,
                ]}>
                {filter}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Transaction History Header */}
      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>Transaction history</Text>
        <Pressable onPress={handleExportPDF}>
          <Text style={styles.exportText}>Export PDF</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.red]} />
        }>
        {filteredTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="file-document-outline" size={48} color={colors.muted} />
            <Text style={styles.emptyText}>No transactions found.</Text>
            <Text style={styles.emptySubtext}>Pull down to refresh or sync Tally data.</Text>
          </View>
        ) : (
          filteredTransactions.map(transaction => (
            <TransactionCard key={transaction.id} transaction={transaction} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function TransactionCard({transaction}) {
  return (
    <View style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <View style={[styles.typeBadge, {backgroundColor: transaction.typeBg}]}>
          <Text style={[styles.typeText, {color: transaction.typeColor}]}>
            {transaction.type}
          </Text>
        </View>
        <Text style={[styles.transactionAmount, {color: transaction.amountColor}]}>
          {transaction.amount}
        </Text>
      </View>

      <Text style={styles.transactionTitle}>{transaction.title}</Text>
      <Text style={styles.transactionDescription}>
        {transaction.date}
        {transaction.description ? ` · ${transaction.description}` : ''}
      </Text>

      <View style={styles.transactionFooter}>
        <View style={[styles.statusBadge, {backgroundColor: transaction.statusBg}]}>
          <Text style={[styles.statusText, {color: transaction.statusColor}]}>
            {transaction.status}
          </Text>
        </View>
        {transaction.source === 'Tally' && (
          <View style={styles.tallyBadge}>
            <Text style={styles.tallyBadgeText}>Tally</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  topNav: {
    backgroundColor: colors.red,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadow,
  },
  topNavLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topNavTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  topNavRight: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outstandingSection: {
    backgroundColor: colors.red,
    padding: 20,
    paddingBottom: 24,
  },
  outstandingLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  outstandingAmount: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '900',
    marginBottom: 12,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 8,
    padding: '8px 12px',
    marginBottom: 12,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 12,
    flex: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  filterSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterRow: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: colors.red,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
  },
  exportText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.red,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.muted,
  },
  emptySubtext: {
    fontSize: 13,
    color: colors.muted,
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...shadow,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: '900',
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  transactionDescription: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: 12,
  },
  transactionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
  },
  tallyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: '#E8F5F0',
  },
  tallyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.green,
  },
});

export default FinanceLedgerSection;
