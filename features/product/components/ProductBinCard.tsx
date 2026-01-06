import React from 'react';
import { useGetProductBinCardQuery } from '../api/productApi';
import { format } from 'date-fns';
import { getResponseData } from '@/lib/utils/api-response';
import { BinCardEntry } from '../types';

interface ProductBinCardProps {
  productId: string;
}

export const ProductBinCard: React.FC<ProductBinCardProps> = ({ productId }) => {
    const { data: response, isLoading, error } = useGetProductBinCardQuery(productId);
    const entries = getResponseData<BinCardEntry[]>(response);
  if (isLoading) return <div className="p-4">Loading stock ledger...</div>;
  if (error) return <div className="p-4 text-red-500">Failed to load bin card.</div>;

  return (
    <div className="flex flex-col border border-gray-300 rounded-sm bg-white overflow-hidden">
      <div className="bg-gray-100 p-2 text-center font-bold border-b border-gray-300 uppercase tracking-wider">
        Product Bin Card / Stock Ledger
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs text-left border-collapse">
          <thead className="bg-gray-50 font-semibold text-gray-700 uppercase">
            <tr>
              <th className="border border-gray-300 px-2 py-1">Date</th>
              <th className="border border-gray-300 px-2 py-1">Doc. No.</th>
              <th className="border border-gray-300 px-2 py-1">From / To</th>
              <th className="border border-gray-300 px-2 py-1">Batch No.</th>
              <th className="border border-gray-300 px-2 py-1">Expiry</th>
              <th className="border border-gray-300 px-2 py-1 bg-green-50">Received</th>
              <th className="border border-gray-300 px-2 py-1 bg-red-50">Issued</th>
              <th className="border border-gray-300 px-2 py-1 bg-yellow-50">Loss/Adj</th>
              <th className="border border-gray-300 px-2 py-1 font-bold">Balance</th>
              <th className="border border-gray-300 px-2 py-1">Price</th>
              <th className="border border-gray-300 px-2 py-1">Remark</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
          {entries && entries.length > 0 && Array.isArray(entries) ? (
    entries.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-2 py-1 whitespace-nowrap">
                  {format(new Date(entry.createdAt), 'dd/MM/yyyy')}
                </td>
                <td className="border border-gray-300 px-2 py-1">{entry.documentNo}</td>
                <td className="border border-gray-300 px-2 py-1 truncate max-w-[150px]">
                  {entry.entityName}
                </td>
                <td className="border border-gray-300 px-2 py-1">{entry.batch?.batchNumber || '-'}</td>
                <td className="border border-gray-300 px-2 py-1">
                  {entry.batch?.expiryDate ? format(new Date(entry.batch.expiryDate), 'MM/yy') : '-'}
                </td>
                <td className="border border-gray-300 px-2 py-1 text-green-700 text-center font-medium">
                  {entry.quantityIn || ''}
                </td>
                <td className="border border-gray-300 px-2 py-1 text-red-700 text-center font-medium">
                  {entry.quantityOut || ''}
                </td>
                <td className="border border-gray-300 px-2 py-1 text-orange-600 text-center">
                  {entry.lossAdjustment || ''}
                </td>
                <td className="border border-gray-300 px-2 py-1 font-bold text-center bg-gray-50">
                  {entry.balance}
                </td>
                <td className="border border-gray-300 px-2 py-1">{entry.unitPrice}</td>
                <td className="border border-gray-300 px-2 py-1 italic text-gray-500">
                  {entry.remark}
                </td>
              </tr>
           ))
        ) : (
          <tr>
            <td colSpan={11} className="p-4 text-center text-gray-500">
              No movement history found for this product.
            </td>
          </tr>
        )}
          </tbody>
        </table>
      </div>
    </div>
  );
};