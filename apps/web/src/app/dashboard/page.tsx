'use client';

import { useAuth } from '@/lib/auth';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="mt-2 text-gray-600">
          Here's an overview of your expense management activity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Pending Expenses</h3>
          <p className="text-3xl font-bold text-yellow-600 mt-2">12</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Approved This Month</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">28</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Total Amount</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">$4,250</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Avg Processing Time</h3>
          <p className="text-3xl font-bold text-gray-600 mt-2">2.3 days</p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Recent Activity
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Office Supplies</p>
                <p className="text-sm text-gray-500">Submitted 2 hours ago</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">$125.00</p>
                <p className="text-sm text-yellow-600">Pending</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Client Lunch</p>
                <p className="text-sm text-gray-500">Submitted yesterday</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">$85.50</p>
                <p className="text-sm text-green-600">Approved</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Travel Expenses</p>
                <p className="text-sm text-gray-500">Submitted 3 days ago</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">$450.00</p>
                <p className="text-sm text-green-600">Approved</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}