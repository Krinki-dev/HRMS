export {
  Spinner,
  Button,
  Input,
  Select,
  Field,
  Textarea,
  Tabs,
  Modal,
  Badge,
  Avatar,
  PageHeader,
  EmptyState,
  StatCard,
  ConfirmModal,
  SearchInput,
  Alert,
} from './Common';

import React from 'react';

export function Table({ columns = [], data = [], emptyMessage = 'No records found.' }) {
  if (!data.length) {
    return (
      <div className="text-center py-12 text-sm text-gray-500">{emptyMessage}</div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50 transition-colors">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-gray-700 whitespace-nowrap">
                  {col.render ? col.render(row[col.key], row) : row[col.key] ?? '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

