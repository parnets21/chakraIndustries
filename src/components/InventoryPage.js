import React, {useState} from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {colors, shadow} from './theme';

function InventoryPage({onBack}) {
  const [showFilter, setShowFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const stats = [
    {value: '4', label: 'Total Items', color: colors.red},
    {value: '2', label: 'In Stock', color: '#4CAF50'},
    {value: '1', label: 'Out of Stock', color: '#F44336'},
    {value: '1', label: 'Low Stock', color: '#FFA726'},
  ];

  const products = [
    {
      id: 'SCI001',
      name: 'Steel Rod 12mm',
      sku: 'SCI001',
      stock: 850,
      warehouse: 'Bangalore',
      batch: 'BTH240601',
      status: 'In Stock',
      statusColor: '#4CAF50',
    },
    {
      id: 'SCI002',
      name: 'Cement Bag 50kg',
      sku: 'SCI002',
      stock: 420,
      warehouse: 'Mumbai',
      batch: 'BTH240602',
      status: 'In Stock',
      statusColor: '#4CAF50',
    },
    {
      id: 'SCI003',
      name: 'Paint White 10L',
      sku: 'SCI003',
      stock: 0,
      warehouse: 'Delhi',
      batch: 'BTH240603',
      status: 'Out of Stock',
      statusColor: '#F44336',
    },
    {
      id: 'SCI004',
      name: 'Tiles Ceramic 2x2',
      sku: 'SCI004',
      stock: 15,
      warehouse: 'Chennai',
      batch: 'BTH240604',
      status: 'Low Stock',
      statusColor: '#FFA726',
    },
  ];

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Top Navigation Bar */}
      <View style={styles.topNav}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#FFFFFF" />
        </Pressable>
        <View style={styles.topNavCenter}>
          <Text style={styles.topNavTitle}>Inventory</Text>
          <Icon name="package-variant" size={24} color="#FFFFFF" />
        </View>
        <Pressable 
          style={styles.filterButton}
          onPress={() => setShowFilter(!showFilter)}>
          <Icon name="filter-variant" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Icon name="magnify" size={20} color={colors.muted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search inventory..."
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

      {/* Stats Grid */}
      <View style={styles.statsSection}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statBox}>
            <Text style={[styles.statValue, {color: stat.color}]}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        {filteredProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </ScrollView>
    </View>
  );
}

function ProductCard({product}) {
  const getBorderColor = () => {
    if (product.status === 'In Stock') return '#4CAF50';
    if (product.status === 'Out of Stock') return '#F44336';
    if (product.status === 'Low Stock') return '#FFA726';
    return colors.line;
  };

  return (
    <View style={[styles.productCard, {borderLeftColor: getBorderColor()}]}>
      {/* Product Name and SKU in one row */}
      <View style={styles.cardHeader}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.skuBadge}>{product.sku}</Text>
      </View>

      {/* Available Stock - Large Display */}
      <View style={styles.stockSection}>
        <Text style={styles.stockLabel}>Available Stock</Text>
        <Text style={styles.stockValue}>{product.stock} Units</Text>
      </View>

      {/* Warehouse Row */}
      <View style={styles.detailRow}>
        <Icon name="warehouse" size={16} color={colors.muted} />
        <Text style={styles.detailLabel}>Warehouse :</Text>
        <Text style={styles.detailValue}>{product.warehouse}</Text>
      </View>

      {/* Batch Row */}
      <View style={styles.detailRow}>
        <Icon name="package-variant" size={16} color={colors.muted} />
        <Text style={styles.detailLabel}>Batch :</Text>
        <Text style={styles.detailValue}>{product.batch}</Text>
      </View>

      {/* Status Row - Bottom with label on left, badge on right */}
      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>Status :</Text>
        <View style={[styles.statusBadge, {backgroundColor: product.statusColor + '20'}]}>
          <Text style={[styles.statusText, {color: product.statusColor}]}>
            {product.status}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  topNavLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topNavTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    ...shadow,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 4,
  },
  statLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  content: {
    padding: 20,
    paddingTop: 8,
    backgroundColor: '#FFFFFF',
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.line,
    borderLeftWidth: 5,
    ...shadow,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  productName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
    flex: 1,
  },
  skuBadge: {
    backgroundColor: '#F5F5F5',
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stockSection: {
    marginBottom: 10,
  },
  stockLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  stockValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  detailLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  detailValue: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  statusLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '900',
  },
});

export default InventoryPage;
