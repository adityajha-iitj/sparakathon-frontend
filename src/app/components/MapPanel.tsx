import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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

interface Store {
  id: string;
  name: string;
  position: [number, number];
  inventory: number;
  demand: string;
  reorderThreshold: number;
  maxInventory: number;
  safetyStock: number;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
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
  const [selectedStore, setSelectedStore] = useState('A');
  const [showRoutes, setShowRoutes] = useState(true);
  const [systemActive, setSystemActive] = useState(true);

  // Store data with configurations
  const [stores, setStores] = useState<Record<string, Store>>({
    A: {
      id: 'A',
      name: 'Store A',
      position: [28.6139, 77.2090], // Delhi
      inventory: 75,
      demand: 'High',
      reorderThreshold: 25,
      maxInventory: 150,
      safetyStock: 30,
      priority: 'High'
    },
    B: {
      id: 'B', 
      name: 'Store B',
      position: [28.5355, 77.3910], // Noida
      inventory: 40,
      demand: 'Medium',
      reorderThreshold: 30,
      maxInventory: 100,
      safetyStock: 20,
      priority: 'Medium'
    },
    C: {
      id: 'C',
      name: 'Store C', 
      position: [28.4595, 77.0266], // Gurgaon
      inventory: 90,
      demand: 'Low',
      reorderThreshold: 35,
      maxInventory: 120,
      safetyStock: 25,
      priority: 'Low'
    },
    D: {
      id: 'D',
      name: 'Main Warehouse',
      position: [28.7041, 77.1025], // North Delhi
      inventory: 500,
      demand: 'N/A',
      reorderThreshold: 50,
      maxInventory: 1000,
      safetyStock: 100,
      priority: 'Critical'
    }
  });

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

  const currentStore: Store = stores[selectedStore];

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
                  center={[28.6139, 77.2090]}
                  zoom={11}
                  style={{ height: '100%', width: '100%' }}
                  className="leaflet-container"
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  
                  {/* Store Markers */}
                  {Object.values(stores).map((store) => (
                    <Marker
                      key={store.id}
                      position={store.position}
                      icon={storeIcon}
                      eventHandlers={{
                        click: () => setSelectedStore(store.id),
                      }}
                    >
                      <Popup>
                        <div className="p-2">
                          <h3 className="font-semibold">{store.name}</h3>
                          <p className="text-sm">Inventory: {store.inventory}%</p>
                          <p className="text-sm">Demand: {store.demand}</p>
                          <button
                            onClick={() => setSelectedStore(store.id)}
                            className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                          >
                            Configure
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                  {/* Vehicle Markers */}
                  {vehicles.map((vehicle) => (
                    <Marker
                      key={vehicle.id}
                      position={vehicle.position}
                      icon={vehicleIcon}
                    >
                      <Popup>
                        <div className="p-2">
                          <h3 className="font-semibold">Vehicle {vehicle.id}</h3>
                          <p className="text-sm">Status: {vehicle.status}</p>
                          <p className="text-sm">Destination: {vehicle.destination}</p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                  {/* Routes */}
                  {showRoutes && routes.map((route, index) => (
                    <Polyline
                      key={index}
                      positions={[route.from, route.to]}
                      color="blue"
                      weight={3}
                      opacity={0.7}
                      dashArray="10, 10"
                    />
                  ))}

                  <Marker
                    position={[28.7041, 77.1025]} // Adjust if needed
                    icon={warehouseIcon}
                  >
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-semibold">Main Warehouse</h3>
                        <p className="text-sm">Central Supply Hub</p>
                      </div>
                    </Popup>
                </Marker>

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
                <h2 className="text-lg font-semibold text-gray-900">Configure {currentStore.name}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Current Inventory: {currentStore.inventory}% | Demand: {currentStore.demand}
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

                {/* Store Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Store
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.values(stores).map((store) => (
                      <button
                        key={store.id}
                        onClick={() => setSelectedStore(store.id)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedStore === store.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {store.name}
                      </button>
                    ))}
                  </div>
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