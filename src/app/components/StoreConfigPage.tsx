'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Package, MapPin, Phone, Mail, User, Building2 } from 'lucide-react';

interface StoreItem {
  item_name: string;
  current_quantity: number;
  max_quantity: number;
  unit: string;
  price: number;
  category: string;
  order_quantity?: number;
}

interface Store {
  _id: string;
  store_name: string;
  store_address: string;
  store_phone: string;
  store_email: string;
  owner_name: string;
  store_type: string;
  items: StoreItem[];
  economic_conditions: string;
  economic_notes: string;
  political_instability: string;
  political_notes: string;
  environmental_issues: string;
  environmental_notes: string;
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

interface Conditions {
  economic_conditions: string;
  economic_notes: string;
  political_instability: string;
  political_notes: string;
  environmental_issues: string;
  environmental_notes: string;
}

const StoreConfigPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const storeId = params?.storeId as string;
  
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<StoreItem[]>([]);
  const [conditions, setConditions] = useState<Conditions>({
    economic_conditions: '',
    economic_notes: '',
    political_instability: '',
    political_notes: '',
    environmental_issues: '',
    environmental_notes: ''
  });
  const [orderNotes, setOrderNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (storeId) {
      fetchStoreDetails();
    }
  }, [storeId]);

  const fetchStoreDetails = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/stores/${storeId}`);
      if (!response.ok) throw new Error('Failed to fetch store details');
      
      const storeData: Store = await response.json();
      setStore(storeData);
      setConditions({
        economic_conditions: storeData.economic_conditions || '',
        economic_notes: storeData.economic_notes || '',
        political_instability: storeData.political_instability || '',
        political_notes: storeData.political_notes || '',
        environmental_issues: storeData.environmental_issues || '',
        environmental_notes: storeData.environmental_notes || ''
      });
      
      // Initialize order items with empty quantities
      const items = storeData.items.map(item => ({
        ...item,
        order_quantity: 0
      }));
      setOrderItems(items);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateItemQuantity = (itemName: string, newQuantity: number) => {
    setOrderItems(prev => 
      prev.map(item => 
        item.item_name === itemName 
          ? { ...item, order_quantity: Math.max(0, newQuantity) }
          : item
      )
    );
  };

  const updateConditions = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/stores/${storeId}/conditions/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(conditions)
      });
      
      if (!response.ok) throw new Error('Failed to update conditions');
      alert('Conditions updated successfully!');
    } catch (err) {
      alert('Error updating conditions: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const createOrder = async () => {
    setSubmitting(true);
    try {
      const itemsToOrder = orderItems.filter(item => (item.order_quantity || 0) > 0);
      
      if (itemsToOrder.length === 0) {
        alert('Please select at least one item to order');
        return;
      }

      const orderData = {
        store_id: storeId,
        store_name: store?.store_name,
        main_store_id: "507f1f77bcf86cd799439012",
        items: itemsToOrder.map(item => ({
          item_name: item.item_name,
          quantity: item.order_quantity,
          unit: item.unit,
          price: item.price,
          category: item.category
        })),
        notes: orderNotes
      };

      const response = await fetch('/orders/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) throw new Error('Failed to create order');
      
      const result = await response.json();
      alert(`Order created successfully! Order ID: ${result.order_id}`);
      
      // Reset order form
      setOrderItems(prev => prev.map(item => ({ ...item, order_quantity: 0 })));
      setOrderNotes('');
      
    } catch (err) {
      alert('Error creating order: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  const getConditionColor = (condition: string): string => {
    switch (condition) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': 
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStockColor = (current: number, max: number): string => {
    const percentage = (current / max) * 100;
    if (percentage < 30) return 'bg-red-500';
    if (percentage < 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-600 font-medium">Loading store details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-red-600 text-center">
            <p className="text-lg font-semibold mb-2">Error</p>
            <p>{error}</p>
            <button 
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center text-gray-600">
          <p className="text-lg">Store not found</p>
          <button 
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 font-[family-name:var(--font-inter)]">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.back()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Map
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">{store.store_name}</h1>
                <p className="text-gray-600 flex items-center gap-1 mt-1">
                  <Building2 className="w-4 h-4" />
                  {store.store_type}
                </p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${store.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {store.is_active ? 'Active' : 'Inactive'}
            </div>
          </div>
        </div>

        {/* Store Information */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            Store Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <MapPin className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Address</p>
                <p className="font-medium text-gray-800">{store.store_address}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Phone className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium text-gray-800">{store.store_phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Mail className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-800">{store.store_email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <User className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Owner</p>
                <p className="font-medium text-gray-800">{store.owner_name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Store Conditions */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Store Conditions</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Economic Conditions</label>
              <select 
                value={conditions.economic_conditions}
                onChange={(e) => setConditions(prev => ({ ...prev, economic_conditions: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
              >
                <option value="">Select</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <textarea
                placeholder="Economic notes..."
                value={conditions.economic_notes}
                onChange={(e) => setConditions(prev => ({ ...prev, economic_notes: e.target.value }))}
                className="w-full mt-2 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900"
                rows={3}
              />
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Political Instability</label>
              <select 
                value={conditions.political_instability}
                onChange={(e) => setConditions(prev => ({ ...prev, political_instability: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
              >
                <option value="">Select</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <textarea
                placeholder="Political notes..."
                value={conditions.political_notes}
                onChange={(e) => setConditions(prev => ({ ...prev, political_notes: e.target.value }))}
                className="w-full mt-2 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900"
                rows={3}
              />
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Environmental Issues</label>
              <select 
                value={conditions.environmental_issues}
                onChange={(e) => setConditions(prev => ({ ...prev, environmental_issues: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
              >
                <option value="">Select</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              <textarea
                placeholder="Environmental notes..."
                value={conditions.environmental_notes}
                onChange={(e) => setConditions(prev => ({ ...prev, environmental_notes: e.target.value }))}
                className="w-full mt-2 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900"
                rows={3}
              />
            </div>
          </div>
          
          <button 
            onClick={updateConditions}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Update Conditions
          </button>
        </div>

        {/* Current Inventory */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" />
            Current Inventory
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {store.items.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold text-gray-800 mb-2">{item.item_name}</h3>
                <div className="space-y-1 text-sm text-gray-800">
                  <p><span className="text-gray-600">Category:</span> <span className="font-medium">{item.category}</span></p>
                  <p><span className="text-gray-600">Current:</span> <span className="font-medium">{item.current_quantity} {item.unit}</span></p>
                  <p><span className="text-gray-600">Max:</span> <span className="font-medium">{item.max_quantity} {item.unit}</span></p>
                  <p><span className="text-gray-600">Price:</span> <span className="font-medium">${item.price}</span></p>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${getStockColor(item.current_quantity, item.max_quantity)}`}
                      style={{ width: `${Math.min((item.current_quantity / item.max_quantity) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {Math.round((item.current_quantity / item.max_quantity) * 100)}% in stock
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Create Order */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <button 
            onClick={createOrder}
            disabled={submitting || orderItems.every(item => (item.order_quantity || 0) === 0)}
            className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-medium text-lg"
          >
            {submitting ? 'Creating Order...' : 'Create Order'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoreConfigPage;