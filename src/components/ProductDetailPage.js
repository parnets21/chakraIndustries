import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {colors, shadow} from './theme';

function ProductDetailPage({onBack, product}) {
  if (!product) {
    return (
      <View style={styles.container}>
        <View style={styles.topNav}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#FFFFFF" />
          </Pressable>
          <View style={styles.topNavCenter}>
            <Text style={styles.topNavTitle}>Product Detail</Text>
          </View>
          <View style={{width: 40}} />
        </View>
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Product not found</Text>
        </View>
      </View>
    );
  }

  const renderInfoRow = (label, value, icon = 'information') => {
    if (!value && value !== 0) return null;
    return (
      <View style={styles.infoRow}>
        <View style={styles.infoIconWrap}>
          <Icon name={icon} size={16} color={colors.muted} />
        </View>
        <View style={styles.infoLabelWrap}>
          <Text style={styles.infoLabel}>{label}</Text>
        </View>
        <View style={styles.infoValueWrap}>
          <Text style={styles.infoValue}>{value}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.topNav}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#FFFFFF" />
        </Pressable>
        <View style={styles.topNavCenter}>
          <Text style={styles.topNavTitle}>Product Details</Text>
        </View>
        <View style={{width: 40}} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollBody}>
        {/* Product header */}
        <View style={styles.headerCard}>
          <View style={styles.productIconWrap}>
            <Icon name="package-variant" size={48} color={colors.red} />
          </View>
          <View style={styles.productInfoWrap}>
            <Text style={styles.productName}>{product.name || product.itemName || 'Unknown Product'}</Text>
            {product.sku && <Text style={styles.productSku}>SKU: {product.sku}</Text>}
            {product.itemId && <Text style={styles.productItemId}>Item ID: {product.itemId}</Text>}
            <Text style={styles.productPrice}>{product.price || '₹0'}</Text>
          </View>
        </View>

        {/* Product Identification */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Product Identification</Text>
          {renderInfoRow('Product Name', product.name || product.itemName, 'tag')}
          {renderInfoRow('SKU / Code', product.sku, 'barcode')}
          {renderInfoRow('Item ID', product.itemId, 'identifier')}
          {renderInfoRow('Barcode', product.barcode, 'barcode')}
          {renderInfoRow('Description', product.description, 'text')}
        </View>

        {/* Stock & Inventory */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Inventory Information</Text>
          {renderInfoRow('Total Stock', `${product.stock || 0} ${product.unit || 'pcs'}`, 'package-variant')}
          {renderInfoRow('MOQ / Min Qty', product.minQty || product.minQuantity, 'numeric')}
          {renderInfoRow('Reorder Point', product.reorderPoint, 'alert-circle')}
          {renderInfoRow('Stock Status', product.status || product.stockStatus, 'check-circle')}
          {product.unit && renderInfoRow('Unit', product.unit, 'ruler')}
        </View>

        {/* Pricing */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Pricing</Text>
          {renderInfoRow('Unit Price', product.price, 'cash')}
          {product.unitPrice > 0 && renderInfoRow('Unit Price (Num)', `₹${product.unitPrice}`, 'cash')}
          {product.costPrice > 0 && renderInfoRow('Cost Price', `₹${product.costPrice}`, 'bank')}
          {product.sellingPrice > 0 && renderInfoRow('Selling Price', `₹${product.sellingPrice}`, 'cash-multiple')}
        </View>

        {/* Tax & Codes */}
        {(product.hsnCode || product.hsn || product.gstRate !== undefined || product.gst !== undefined) && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Tax & Codes</Text>
            {renderInfoRow('GST Rate', `${product.gstRate || product.gst || 0}%`, 'percent')}
            {renderInfoRow('HSN Code', product.hsnCode || product.hsn, 'barcode')}
          </View>
        )}

        {/* Category */}
        {product.category && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Classification</Text>
            {renderInfoRow('Category', product.category, 'folder')}
          </View>
        )}

        {/* Warehouse Info */}
        {product.warehouses && product.warehouses.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Warehouses</Text>
            {product.warehouses.map((wh, idx) => (
              <View key={idx} style={styles.warehouseRow}>
                <View style={styles.warehouseIconWrap}>
                  <Icon name="warehouse" size={14} color={colors.muted} />
                </View>
                <View style={styles.warehouseInfo}>
                  <Text style={styles.warehouseName}>{wh.name}</Text>
                  <Text style={styles.warehouseStock}>Stock: {wh.stock || 0}</Text>
                  {wh.batch && <Text style={styles.warehouseBatch}>Batch: {wh.batch}</Text>}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Timestamps */}
        {(product.createdAt || product.updatedAt) && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Additional Info</Text>
            {product.createdAt && renderInfoRow('Created On', new Date(product.createdAt).toLocaleDateString(), 'calendar')}
            {product.updatedAt && renderInfoRow('Last Updated', new Date(product.updatedAt).toLocaleDateString(), 'clock')}
          </View>
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
    flex: 1,
    alignItems: 'center',
  },
  topNavTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  scroll: {
    flex: 1,
  },
  scrollBody: {
    padding: 20,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadow,
  },
  productIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: 'rgba(198,40,40,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  productInfoWrap: {
    flex: 1,
  },
  productName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  productSku: {
    color: colors.muted,
    fontSize: 12,
    marginBottom: 2,
  },
  productItemId: {
    color: colors.muted,
    fontSize: 11,
    marginBottom: 4,
  },
  productPrice: {
    color: colors.red,
    fontSize: 24,
    fontWeight: '900',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadow,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  infoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(198,40,40,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoLabelWrap: {
    width: '35%',
  },
  infoLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  infoValueWrap: {
    flex: 1,
  },
  infoValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  warehouseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  warehouseIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(198,40,40,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  warehouseInfo: {
    flex: 1,
  },
  warehouseName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  warehouseStock: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
  },
  warehouseBatch: {
    color: colors.muted,
    fontSize: 11,
  },
});

export default ProductDetailPage;
