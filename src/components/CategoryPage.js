import React, {useState, useEffect} from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {colors, shadow} from './theme';
import inventoryService from '../services/inventoryService';

function CategoryPage({onBack}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProducts = async (search = '') => {
    try {
      setLoading(true);
      const params = search ? { search } : {};
      const response = await inventoryService.getInventory(params);
      if (response.success) {
        setProducts(response.data || []);
      } else {
        Alert.alert('Error', response.message || 'Failed to load products');
      }
    } catch (error) {
      console.error('Fetch products error:', error);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProducts(searchQuery);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts(searchQuery);
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    if (status === 'In Stock') return '#1D9E75';
    if (status === 'Out of Stock') return '#F44336';
    if (status === 'Low Stock') return '#BA7517';
    return colors.line;
  };

  const displayedProducts = showAllProducts 
    ? products 
    : products.slice(0, 6);

  return (
    <View style={styles.container}>
      {/* Top Navigation Bar */}
      <View style={styles.topNav}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.topNavTitle}>Product Category</Text>
        <Pressable>
          <Icon name="cart-outline" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Icon name="magnify" size={20} color={colors.muted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search SKU, product, brand..."
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
          />
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.red]} />
        }
        contentContainerStyle={styles.content}
      >
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.red} />
            <Text style={styles.loadingText}>Loading products...</Text>
          </View>
        ) : products.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="package-variant-closed" size={48} color={colors.muted} />
            <Text style={styles.emptyText}>No products found</Text>
          </View>
        ) : (
          <>
            {/* Product Count */}
            <View style={styles.resultHeader}>
              <Text style={styles.resultText}>
                Showing {displayedProducts.length} products
              </Text>
            </View>

            {/* All Products Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>All Products</Text>
                {products.length > 6 && (
                  <Pressable onPress={() => setShowAllProducts(!showAllProducts)}>
                    <Text style={styles.viewAllText}>
                      {showAllProducts ? 'Show less' : 'View all'} →
                    </Text>
                  </Pressable>
                )}
              </View>

              {displayedProducts.map(product => (
                <View key={product.id || product._id} style={styles.productListCard}>
                  <View
                    style={[
                      styles.stockIndicator,
                      {backgroundColor: getStatusColor(product.status)},
                    ]}
                  />
                  <View style={styles.productListIconWrap}>
                    <Icon name="package-variant" size={32} color={colors.red} />
                  </View>
                  <View style={styles.productListInfo}>
                    <Text style={styles.productListName}>{product.name}</Text>
                    <Text style={styles.productListSku}>SKU: {product.sku}</Text>
                    <Text style={styles.productListPrice}>{product.price}</Text>
                    <Text style={styles.productListMoq}>MOQ: {product.minQty || 1}</Text>
                    <Text style={styles.productListStock}>Stock: {product.stock} {product.unit}</Text>
                    {product.gstRate > 0 && (
                      <Text style={styles.productListDetail}>GST: {product.gstRate}%</Text>
                    )}
                    {product.hsnCode && (
                      <Text style={styles.productListDetail}>HSN: {product.hsnCode}</Text>
                    )}
                  </View>
                  <View style={styles.productListRight}>
                    <View
                      style={[
                        styles.stockBadge,
                        {backgroundColor: getStatusColor(product.status) + '20'},
                      ]}
                    >
                      <Text
                        style={[
                          styles.stockBadgeText,
                          {color: getStatusColor(product.status)},
                        ]}
                      >
                        {product.status}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </>
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
    fontSize: 14,
    fontWeight: '600',
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
  topNavTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.red,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    marginLeft: 10,
  },
  content: {
    backgroundColor: '#FFFFFF',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 16,
  },
  resultText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  viewAllText: {
    color: colors.red,
    fontSize: 14,
    fontWeight: '700',
  },
  productListCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
    marginBottom: 12,
    ...shadow,
  },
  stockIndicator: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    marginRight: 12,
  },
  productListIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: 'rgba(198, 40, 40, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  productListInfo: {
    flex: 1,
  },
  productListName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  productListSku: {
    color: colors.muted,
    fontSize: 11,
    marginBottom: 4,
  },
  productListPrice: {
    color: colors.red,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 2,
  },
  productListMoq: {
    color: colors.muted,
    fontSize: 11,
    marginBottom: 2,
  },
  productListStock: {
    color: '#1D9E75',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  productListDetail: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '500',
  },
  productListRight: {
    alignItems: 'flex-end',
  },
  stockBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  stockBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});

export default CategoryPage;
