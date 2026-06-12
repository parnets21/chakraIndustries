import React, { useState, useEffect } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, shadow } from './theme';
import invoiceService from '../services/invoiceService';

function InvoiceDetailPage({ invoiceId, onBack }) {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await invoiceService.getInvoiceById(invoiceId);
      if (response.success) {
        setInvoice(response.data);
      }
    } catch (error) {
      console.error('Fetch invoice error:', error);
      Alert.alert('Error', 'Failed to load invoice details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [invoiceId]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const formatCurrency = (amount) => {
    return `₹${(amount || 0).toLocaleString('en-IN')}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.red} />
        <Text style={styles.loadingText}>Loading invoice details...</Text>
      </View>
    );
  }

  if (!invoice) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.emptyText}>Invoice not found</Text>
        <Pressable onPress={onBack} style={styles.backToInvoicesBtn}>
          <Text style={styles.backToInvoicesText}>Back to Invoices</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topNav}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#FFFFFF" />
        </Pressable>
        <View style={styles.topNavCenter}>
          <Icon name="file-document" size={24} color="#FFFFFF" />
          <Text style={styles.topNavTitle}>Invoice Details</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Invoice Header */}
        <View style={styles.invoiceHeaderCard}>
          <View style={styles.invoiceHeaderRow}>
            <View>
              <Text style={styles.invoiceNo}>{invoice.invoiceNo}</Text>
              <Text style={styles.invoiceDate}>Invoice Date: {formatDate(invoice.invoiceDate)}</Text>
              {invoice.dueDate && (
                <Text style={styles.invoiceDate}>Due Date: {formatDate(invoice.dueDate)}</Text>
              )}
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: (invoice.paymentStatus === 'Paid' ? '#1D9E75' : '#BA7517') + '20' },
              ]}>
              <Text style={[styles.statusText, { color: invoice.paymentStatus === 'Paid' ? '#1D9E75' : '#BA7517' }]}>
                {invoice.paymentStatus}
              </Text>
            </View>
          </View>
        </View>

        {/* Bill To / Ship To */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill To</Text>
          <View style={styles.addressCard}>
            <Text style={styles.addressName}>{invoice.partyName || invoice.billToName || 'N/A'}</Text>
            <Text style={styles.addressText}>{invoice.partyAddress || invoice.billToAddress || 'N/A'}</Text>
            {invoice.partyGST || invoice.billToGST ? (
              <Text style={styles.addressText}>GST: {invoice.partyGST || invoice.billToGST}</Text>
            ) : null}
            {invoice.partyPhone ? <Text style={styles.addressText}>Phone: {invoice.partyPhone}</Text> : null}
            {invoice.partyEmail ? <Text style={styles.addressText}>Email: {invoice.partyEmail}</Text> : null}
          </View>
        </View>

        {invoice.shipToName || invoice.shipToAddress ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ship To</Text>
            <View style={styles.addressCard}>
              <Text style={styles.addressName}>{invoice.shipToName || 'N/A'}</Text>
              <Text style={styles.addressText}>{invoice.shipToAddress || 'N/A'}</Text>
            </View>
          </View>
        ) : null}

        {/* Order Reference */}
        {invoice.purchaseOrderRef ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Reference</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Purchase Order:</Text>
              <Text style={styles.infoValue}>{invoice.purchaseOrderRef}</Text>
            </View>
          </View>
        ) : null}

        {/* Invoice Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          <View style={styles.itemsCard}>
            {invoice.items?.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.description}</Text>
                  <Text style={styles.itemDetails}>
                    Qty: {item.qty} {item.unit} × {formatCurrency(item.rate)}
                    {item.discount > 0 ? ` (-${item.discount}%)` : ''}
                  </Text>
                  {item.hsn ? <Text style={styles.itemHsn}>HSN: {item.hsn}</Text> : null}
                </View>
                <View style={styles.itemAmount}>
                  <Text style={styles.itemTotal}>{formatCurrency(item.total)}</Text>
                  <View style={styles.taxRow}>
                    {item.cgst > 0 && <Text style={styles.taxText}>CGST: {formatCurrency(item.cgst)}</Text>}
                    {item.sgst > 0 && <Text style={styles.taxText}>SGST: {formatCurrency(item.sgst)}</Text>}
                    {item.igst > 0 && <Text style={styles.taxText}>IGST: {formatCurrency(item.igst)}</Text>}
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Invoice Totals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Totals</Text>
          <View style={styles.totalsCard}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.subtotal)}</Text>
            </View>
            {invoice.totalDiscount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount:</Text>
                <Text style={styles.totalValue}>- {formatCurrency(invoice.totalDiscount)}</Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Tax:</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.totalTax)}</Text>
            </View>
            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Grand Total:</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(invoice.grandTotal)}</Text>
            </View>
            {invoice.paymentStatus !== 'Paid' && (
              <View style={[styles.totalRow, styles.remainingRow]}>
                <Text style={styles.remainingLabel}>Remaining Amount:</Text>
                <Text style={styles.remainingValue}>{formatCurrency(invoice.remainingAmount || invoice.grandTotal)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Terms & Notes */}
        {invoice.terms ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Terms & Conditions</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{invoice.terms}</Text>
            </View>
          </View>
        ) : null}
        {invoice.notes ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{invoice.notes}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  backToInvoicesBtn: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: colors.red,
    borderRadius: 10,
  },
  backToInvoicesText: {
    color: '#FFFFFF',
    fontWeight: '700',
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
  placeholder: {
    width: 40,
  },
  content: {
    padding: 20,
  },
  invoiceHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    marginBottom: 16,
    ...shadow,
  },
  invoiceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  invoiceNo: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 4,
  },
  invoiceDate: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: 2,
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
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 8,
  },
  addressCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
  },
  addressName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  addressText: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
  },
  infoLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  infoValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  itemsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  itemInfo: {
    flex: 1,
    marginRight: 10,
  },
  itemName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  itemDetails: {
    color: colors.muted,
    fontSize: 12,
    marginBottom: 2,
  },
  itemHsn: {
    color: colors.muted,
    fontSize: 11,
  },
  itemAmount: {
    alignItems: 'flex-end',
  },
  itemTotal: {
    color: colors.red,
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 4,
  },
  taxRow: {
    flexDirection: 'row',
    gap: 8,
  },
  taxText: {
    color: colors.muted,
    fontSize: 10,
  },
  totalsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  totalValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  grandTotalRow: {
    paddingTop: 10,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  grandTotalLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  grandTotalValue: {
    color: colors.red,
    fontSize: 17,
    fontWeight: '900',
  },
  remainingRow: {
    paddingTop: 10,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  remainingLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  remainingValue: {
    color: '#BA7517',
    fontSize: 15,
    fontWeight: '900',
  },
  notesCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
  },
  notesText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  bottomSpace: {
    height: 40,
  },
});

export default InvoiceDetailPage;
