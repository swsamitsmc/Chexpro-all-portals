import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CreditCard, FileText, Download, Loader2, Plus, 
  CheckCircle, AlertCircle, DollarSign, Calendar, ChevronLeft, ChevronRight
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue' | 'draft';
  createdAt: string;
  dueDate: string;
  paidAt?: string;
  description: string;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank';
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

interface AccountBalance {
  available: number;
  pending: number;
  currentPeriodEnd: string;
}

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [balance, setBalance] = useState<AccountBalance | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [downloading, setDownloading] = useState<string | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [invoicesRes, methodsRes, balanceRes] = await Promise.all([
        axios.get(`${API_URL}/billing/invoices`),
        axios.get(`${API_URL}/billing/payment-methods`),
        axios.get(`${API_URL}/billing/account`),
      ]);
      setInvoices(invoicesRes.data.data);
      setPaymentMethods(methodsRes.data.data);
      setBalance(balanceRes.data.data);
    } catch (err) {
      // Demo data
      setInvoices([
        { id: '1', invoiceNumber: 'INV-2024-001', amount: 499.00, status: 'paid', createdAt: '2024-01-01T00:00:00Z', dueDate: '2024-01-15T00:00:00Z', paidAt: '2024-01-05T00:00:00Z', description: 'Monthly Subscription - January 2024' },
        { id: '2', invoiceNumber: 'INV-2024-002', amount: 499.00, status: 'paid', createdAt: '2024-02-01T00:00:00Z', dueDate: '2024-02-15T00:00:00Z', paidAt: '2024-02-08T00:00:00Z', description: 'Monthly Subscription - February 2024' },
        { id: '3', invoiceNumber: 'INV-2024-003', amount: 499.00, status: 'pending', createdAt: '2024-03-01T00:00:00Z', dueDate: '2024-03-15T00:00:00Z', description: 'Monthly Subscription - March 2024' },
        { id: '4', invoiceNumber: 'INV-2024-004', amount: 249.50, status: 'paid', createdAt: '2024-03-10T00:00:00Z', dueDate: '2024-03-20T00:00:00Z', paidAt: '2024-03-12T00:00:00Z', description: 'Additional Background Checks' },
      ]);
      setPaymentMethods([
        { id: '1', type: 'card', last4: '4242', brand: 'Visa', expiryMonth: 12, expiryYear: 2025, isDefault: true },
        { id: '2', type: 'card', last4: '5555', brand: 'Mastercard', expiryMonth: 6, expiryYear: 2026, isDefault: false },
      ]);
      setBalance({
        available: 0,
        pending: 499.00,
        currentPeriodEnd: '2024-04-01T00:00:00Z',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (invoiceId: string) => {
    setDownloading(invoiceId);
    try {
      const res = await axios.get(`${API_URL}/billing/invoices/${invoiceId}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download invoice');
    } finally {
      setDownloading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800',
      draft: 'bg-gray-100 text-gray-800',
    };
    return styles[status] || styles.draft;
  };

  const paginatedInvoices = invoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(invoices.length / itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="text-gray-600">Manage invoices and payment methods</p>
      </div>

      {/* Balance Card */}
      {balance && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Current Period Total</p>
              <p className="text-3xl font-bold mt-1">${balance.pending.toFixed(2)}</p>
              <p className="text-blue-200 text-sm mt-2">
                Due {new Date(balance.currentPeriodEnd).toLocaleDateString()}
              </p>
            </div>
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <DollarSign className="w-8 h-8" />
            </div>
          </div>
        </div>
      )}

      {/* Payment Methods */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Methods
          </h3>
          <button className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
            <Plus className="w-4 h-4" />
            Add Method
          </button>
        </div>
        {paymentMethods.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No payment methods added</p>
        ) : (
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <div key={method.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center">
                    {method.brand === 'Visa' && <span className="text-xs font-bold text-blue-600">VISA</span>}
                    {method.brand === 'Mastercard' && <span className="text-xs font-bold text-orange-500">MC</span>}
                  </div>
                  <div>
                    <p className="font-medium">
                      {method.brand} •••• {method.last4}
                    </p>
                    <p className="text-sm text-gray-500">
                      Expires {method.expiryMonth}/{method.expiryYear}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {method.isDefault && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      Default
                    </span>
                  )}
                  <button className="text-sm text-gray-500 hover:text-gray-700">
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invoices */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Invoices
        </h3>
        
        {invoices.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No invoices yet</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Invoice</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Description</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-t border-gray-100">
                      <td className="py-3 px-4">
                        <span className="font-medium">{invoice.invoiceNumber}</span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {invoice.description}
                      </td>
                      <td className="py-3 px-4 font-medium">
                        ${invoice.amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(invoice.status)}`}>
                          {invoice.status === 'paid' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {invoice.status === 'pending' && <Calendar className="w-3 h-3 mr-1" />}
                          {invoice.status === 'overdue' && <AlertCircle className="w-3 h-3 mr-1" />}
                          {invoice.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-sm">
                        {new Date(invoice.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDownload(invoice.id)}
                          disabled={downloading === invoice.id}
                          className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                          title="Download PDF"
                        >
                          {downloading === invoice.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                          ) : (
                            <Download className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, invoices.length)} of {invoices.length} invoices
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg text-sm ${
                        page === currentPage
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
