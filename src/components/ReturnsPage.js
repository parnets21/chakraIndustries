import React, {useState, useEffect} from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {colors, shadow} from './theme';
import returnService from '../services/returnService';

function ReturnsPage({onBack}) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [expandedCard, setExpandedCard] = useState(null);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReturns = async (filter = 'All') => {
    try {
      setLoading(true);
      const params = {};
      if (filter !== 'All') {
        params.status = filter;
      }
      const response = await returnService.getReturns(params);
      if (response.success) {
        const transformed = response.data.map((r) => {
        let status = 'In Transit';
        let statusColor = '#BA7517';
        let statusBg = '#FFF8E1';
        
        if (r.currentStatus === 'Delivered') {
          status = 'Closed';
          statusColor = '#1D9E75';
          statusBg = '#E8F5F0';
        }
        
        const timeline = r.timeline?.map((t, i) => ({
            label: t.status || t.remarks || 'Update',
            time: t.timestamp ? new Date(t.timestamp).toLocaleDateString('en-IN', {day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'}) : '',
            completed: i < (r.timeline.length - 1) || r.currentStatus === 'Delivered',
            active: i === (r.timeline.length - 1)
          })) || [];
          
          return {
            id: r.docketNumber || r._id,
            reason: r.returnType || 'Return request',
            units: 'Multiple items',
            amount: r.totalAmount ? `₹${r.totalAmount.toLocaleString('en-IN')}` : '₹0',
            status,
            statusColor,
            statusBg,
            docket: r.docketNumber,
            courier: r.courierName || 'Courier',
            creditNote: r.creditNote,
            creditAmount: r.creditNoteAmount ? `₹${r.creditNoteAmount.toLocaleString('en-IN')}` : null,
            timeline
          };
        });
        setReturns(transformed);
      }
    } catch (error) {
      console.error('Fetch returns error:', error);
      Alert.alert('Error', 'Failed to load returns');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReturns(activeFilter);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchReturns(activeFilter);
  }, [activeFilter]);

  const filteredReturns = returns;
  
  const stats = {
    total: returns.length,
    inTransit: returns.filter((r: any) => r.status === 'In Transit').length,
    closed: returns.filter((r: any) => r.status === 'Closed').length,
  };

  const latestCreditNote = returns.find((r: any) => r.creditNote) || null;

  const handleNewReturn = () => {
    Alert.alert(
      'Raise New Return Request',
      'Select order to raise return request',
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Continue', onPress: () => console.log('New return')},
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Navigation */}
      <View style={styles.topNav}>
        <View style={styles.topNavLeft}>
          <Pressable style={styles.backBtn} onPress={onBack}>
            <Icon name="arrow-left" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.topNavTitle}>Returns</Text>
        </View>
        <Pressable style={styles.addBtn} onPress={handleNewReturn}>
          <Icon name="plus" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Stats Section */}
      <View style={styles.statsSection}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total returns</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, {color: colors.red}]}>{stats.inTransit}</Text>
          <Text style={styles.statLabel}>In transit</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, {color: colors.green}]}>{stats.closed}</Text>
          <Text style={styles.statLabel}>Closed</Text>
        </View>
      </View>

      {/* Credit Note Banner */}
      {latestCreditNote && (
        <View style={styles.creditBanner}>
          <Icon name="check-circle" size={24} color="#1D9E75" />
          <View style={styles.creditBannerText}>
            <Text style={styles.creditBannerTitle}>
              Credit note {latestCreditNote.creditNote} applied
            </Text>
            <Text style={styles.creditBannerSubtitle}>
              {latestCreditNote.creditAmount} added to your ledger
            </Text>
          </View>
        </View>
      )}

      {/* Active Returns Section */}
      <View style={styles.activeReturnsHeader}>
        <Text style={styles.activeReturnsTitle}>Active returns</Text>
        <View style={styles.filterChips}>
          {['All', 'In Transit', 'Closed'].map(filter => (
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
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.red} />
          <Text style={styles.loadingText}>Loading returns...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.red]} />
          }>
          {filteredReturns.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No returns found</Text>
            </View>
          ) : (
            filteredReturns.map((returnItem: any) => (
              <ReturnCard
                key={returnItem.id}
                returnItem={returnItem}
                expanded={expandedCard === returnItem.id}
                onToggle={() =>
                  setExpandedCard(expandedCard === returnItem.id ? null : returnItem.id)
                }
              />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

function ReturnCard({returnItem, expanded, onToggle}) {
  return (
    <View style={styles.returnCard}>
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <Text style={styles.returnId}>{returnItem.id}</Text>
        <View style={[styles.statusBadge, {backgroundColor: returnItem.statusBg}]}>
          <Text style={[styles.statusText, {color: returnItem.statusColor}]}>
            {returnItem.status}
          </Text>
        </View>
      </View>

      <Text style={styles.returnDetails}>
        {returnItem.reason} · {returnItem.units} · {returnItem.amount}
      </Text>

      <Text style={styles.docketInfo}>
        Docket: <Text style={styles.docketBold}>{returnItem.docket}</Text> · {returnItem.courier}
      </Text>

      {/* Timeline - Show first 3 or all based on expanded state */}
      <View style={styles.timeline}>
        {returnItem.timeline.slice(0, expanded ? returnItem.timeline.length : 3).map((step: any, index: number) => (
          <View key={index} style={styles.timelineStep}>
            <View
              style={[
                styles.timelineDot,
                step.completed && styles.timelineDotCompleted,
                step.active && styles.timelineDotActive,
              ]}
            />
            {index < (expanded ? returnItem.timeline.length : 3) - 1 && (
              <View
                style={[
                  styles.timelineLine,
                  step.completed && styles.timelineLineCompleted,
                ]}
              />
            )}
            <View style={styles.timelineContent}>
              <Text
                style={[
                  styles.timelineLabel,
                  step.active && styles.timelineLabelActive,
                ]}>
                {step.label}
              </Text>
              <Text style={styles.timelineTime}>{step.time}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Credit Note Info */}
      {returnItem.creditNote && expanded && (
        <View style={styles.creditNoteBox}>
          <Icon name="check-circle" size={20} color="#1D9E75" />
          <View style={styles.creditNoteInfo}>
            <Text style={styles.creditNoteText}>
              Credit Note: {returnItem.creditNote}
            </Text>
            <Text style={styles.creditNoteAmount}>{returnItem.creditAmount} applied to ledger</Text>
          </View>
        </View>
      )}

      {/* Expand Button */}
      <Pressable style={styles.expandBtn} onPress={onToggle}>
        <Text style={styles.expandBtnText}>
          {expanded ? 'Show Less' : 'View Details'}
        </Text>
        <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.red} />
      </Pressable>
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
    fontSize: 24,
    fontWeight: '900',
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsSection: {
    flexDirection: 'row',
    backgroundColor: colors.red,
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: '600',
    textAlign: 'center',
  },
  creditBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4F4E8',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  creditBannerText: {
    flex: 1,
  },
  creditBannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A5D42',
    marginBottom: 4,
  },
  creditBannerSubtitle: {
    fontSize: 14,
    color: '#2D7A5F',
    fontWeight: '600',
  },
  activeReturnsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  activeReturnsTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text,
  },
  filterChips: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    padding: 20,
    paddingTop: 8,
  },
  returnCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    ...shadow,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  returnId: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
  },
  returnDetails: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: 8,
  },
  docketInfo: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: 16,
  },
  docketBold: {
    fontWeight: '800',
    color: colors.text,
  },
  timeline: {
    paddingLeft: 8,
    marginBottom: 16,
  },
  timelineStep: {
    flexDirection: 'row',
    position: 'relative',
    marginBottom: 4,
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
    marginRight: 16,
    marginTop: 4,
    zIndex: 2,
  },
  timelineDotCompleted: {
    backgroundColor: '#1D9E75',
  },
  timelineDotActive: {
    backgroundColor: colors.red,
  },
  timelineLine: {
    position: 'absolute',
    left: 7,
    top: 20,
    width: 2,
    height: 32,
    backgroundColor: '#E0E0E0',
  },
  timelineLineCompleted: {
    backgroundColor: '#1D9E75',
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 16,
  },
  timelineLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  timelineLabelActive: {
    color: colors.red,
    fontWeight: '900',
  },
  timelineTime: {
    fontSize: 13,
    color: colors.muted,
  },
  creditNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5F0',
    padding: 12,
    borderRadius: 12,
    gap: 12,
    marginBottom: 12,
  },
  creditNoteInfo: {
    flex: 1,
  },
  creditNoteText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  creditNoteAmount: {
    fontSize: 13,
    color: '#1D9E75',
    fontWeight: '800',
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  expandBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.red,
  },
});

export default ReturnsPage;
