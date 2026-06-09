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
import productService from '../services/productService';

function CategoryPage({onBack}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Products');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedCategory !== 'All Products') {
      fetchProducts(selectedCategory);
    }
  }, [selectedCategory]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch categories
      const catResponse = await productService.getCategories();
      if (catResponse.success) {
        setCategories(catResponse.data || []);
      }

      // Fetch all products
      const prodResponse = await productService.getProducts({ limit: 50 });
      if (prodResponse.success) {
        setProducts(prodResponse.data || []);
      }
    } catch (error) {
      console.error('Fetch data error:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async (category) => {
    try {
      const response = await productService.getProducts({
        category,
        limit: 50
      });
      if (response.success) {
        setProducts(response.data || []);
      }
    } catch (error) {
      console.error('Fetch products error:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const categoryFilters = ['All Products', ...categories.map(c => c.name)];

  const getIconForCategory = (name) => {
    if (!name) return 'tag';
    const lower = name.toLowerCase();
    if (lower.includes('coconut')) return 'water';
    if (lower.includes('oil')) return 'bottle-tonic';
    if (lower.includes('food')) return 'package-variant';
    if (lower.includes('oem') || lower.includes('brand')) return 'factory';
    if (lower.includes('sesame')) return 'seed';
    if (lower.includes('ground') || lower.includes('peanut')) return 'peanut';
    return 'tag';
  };

  const getStockColor = (stockStatus) => {
    switch (stockStatus) {
      case 'In Stock':
        return '#1D9E75';
      case 'Low Stock':
        return '#BA7517';
      case 'Out of Stock':
        return '#F44336';
      default:
        return '#1D9E75';
    }
  };

  const newArrivals = products.slice(0, 6).map(p => ({
    id: p.id,
    name: p.name,
    price: `₹${p.price}`,
    moq: `MOQ: ${p.moq || 24} pcs`,
    icon: getIconForCategory(p.category),
    category: p.category,
    stock: p.stock,
    stockStatus: p.stockStatus,
  }));

  // Transform products for list display
  const allProductsData = products.map(p => ({
    id: p.id,
    name: p.name,
    price: `₹${p.price}`,
    moq: `MOQ: ${p.moq || 24} pcs`,
    stock: p.stockStatus || 'In Stock',
    stockColor: getStockColor(p.stockStatus),
    icon: getIconForCategory(p.category),
    category: p.category,
  }));

  // Filter products based on selected category
  const filteredProducts = selectedCategory === 'All Products' 
    ? allProductsData 
    : allProductsData.filter(p => p.category === selectedCategory);

  // Filter by search query
  const searchFilteredProducts = searchQuery 
    ? filteredProducts.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredProducts;

  // Show limited or all categories
  const displayedCategories = showAllCategories ? categories : categories.slice(0, 8);

  // Show limited or all products in the list
  const displayedProducts = showAllProducts ? filteredProducts : filteredProducts.slice(0, 6);

  if (loading) {
    return (
      <View style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
        <ActivityIndicator size="large" color={colors.red} />
        <Text style={{marginTop: 16, color: colors.muted}}>Loading categories...</Text>
      </View>
    );
  }

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
        }>
        {/* Category Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChips}>
          {categoryFilters.map((cat, index) => (
            <Pressable
              key={index}
              onPress={() => setSelectedCategory(cat)}
              style={[
                styles.filterChip,
                selectedCategory === cat && styles.filterChipActive,
              ]}>
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategory === cat && styles.filterChipTextActive,
                ]}>
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Product Count */}
        <View style={styles.resultHeader}>
          <Text style={styles.resultText}>
            Showing {searchFilteredProducts.length} products
          </Text>
        </View>

        {/* Browse by Category Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Browse by category</Text>
            <Pressable onPress={() => setShowAllCategories(!showAllCategories)}>
              <Text style={styles.viewAllText}>
                {showAllCategories ? 'Show less' : 'View all'} →
              </Text>
            </Pressable>
          </View>

          <View style={styles.categoryGrid}>
            {displayedCategories.map(category => (
              <Pressable 
                key={category.id} 
                style={styles.categoryCard}
                onPress={() => {
                  setSelectedCategory(category.name);
                  setShowAllProducts(false);
                }}>
                <View style={styles.categoryIconWrap}>
                  <Icon name={getIconForCategory(category.name)} size={32} color={colors.red} />
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.categoryCount}>
                  {category.productCount} products
                </Text>
                <View
                  style={[
                    styles.categoryStatus,
                    {backgroundColor: (category.status === 'In stock' ? '#1D9E75' : colors.red) + '20'},
                  ]}>
                  <Text
                    style={[
                      styles.categoryStatusText,
                      {color: category.status === 'In stock' ? '#1D9E75' : colors.red},
                    ]}>
                    {category.status}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* New Arrivals Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>New arrivals</Text>
            <Pressable>
              <Text style={styles.viewAllText}>See all →</Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productScroll}>
            {newArrivals.map(product => (
              <View key={product.id} style={styles.productCard}>
                <View style={styles.productIconWrap}>
                  <Icon name={product.icon} size={40} color={colors.red} />
                </View>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productPrice}>{product.price}</Text>
                <Text style={styles.productMoq}>{product.moq}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* All Products Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategory === 'All Products' 
                ? 'All Products' 
                : `${selectedCategory} — all SKUs`}
            </Text>
            <Pressable onPress={() => setShowAllProducts(!showAllProducts)}>
              <Text style={styles.viewAllText}>
                {showAllProducts ? 'Show less' : 'See all'} →
              </Text>
            </Pressable>
          </View>

          {displayedProducts.map(product => (
            <View key={product.id} style={styles.productListCard}>
              <View
                style={[
                  styles.stockIndicator,
                  {backgroundColor: product.stockColor},
                ]}
              />
              <View style={styles.productListIconWrap}>
                <Icon name={product.icon} size={32} color={colors.red} />
              </View>
              <View style={styles.productListInfo}>
                <Text style={styles.productListName}>{product.name}</Text>
                <Text style={styles.productListPrice}>{product.price}</Text>
                <Text style={styles.productListMoq}>{product.moq}</Text>
              </View>
              <View style={styles.productListRight}>
                <View
                  style={[
                    styles.stockBadge,
                    {backgroundColor: product.stockColor + '20'},
                  ]}>
                  <Text
                    style={[styles.stockBadgeText, {color: product.stockColor}]}>
                    {product.stock}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
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
  filterChips: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: colors.line,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: colors.red,
    borderColor: colors.red,
  },
  filterChipText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
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
  sortText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    alignItems: 'center',
    ...shadow,
  },
  categoryIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(198, 40, 40, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  categoryName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  categoryCount: {
    color: colors.muted,
    fontSize: 12,
    marginBottom: 8,
  },
  categoryStatus: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  productScroll: {
    gap: 12,
  },
  productCard: {
    width: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    ...shadow,
  },
  productIconWrap: {
    width: '100%',
    height: 100,
    borderRadius: 12,
    backgroundColor: 'rgba(198, 40, 40, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  productName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  productPrice: {
    color: colors.red,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  productMoq: {
    color: colors.muted,
    fontSize: 11,
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
  productListPrice: {
    color: colors.red,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 2,
  },
  productListMoq: {
    color: colors.muted,
    fontSize: 11,
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
