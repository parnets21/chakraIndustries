import React, {useState, useEffect} from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Linking,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {colors, shadow} from './theme';
import dispatchService from '../services/dispatchService';

function DispatchTrackingPage({onBack}) {
  const [activeFilter, setActiveFilter] = useState('All Orders');
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const filters = ['All Orders', 'In Transit', 'Delivered', 'Pending'];

  const fetchShipments = async (query = '') => {
    try {
      setLoading(true);
      const params: any = {};
      if (activeFilter !== 'All Orders') {
        params.status = activeFilter;
      }
      if (query) {
        params.search = query;
      }
      
      const response = await dispatchService.getDispatches(params);
      if (response.success) {
        const transformed = response.data.map(dispatch => {
          let progress = 0;
          let status = 'Pending';
          let statusColor = '#BA7517';
          let statusBg = '#FFF8E1';
          
          if (dispatch.currentStatus === 'Pending' || dispatch.currentStatus === 'Processing') {
            progress = 25;
            status = 'Packing';
          } else if (dispatch.currentStatus === 'Packing') {
            progress = 40;
          } else if (dispatch.currentStatus === 'In Transit') {
            progress = 75;
            status = 'In Transit';
            statusColor = '#FF6F00';
          } else if (dispatch.currentStatus === 'Out for Delivery') {
            progress = 90;
            status = 'Out for Delivery';
            statusColor = '#1976D2';
            statusBg = '#E3F2FD';
          } else if (dispatch.currentStatus === 'Delivered') {
            progress = 100;
            status = 'Delivered';
            statusColor = '#1D9E75';
            statusBg = '#E8F5F0';
          }
          
          const timeline = dispatch.timeline?.map((t, i) => ({
            label: t.status || t.remarks || 'Update',
            time: t.timestamp ? new Date(t.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '',
            completed: i < (dispatch.timeline.length - 1) || dispatch.currentStatus === 'Delivered',
            active: i === (dispatch.timeline.length - 1)
          })) || [];

          return {
            id: dispatch.docketNumber || dispatch._id,
            product: dispatch.orderDetails?.orderNumber || 'Order',
            units: dispatch.items?.length + ' items' || '1 item',
            amount: dispatch.orderDetails?.totalAmount ? `₹${dispatch.orderDetails.totalAmount.toLocaleString('en-IN')}` : '₹0',
            status,
            statusColor,
            statusBg,
            courier: dispatch.courierName || 'Courier',
            awb: dispatch.docketNumber || 'AWB',
            lastUpdate: timeline.length > 0 ? timeline[timeline.length - 1].label + ' · ' + (timeline[timeline.length - 1].time || '') : 'No updates',
            expectedDelivery: dispatch.estimatedDelivery ? new Date(dispatch.estimatedDelivery).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'TBD',
            timeline,
            progress,
          };
        });
        setShipments(transformed);
      }
    } catch (error) {
      console.error('Fetch shipments error:', error);
      Alert.alert('Error', 'Failed to load shipments');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchShipments(searchQuery);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchShipments(searchQuery);
  }, [activeFilter]);

  let filteredShipments = shipments;

  if (searchQuery.trim()) {
    filteredShipments = shipments.filter(s =>
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.courier.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  const stats = [
    {label: 'Total Orders', value: shipments.length, color: colors.text},
    {label: 'In Transit', value: shipments.filter(s => s.status === 'In Transit').length, color: colors.orange},
    {label: 'Out for Delivery', value: shipments.filter(s => s.status === 'Out for Delivery').length, color: '#1976D2'},
    {label: 'Delivered', value: shipments.filter(s => s.status === 'Delivered').length, color: '#1D9E75'},
  ];

  return (
    <View style={styles.container}>
      <View style={styles.topNav}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#FFFFFF" />
        </Pressable>
        <View style={styles.topNavCenter}>
          <Icon name="truck-delivery" size={24} color="#FFFFFF" />
          <Text style={styles.topNavTitle}>Dispatch & Tracking</Text>
        </View>
        <Pressable style={styles.searchBtn} onPress={() => setSearchVisible(!searchVisible)}>
          <Icon name="magnify" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      {searchVisible && (
        <View style={styles.searchBarContainer}>
          <Icon name="magnify" size={20} color={colors.muted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Order ID, Product, or Courier..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={text => {
              setSearchQuery(text);
              fetchShipments(text);
            }}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => { setSearchQuery(''); fetchShipments(''); }}>
              <Icon name="close-circle" size={20} color={colors.muted} />
            </Pressable>
          )}
        </View>
      )}

      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          {stats.map(item => (
            <View key={item.label} style={styles.statCard}>
              <Text style={[styles.statCardValue, {color: item.color}]}>{item.value}</Text>
              <Text style={styles.statCardLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}>
          {filters.map(filter => (
            <Pressable
              key={filter}
              onPress={() => setActiveFilter(filter)}
              style={[
                styles.filterChip,
                activeFilter === filter && styles.filterChipActive,
              ]}>
              <Text
                style={[
                  styles.filterText,
                  activeFilter === filter && styles.filterTextActive,
                ]}>
                {filter}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.red} />
          <Text style={styles.loadingText}>Loading shipments...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.red]} />
          }>
          {filteredShipments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No shipments found</Text>
            </View>
          ) : (
            filteredShipments.map(shipment => (
              <ShipmentCard key={shipment.id} shipment={shipment} />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

function ShipmentCard({shipment}) {
  const [expanded, setExpanded] = useState(false);

  const handleLiveMap = () => {
    Alert.alert(
      'Live Tracking',
      `Opening live map for ${shipment.id}`,
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Open Map', onPress: () => {
          console.log('Opening map for:', shipment.id);
        }},
      ]
    );
  };

  const handleCallDriver = () => {
    Alert.alert(
      'Call Driver',
      `Call driver for ${shipment.courier}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Call', onPress: () => {
          Linking.openURL('tel:+919876543210');
        }},
      ]
    );
  };

  return (
    <View style={styles.shipmentCard}>
      <View style={styles.darkHeader}>
        <View style={styles.headerTop}>
          <Text style={styles.orderId}>{shipment.id}</Text>
          <View style={[styles.statusBadge, {backgroundColor: shipment.statusBg}]}>
            <Text style={[styles.statusText, {color: shipment.statusColor}]}>
              {shipment.status}
            </Text>
          </View>
        </View>
        <Text style={styles.orderDetails}>
          {shipment.product} · {shipment.units} · {shipment.amount}
        </Text>

        <View style={styles.progressSection}>
          <View style={styles.progressSteps}>
            <View style={[styles.progressStep, styles.progressStepCompleted]}>
              <Icon name="check" size={16} color="#FFFFFF" />
            </View>
            <View style={[styles.progressLine, shipment.progress >= 50 && styles.progressLineActive]} />
            <View style={[styles.progressStep, shipment.progress >= 50 && styles.progressStepCompleted]}>
              <Icon name="check" size={16} color="#FFFFFF" />
            </View>
            <View style={[styles.progressLine, shipment.progress >= 75 && styles.progressLineActive]} />
            <View style={[styles.progressStep, shipment.progress >= 75 && styles.progressStepActive]}>
              <Icon name="truck-delivery" size={16} color="#FFFFFF" />
            </View>
            <View style={[styles.progressLine, shipment.progress === 100 && styles.progressLineActive]} />
            <View style={[styles.progressStep, shipment.progress === 100 && styles.progressStepCompleted]}>
              <Icon name="home" size={16} color="#FFFFFF" />
            </View>
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>Confirmed</Text>
            <Text style={styles.progressLabel}>Packed</Text>
            <Text style={[styles.progressLabel, styles.progressLabelActive]}>Dispatched</Text>
            <Text style={styles.progressLabel}>Delivered</Text>
          </View>
        </View>

        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, {width: `${shipment.progress}%`}]} />
        </View>

        <Text style={styles.expectedDelivery}>
          Expected delivery: <Text style={styles.expectedDate}>{shipment.expectedDelivery}</Text>
        </Text>
      </View>

      <View style={styles.courierSection}>
        <View style={styles.courierIcon}>
          <Icon name="truck-delivery" size={24} color={colors.red} />
        </View>
        <View style={styles.courierInfo}>
          <Text style={styles.courierName}>{shipment.courier} · {shipment.awb}</Text>
          <Text style={styles.courierUpdate}>{shipment.lastUpdate}</Text>
        </View>
        <Pressable style={styles.trackBtn}>
          <Icon name="map-marker" size={16} color={colors.red} />
          <Text style={styles.trackBtnText}>Track</Text>
        </Pressable>
      </View>

      {expanded && (
        <View style={styles.timelineSection}>
          <Text style={styles.timelineTitle}>Delivery Timeline</Text>
          <View style={styles.timeline}>
            {shipment.timeline.map((step, index) => (
              <View key={index} style={styles.timelineStep}>
                <View
                  style={[
                    styles.timelineDot,
                    step.completed && styles.timelineDotCompleted,
                    step.active && styles.timelineDotActive,
                  ]}
                />
                {index < shipment.timeline.length - 1 && (
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

          <View style={styles.actionButtons}>
            <Pressable style={styles.actionBtn} onPress={handleLiveMap}>
              <Icon name="map" size={20} color={colors.red} />
              <Text style={styles.actionBtnText}>Live Map</Text>
            </Pressable>
            <Pressable style={styles.actionBtn} onPress={handleCallDriver}>
              <Icon name="phone" size={20} color={colors.red} />
              <Text style={styles.actionBtnText}>Call Driver</Text>
            </Pressable>
          </View>
        </View>
      )}

      <Pressable
        onPress={() => setExpanded(!expanded)}
        style={styles.expandBtn}>
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topNavCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    justifyContent: 'center',
  },
  topNavTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  searchBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBarContainer: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    padding: 0,
  },
  statsContainer: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    ...shadow,
  },
  statCardValue: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 6,
  },
  statCardLabel: {
    fontSize: 10,
    color: colors.muted,
    fontWeight: '600',
    textAlign: 'center',
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
  filterText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  filterTextActive: {
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
    paddingTop: 16,
  },
  shipmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    ...shadow,
  },
  darkHeader: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
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
  orderDetails: {
    color: colors.muted,
    fontSize: 14,
    marginBottom: 20,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressSteps: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressStep: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFCDD2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressStepCompleted: {
    backgroundColor: '#1D9E75',
  },
  progressStepActive: {
    backgroundColor: colors.red,
  },
  progressLine: {
    flex: 1,
    height: 3,
    backgroundColor: '#FFCDD2',
    marginHorizontal: 4,
  },
  progressLineActive: {
    backgroundColor: '#1D9E75',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
    width: 70,
    textAlign: 'center',
  },
  progressLabelActive: {
    color: colors.red,
    fontWeight: '900',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#FFCDD2',
    borderRadius: 3,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.red,
    borderRadius: 3,
  },
  expectedDelivery: {
    color: colors.muted,
    fontSize: 14,
  },
  expectedDate: {
    color: colors.text,
    fontWeight: '900',
  },
  courierSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF5F5',
  },
  courierIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(198, 40, 40, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  courierInfo: {
    flex: 1,
  },
  courierName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  courierUpdate: {
    color: colors.muted,
    fontSize: 12,
  },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(198, 40, 40, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  trackBtnText: {
    color: colors.red,
    fontSize: 13,
    fontWeight: '700',
  },
  timelineSection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  timelineTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 16,
  },
  timeline: {
    paddingLeft: 8,
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
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  timelineLabelActive: {
    color: colors.red,
    fontWeight: '900',
  },
  timelineTime: {
    color: colors.muted,
    fontSize: 13,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(198, 40, 40, 0.1)',
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionBtnText: {
    color: colors.red,
    fontSize: 14,
    fontWeight: '700',
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  expandBtnText: {
    color: colors.red,
    fontSize: 14,
    fontWeight: '700',
  },
});

export default DispatchTrackingPage;
