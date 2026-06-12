import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  RefreshControl
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {colors, shadow} from './theme';
import inventoryService from '../services/inventoryService';

function InventoryPage({onBack, onProductSelect}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchItems = async (search = '') => {
    try {
      setLoading(true);
      const params = search ? { search: search } : {};
      const response = await inventoryService.getInventory(params);
      console.log('Inventory response:', response);
      if (response.success) {
        setItems(response.data || []);
      } else {
        Alert.alert('Error', response.message || 'Failed to load inventory');
      }
    } catch (error) {
      console.error('Fetch inventory error:', error);
      Alert.alert('Error', 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchItems(searchQuery);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchItems(searchQuery);
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    if (status === 'In Stock') return '#1D9E75';
    if (status === 'Out of Stock') return '#F44336';
    if (status === 'Low Stock') return '#BA7517';
    return colors.line;
  };

  return (
    <View style={styles.container}>
      <View style={styles.topNav}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#FFFFFF" />
        </Pressable>
        <View style={styles.topNavCenter}>
          <Text style={styles.topNavTitle}>Inventory</Text>
          <Icon name="package-variant" size={24} color="#FFFFFF" />
        </View>
        <View style={{width: 40}} />
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Icon name="magnify" size={20} color={colors.muted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search products..."
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Icon name="close-circle" size={20} color={colors.muted} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.red]} />
        }
      >
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.red} />
            <Text style={styles.loadingText}>Loading products...</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="package-variant-closed" size={48} color={colors.muted} />
            <Text style={styles.emptyText}>No products found</Text>
          </View>
        ) : (
          items.map((item, index) => {
            const itemKey = `item-${item.id || index}`;
            const status = item.stockStatus || 'In Stock';
            
            return (
            <Pressable key={itemKey} style={styles.itemCard} onPress={() => onProductSelect && onProductSelect(item)}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.name || 'Product'}</Text>
                <Text style={styles.itemSku}>{item.sku || ''}</Text>
              </View>
              
              <View style={styles.itemDetails}>
                <View style={styles.detailRow}>
                  <Icon name="package-variant" size={16} color={colors.muted} />
                  <Text style={styles.detailLabel}>Stock:</Text>
                  <Text style={[styles.stockValue, (item.stock || 0) === 0 ? {color: '#F44336'} : {color: '#1D9E75'}]}>
                    {item.stock || 0} pcs
                  </Text>
                </View>
                
                {item.price !== undefined && (
                  <View style={styles.detailRow}>
                    <Icon name="cash" size={16} color={colors.muted} />
                    <Text style={styles.detailLabel}>Price:</Text>
                    <Text style={styles.priceValue}>₹{item.price || 0}</Text>
                  </View>
                )}

                {item.moq && (
                  <View style={styles.detailRow}>
                    <Icon name="alert-circle" size={16} color={colors.muted} />
                    <Text style={styles.detailLabel}>MOQ:</Text>
                    <Text style={styles.detailValue}>{item.moq}</Text>
                  </View>
                )}

                {item.category && (
                  <View style={styles.detailRow}>
                    <Icon name="folder" size={16} color={colors.muted} />
                    <Text style={styles.detailLabel}>Category:</Text>
                    <Text style={styles.detailValue}>{item.category}</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Status:</Text>
                <View style={[styles.statusBadge, {backgroundColor: getStatusColor(status) + '20'}]}>
                  <Text style={[styles.statusText, {color: getStatusColor(status)}]}>
                    {status}
                  </Text>
                </View>
              </View>
            </Pressable>
          )})
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingWrap: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topNavCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  topNavTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: colors.line,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    marginLeft: 10,
  },
  content: {
    padding: 20,
    paddingTop: 8,
    backgroundColor: '#FFFFFF',
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadow,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    flex: 1,
    marginRight: 8,
  },
  itemSku: {
    backgroundColor: '#F5F5F5',
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  itemDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  detailLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    width: 80,
  },
  detailValue: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  stockValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  priceValue: {
    color: colors.red,
    fontSize: 16,
    fontWeight: '900',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  statusLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '900',
  },
});

export default InventoryPage;
