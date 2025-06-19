import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { apiClient } from '../utils/api';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for stores and vehicles
const storeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const vehicleIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const warehouseIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface StoreItem {
  item_name: string;
  current_quantity: number;
  max_quantity: number;
  unit: string;
  price: number;
  category: string;
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
  is_active: boolean;
  economic_conditions: 'LOW' | 'MEDIUM' | 'HIGH';
  economic_notes: string;
  political_instability: 'LOW' | 'MEDIUM' | 'HIGH';
  political_notes: string;
  environmental_issues: 'LOW' | 'MEDIUM' | 'HIGH';
  environmental_notes: string;
  created_at: string;
  updated_at: string;
  latitude?: number;
  longitude?: number;
  // UI-specific properties (we'll add these for display)
  position?: [number, number];
  inventory?: number;
  demand?: string;
  reorderThreshold?: number;
  maxInventory?: number;
  safetyStock?: number;
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
}

interface Vehicle {
  id: number;
  position: [number, number];
  status: string;
  destination: string;
}

interface Route {
  from: [number, number];
  to: [number, number];
}

export default function SupplyChainSimulator(){
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [showRoutes, setShowRoutes] = useState(true);
  const [systemActive, setSystemActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [error, setError] = useState<string | null>(null);


  // Store data with configurations
  const [stores, setStores] = useState<Record<string, Store>>({});

  const [vehicles] = useState<Vehicle[]>([
    { id: 1, position: [28.6500, 77.2500], status: 'En Route', destination: 'Store A' }
  ]);

  const routes: Route[] = [
    { from: [28.7041, 77.1025], to: [28.6139, 77.2090] }, // Warehouse to Store A
  ];

  const updateStoreConfig = (field: keyof Store, value: string | number) => {
    setStores(prev => ({
      ...prev,
      [selectedStore]: {
        ...prev[selectedStore],
        [field]: value
      }
    }));
  };

    // Fetch stores from API
  const fetchStores = async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await apiClient.get('/stores/');
      
      // Transform API data to match your Store interface
      const transformedStores: Record<string, Store> = {};
      
      data.stores.forEach((store: any) => {
        // Calculate inventory percentage based on items
        const totalCurrentQuantity = store.items.reduce((sum: number, item: StoreItem) => 
          sum + item.current_quantity, 0);
        const totalMaxQuantity = store.items.reduce((sum: number, item: StoreItem) => 
          sum + item.max_quantity, 0);
        const inventoryPercentage = totalMaxQuantity > 0 ? 
          Math.round((totalCurrentQuantity / totalMaxQuantity) * 100) : 0;

        // Determine demand based on economic conditions
        const getDemand = (economicConditions: string) => {
          switch (economicConditions) {
            case 'HIGH': return 'High';
            case 'MEDIUM': return 'Medium';
            case 'LOW': return 'Low';
            default: return 'Medium';
          }
        };

        // Determine priority based on conditions
        const getPriority = (store: any) => {
          if (store.economic_conditions === 'HIGH' || 
              store.political_instability === 'HIGH' || 
              store.environmental_issues === 'HIGH') {
            return 'Critical';
          } else if (store.economic_conditions === 'MEDIUM' || 
                     store.political_instability === 'MEDIUM' || 
                     store.environmental_issues === 'MEDIUM') {
            return 'High';
          } else {
            return 'Low';
          }
        };

        // Assign positions based on store name (you can customize this)
        const getPosition = (storeName: string) => {
          const positions: Record<string, [number, number]> = {
            'Store A': [28.6139, 77.2090], // Delhi
            'Store B': [28.5355, 77.3910], // Noida
            'Store C': [28.4595, 77.0266], // Gurgaon
            'Main Warehouse': [28.7041, 77.1025], // North Delhi
          };
          return positions[storeName] || [28.6139, 77.2090]; // Default position
        };

        transformedStores[store._id] = {
          ...store,
          position: getPosition(store.store_name),
          inventory: inventoryPercentage,
          demand: getDemand(store.economic_conditions),
          reorderThreshold: 25, // Default value
          maxInventory: totalMaxQuantity,
          safetyStock: Math.round(totalMaxQuantity * 0.2), // 20% of max as safety stock
          priority: getPriority(store)
        };
      });
      
      setStores(transformedStores);
      
      // Set first store as selected if none selected
      if (!selectedStore && data.stores.length > 0) {
        setSelectedStore(data.stores[0]._id);
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
      setError('Failed to load stores. Please check your connection.');

      // Fallback to some default data if API fails
      const fallbackStore: Store = {
        _id: 'fallback',
        store_name: 'Store A',
        store_address: '123 Main St, New York, NY 10001',
        store_phone: '+1-555-0123',
        store_email: 'storea@example.com',
        owner_name: 'John Doe',
        store_type: 'General',
        items: [],
        is_active: true,
        economic_conditions: 'MEDIUM',
        economic_notes: 'Moderate inflation affecting prices',
        political_instability: 'LOW',
        political_notes: 'Stable political environment',
        environmental_issues: 'LOW',
        environmental_notes: 'No significant environmental concerns',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        position: [28.6139, 77.2090],
        inventory: 75,
        demand: 'High',
        reorderThreshold: 25,
        maxInventory: 150,
        safetyStock: 30,
        priority: 'High'
      };
      
      setStores({ 'fallback': fallbackStore });
      setSelectedStore('fallback');
    } finally {
      setLoading(false);
    }
  };

    // Fetch pending orders count
  const fetchPendingOrders = async () => {
    try {
      const data = await apiClient.get('/orders/');
      const pendingCount = data.orders.filter((order: any) => 
        order.status === 'pending' || order.status === 'processing'
      ).length;
      setPendingOrders(pendingCount);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setPendingOrders(0); // Fallback
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchStores();
    fetchPendingOrders();
  }, []);

  // Refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStores();
      fetchPendingOrders();
    }, 30000);

    return () => clearInterval(interval);
  }, []);


  const currentStore: Store | undefined = stores[selectedStore];

    // Show loading state
  if (loading && Object.keys(stores).length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading supply chain data...</p>
        </div>
      </div>
    );
  }

  if (!currentStore) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️</div>
          <p className="text-gray-600 mb-4">No store data available</p>
          <button 
            onClick={fetchStores}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (error) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="text-red-600 text-xl mb-4">⚠️</div>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={fetchStores}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
    return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 font-[family-name:var(--font-inter)]">

    {/* Updated System Status Panel as Cards */}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">

        {/* Total Stores Card */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-md p-4 flex items-center justify-between">
        <div>
            <p className="text-sm text-gray-800">Total Stores</p>
            <p className="text-xl font-bold text-blue-600">4</p>
        </div>
        <div>
            {/* Add your store icon SVG here */}
        </div>
        </div>

        {/* Active Vehicles Card */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-md p-4 flex items-center justify-between">
        <div>
            <p className="text-sm text-gray-800">Active Vehicles</p>
            <p className="text-xl font-bold text-green-600">1</p>
        </div>
        <div>
            {/* Add your vehicle icon SVG here */}
        </div>
        </div>

        {/* Pending Orders Card */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-md p-4 flex items-center justify-between">
        <div>
            <p className="text-sm text-gray-800">Pending Orders</p>
            <p className="text-xl font-bold text-yellow-600">3</p>
        </div>
        <div>
            {/* Add your pending order icon SVG here */}
        </div>
        </div>

        {/* MCP Status Card */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-md p-4 flex items-center justify-between">
        <div>
            <p className="text-sm text-gray-800">MCP Status</p>
            <p className="text-sm font-medium text-green-600 flex items-center gap-1">
            ● Active
            </p>
        </div>
        <div>
            {/* Add your MCP icon SVG here */}
        </div>
        </div>

    </div>
    </div>


      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Map Component */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
                <div className="flex justify-between items-center px-4 py-2 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-700">Supply Chain Network</h2>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">Show Delivery Paths</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={showRoutes}
                        onChange={() => setShowRoutes(!showRoutes)}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-blue-600 transition-all"></div>
                    <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-full"></div>
                    </label>
                </div>
                </div>
              <div className="h-96 lg:h-[500px]">
                <MapContainer
                center={[currentStore.latitude!, currentStore.longitude!]}
                zoom={12}
                style={{ height: '100%', width: '100%' }}
                className="leaflet-container"
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {/* Store Markers: Only show if latitude and longitude are valid */}
                {Object.values(stores)
                  .filter((store: Store) => typeof store.latitude === 'number' && typeof store.longitude === 'number')
                  .map((store: Store) => (
                    <Marker
                      key={store._id}
                      position={[store.latitude!, store.longitude!]}
                      icon={storeIcon}
                      eventHandlers={{
                        click: () => setSelectedStore(store._id),
                      }}
                    >
                      <Popup>
                        <div>
                          <h3 className="font-semibold">{store.store_name}</h3>
                          <p>{store.store_address}</p>
                          <p>Type: {store.store_type}</p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
              </MapContainer>
              </div>
                <div className="px-4 py-2 bg-white border-t border-gray-200 text-sm text-gray-600 flex flex-wrap items-center justify-center gap-4">
                    <div className="flex justify-center items-center gap-1">
                        <span className="w-3 h-3 bg-blue-600 rounded-full inline-block"></span> Stores
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-green-600 rounded-full inline-block"></span> Vehicles
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-red-500 rounded-full inline-block"></span> Warehouse
                    </div>
                </div>
            </div>
          </div>

          {/* Control Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Configure {currentStore?.store_name}</h2>
              <p className="text-sm text-gray-600 mt-1">
                Current Inventory: {currentStore?.inventory}% | Demand: {currentStore?.demand}
              </p>
              <p className="text-xs text-gray-500">
                Address: {currentStore?.store_address}
              </p>
            </div>
              
              <div className="p-6 space-y-6">
                
                {/* Reorder Threshold */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reorder Threshold: {currentStore.reorderThreshold}%
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    value={currentStore.reorderThreshold}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateStoreConfig('reorderThreshold', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Order more when inventory drops below this level
                  </p>
                </div>

                {/* Maximum Inventory */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Inventory: {currentStore.maxInventory}
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="200"
                    value={currentStore.maxInventory}
                    onChange={(e) => updateStoreConfig('maxInventory', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Never exceed this inventory level
                  </p>
                </div>

                {/* Safety Stock */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Safety Stock: {currentStore.safetyStock}
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    value={currentStore.safetyStock}
                    onChange={(e) => updateStoreConfig('safetyStock', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum stock to keep as backup
                  </p>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority Level
                  </label>
                  <select
                    value={currentStore.priority}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateStoreConfig('priority', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t border-gray-200">
                  <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium mb-2">
                    Start AI Simulation
                  </button>
                  <button className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium">
                    Reset Configuration
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .leaflet-container {
          border-radius: 0 0 1rem 1rem;
        }
        .store-marker {
          background-color: #3B82F6 !important;
          border-radius: 50% !important;
          border: 3px solid white !important;
        }
        .vehicle-marker {
          background-color: #10B981 !important;
          border-radius: 50% !important;
          border: 3px solid white !important;
        }
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
};