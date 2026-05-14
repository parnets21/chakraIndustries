import { useState, useEffect, useCallback } from 'react';
import { FiCheck, FiX, FiClock, FiAlertCircle, FiTruck, FiFileText, FiDollarSign, FiArrowRight } from 'react-icons/fi';
import StatusBadge from '../../components/common/StatusBadge';
import DataTable from '../../components/tables/DataTable';
import Modal from '../../components/common/Modal';
import { toast } from '../../components/common/Toast';
import { bulkOrderApi } from '../../api/bulkOrderApi';
import { bulkOrderApprovalApi } from '../../api/bulkOrderApprovalApi';
import { bulkOrderInventoryApi } from '../../api/bulkOrderInventoryApi';
import { bulkOrderInvoiceApi } from '../../api/bulkOrderInvoiceApi';
import { bulkOrderCreditApi } from '../../api/bulkOrderCreditApi';
import { corporateClientApi } from '../../api/corporateClientApi';

const btnPrimary = "inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md hover:-translate-y-px transition-all border-0 cursor-pointer font-[inherit]";
const btnOutline = "inline-flex items-center gap-1.5 px-4 py-2 border border-red-600 text-red-700 bg-transparent rounded-xl text-sm font-semibold hover:bg-red-700 hover:text-white transition-all cursor-pointer font-[inherit]";
const btnSm = "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg";

export default function BulkOrderCompleteFlowPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [clients, setClients] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [showFlowModal, setShowFlowModal] = useState(false);
  const [flowData, setFlowData] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [clientsRes,