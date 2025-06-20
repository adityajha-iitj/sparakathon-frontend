"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Package,
  MapPin,
  Phone,
  Mail,
  User,
  Building2,
  Brain,
  X,
  Loader,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

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

interface WebSocketMessage {
  type: string;
  message?: string;
  iteration?: number;
  tool_name?: string;
  success?: boolean;
  result?: any;
  analysis?: string;
  summary?: string;
  session_id?: string;
  arguments: string;
}

interface LiveUpdate {
  id: string;
  timestamp: string;
  type: "info" | "success" | "error" | "analysis" | "tool_execution";
  message: string;
  details?: any;
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
    economic_conditions: "",
    economic_notes: "",
    political_instability: "",
    political_notes: "",
    environmental_issues: "",
    environmental_notes: "",
  });
  const [orderNotes, setOrderNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // New state for AI order creation and live updates
  const [isAIOrderActive, setIsAIOrderActive] = useState(false);
  const [aiOrderSubmitting, setAIOrderSubmitting] = useState(false);
  const [showLiveSidebar, setShowLiveSidebar] = useState(false);
  const [liveUpdates, setLiveUpdates] = useState<LiveUpdate[]>([]);
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [updateCounter, setUpdateCounter] = useState(0);
  const liveUpdatesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (storeId) {
      fetchStoreDetails();
    }
  }, [storeId]);

  const fetchStoreDetails = async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/stores/${storeId}`
      );
      if (!response.ok) throw new Error("Failed to fetch store details");

      const storeData: Store = await response.json();
      setStore(storeData);
      setConditions({
        economic_conditions: storeData.economic_conditions || "",
        economic_notes: storeData.economic_notes || "",
        political_instability: storeData.political_instability || "",
        political_notes: storeData.political_notes || "",
        environmental_issues: storeData.environmental_issues || "",
        environmental_notes: storeData.environmental_notes || "",
      });

      // Initialize order items with empty quantities
      const items = storeData.items.map((item) => ({
        ...item,
        order_quantity: 0,
      }));
      setOrderItems(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const updateItemQuantity = (itemName: string, newQuantity: number) => {
    setOrderItems((prev) =>
      prev.map((item) =>
        item.item_name === itemName
          ? { ...item, order_quantity: Math.max(0, newQuantity) }
          : item
      )
    );
  };

  const updateConditions = async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/stores/${storeId}/conditions/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(conditions),
        }
      );

      if (!response.ok) throw new Error("Failed to update conditions");
      alert("Conditions updated successfully!");
    } catch (err) {
      alert(
        "Error updating conditions: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    }
  };

  const createOrder = async () => {
    setSubmitting(true);
    try {
      const itemsToOrder = orderItems.filter(
        (item) => (item.order_quantity || 0) > 0
      );

      if (itemsToOrder.length === 0) {
        alert("Please select at least one item to order");
        return;
      }

      const orderData = {
        store_id: storeId,
        store_name: store?.store_name,
        main_store_id: "507f1f77bcf86cd799439012",
        items: itemsToOrder.map((item) => ({
          item_name: item.item_name,
          quantity: item.order_quantity,
          unit: item.unit,
          price: item.price,
          category: item.category,
        })),
        notes: orderNotes,
      };

      const response = await fetch("/orders/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) throw new Error("Failed to create order");

      const result = await response.json();
      alert(`Order created successfully! Order ID: ${result.order_id}`);

      // Reset order form
      setOrderItems((prev) =>
        prev.map((item) => ({ ...item, order_quantity: 0 }))
      );
      setOrderNotes("");
    } catch (err) {
      alert(
        "Error creating order: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getConditionColor = (condition: string): string => {
    switch (condition) {
      case "low":
        return "text-green-600 bg-green-100";
      case "medium":
        return "text-yellow-600 bg-yellow-100";
      case "high":
      case "critical":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStockColor = (current: number, max: number): string => {
    const percentage = (current / max) * 100;
    if (percentage < 30) return "bg-red-500";
    if (percentage < 60) return "bg-yellow-500";
    return "bg-green-500";
  };

  // WebSocket connection for live updates
  useEffect(() => {
    if (isAIOrderActive && !websocket) {
      connectToGeminiWebSocket();
    }

    return () => {
      if (websocket) {
        websocket.close();
      }
    };
  }, [isAIOrderActive]);

  // Auto-scroll live updates
  useEffect(() => {
    if (liveUpdatesRef.current) {
      liveUpdatesRef.current.scrollTop = liveUpdatesRef.current.scrollHeight;
    }
  }, [liveUpdates]);

  const connectToGeminiWebSocket = () => {
    try {
      const ws = new WebSocket(
        "ws://localhost:8000/api/gemini/ws/feedback-loop"
      );

      ws.onopen = () => {
        console.log("Connected to Gemini WebSocket");
        setWebsocket(ws);
        addLiveUpdate("info", "Connected to AI assistant");
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onclose = () => {
        console.log("Disconnected from Gemini WebSocket");
        setWebsocket(null);
        addLiveUpdate("info", "Disconnected from AI assistant");
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        addLiveUpdate("error", "Connection error with AI assistant");
      };
    } catch (error) {
      console.error("Failed to connect to WebSocket:", error);
      addLiveUpdate("error", "Failed to connect to AI assistant");
    }
  };

  const handleWebSocketMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case "connection":
        if (message.session_id) {
          setSessionId(message.session_id);
          addLiveUpdate(
            "success",
            `Session established: ${message.session_id.substring(0, 8)}...`
          );
        }
        break;

      case "langgraph_workflow_start":
        addLiveUpdate(
          "info",
          "AI workflow started - analyzing store conditions..."
        );
        break;

      case "iteration_start":
        addLiveUpdate("info", `Processing step ${message.iteration}...`);
        break;

      case "gemini_analysis":
        if (message.analysis) {
          addLiveUpdate("analysis", "AI Analysis Complete", {
            analysis: message.analysis,
          });
        }
        break;

      case "tool_execution_start":
        addLiveUpdate("info", `Executing: ${message.tool_name}`, {
          tool: message.tool_name,
          tool_args: message.arguments,
        });
        break;

      case "tool_execution_result":
        const resultType = message.success ? "success" : "error";
        addLiveUpdate(
          resultType,
          `${message.tool_name}: ${message.success ? "Success" : "Failed"}`,
          {
            result: message.result,
          }
        );
        break;

      case "feedback_loop_complete":
        addLiveUpdate("success", "AI order analysis complete!", {
          summary: message.summary,
        });
        setAIOrderSubmitting(false);
        break;

      case "error":
        addLiveUpdate("error", message.message || "An error occurred");
        setAIOrderSubmitting(false);
        break;

      default:
        if (message.message) {
          addLiveUpdate("info", message.message);
        }
    }
  };

  const addLiveUpdate = (
    type: LiveUpdate["type"],
    message: string,
    details?: any
  ) => {
    const update: LiveUpdate = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Use random string for uniqueness
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      details,
    };

    setLiveUpdates((prev) => [...prev, update]);
    setUpdateCounter((prev) => prev + 1);
  };

  const createAIOrder = async () => {
    if (!store || !websocket) return;

    setAIOrderSubmitting(true);
    setShowLiveSidebar(true);
    setLiveUpdates([]);

    // Construct detailed prompt for AI analysis
    const storeAnalysisPrompt = `
Analyze the current store "${
      store.store_name
    }" and create an intelligent order recommendation:
The store may be a main store or a subordinate store.So analyse it also and do the needful.You can call tools in total of 8 times only.Be carefull of limit.And do the task under this limit in any case it shouldn't exit the tool call limit.The limit is 5 including all tools.

STORE DETAILS:
- Name: ${store.store_name}
- Type: ${store.store_type}
- Location: ${store.store_address}
- Active Status: ${store.is_active ? "Active" : "Inactive"}

CURRENT CONDITIONS:
- Economic Conditions: ${conditions.economic_conditions || "Not specified"} ${
      conditions.economic_notes ? `(${conditions.economic_notes})` : ""
    }
- Political Instability: ${
      conditions.political_instability || "Not specified"
    } ${conditions.political_notes ? `(${conditions.political_notes})` : ""}
- Environmental Issues: ${conditions.environmental_issues || "Not specified"} ${
      conditions.environmental_notes
        ? `(${conditions.environmental_notes})`
        : ""
    }

CURRENT INVENTORY STATUS:
${store.items
  .map((item) => {
    const stockPercentage = Math.round(
      (item.current_quantity / item.max_quantity) * 100
    );
    const stockStatus =
      stockPercentage < 30
        ? "CRITICALLY LOW"
        : stockPercentage < 60
        ? "LOW"
        : "ADEQUATE";
    return `- ${item.item_name}: ${item.current_quantity}/${item.max_quantity} ${item.unit} (${stockPercentage}% - ${stockStatus})`;
  })
  .join("\n")}

TASK:
1. Analyze the store conditions (economic, political, environmental) and how they might affect supply/demand
2. Identify items that are critically low or running low based on current inventory
3. Consider the store type and location for demand patterns.You don't need to order all items.You may order which may required urgently.
4. Find nearby main stores that can fulfill orders efficiently
5. Create optimal order recommendations with quantities and justification
6. Consider urgency based on conditions (e.g., if political instability is high, recommend larger safety stock)
7. Also asses the location.Say If a store is from us and a war is going to happen there don't order from there

Please provide:
- Priority items to order and suggested quantities
- Reasoning based on current conditions
- Recommended main store for fulfillment
- Total estimated cost and delivery timeline
- Risk assessment and mitigation strategies

Execute this analysis step by step using available tools to gather current system data and create the optimal order.
`;

    try {
      const request = {
        action: "start_feedback_loop",
        request: storeAnalysisPrompt,
        max_iterations: 15,
      };

      websocket.send(JSON.stringify(request));
      addLiveUpdate("info", "AI order analysis started...");
    } catch (error) {
      console.error("Error starting AI order creation:", error);
      addLiveUpdate("error", "Failed to start AI analysis");
      setAIOrderSubmitting(false);
    }
  };

  const stopAIOrder = () => {
    if (websocket) {
      websocket.send(JSON.stringify({ action: "stop_feedback_loop" }));
    }
    setAIOrderSubmitting(false);
    addLiveUpdate("info", "AI analysis stopped by user");
  };

  const closeLiveSidebar = () => {
    setShowLiveSidebar(false);
    if (websocket) {
      websocket.close();
      setWebsocket(null);
    }
    setIsAIOrderActive(false);
  };

  const getUpdateIcon = (type: LiveUpdate["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "analysis":
        return <Brain className="w-4 h-4 text-purple-500" />;
      case "tool_execution":
        return <Package className="w-4 h-4 text-blue-500" />;
      default:
        return <div className="w-4 h-4 rounded-full bg-gray-400" />;
    }
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 font-[family-name:var(--font-inter)] relative">
      {/* Live Updates Sidebar */}
      {showLiveSidebar && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-50 border-l border-gray-300">
          <div className="flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-300 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                <h3 className="font-semibold text-white">AI Order Assistant</h3>
              </div>
              <button
                onClick={closeLiveSidebar}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Session Info */}
            {sessionId && (
              <div className="px-4 py-2 bg-blue-50 border-b border-gray-300">
                <p className="text-xs text-blue-700 font-medium">
                  Session: {sessionId.substring(0, 8)}...
                </p>
              </div>
            )}

            {/* Live Updates */}
            <div className="flex-1 overflow-hidden bg-gray-50">
              <div
                ref={liveUpdatesRef}
                className="h-full overflow-y-auto p-4 space-y-3"
              >
                {liveUpdates.map((update) => (
                  <div
                    key={update.id}
                    className="flex gap-3 bg-white rounded-lg p-3 shadow-sm border border-gray-200"
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getUpdateIcon(update.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-600 font-medium">
                          {update.timestamp}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            update.type === "success"
                              ? "bg-green-100 text-green-800 border border-green-200"
                              : update.type === "error"
                              ? "bg-red-100 text-red-800 border border-red-200"
                              : update.type === "analysis"
                              ? "bg-purple-100 text-purple-800 border border-purple-200"
                              : "bg-gray-100 text-gray-800 border border-gray-200"
                          }`}
                        >
                          {update.type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 break-words font-medium leading-relaxed">
                        {update.message}
                      </p>

                      {/* Expandable details */}
                      {update.details && (
                        <details className="mt-2">
                          <summary className="text-xs text-blue-700 cursor-pointer hover:text-blue-900 font-medium">
                            View details
                          </summary>
                          <div className="mt-1 p-2 bg-gray-100 rounded text-xs font-mono max-h-32 overflow-y-auto border border-gray-300">
                            <pre className="whitespace-pre-wrap break-words text-gray-800">
                              {typeof update.details === "string"
                                ? update.details
                                : JSON.stringify(update.details, null, 2)}
                            </pre>
                          </div>
                        </details>
                      )}
                    </div>
                  </div>
                ))}

                {aiOrderSubmitting && (
                  <div className="flex items-center gap-3 py-2 bg-white rounded-lg p-3 shadow-sm border border-blue-200">
                    <Loader className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="text-sm text-gray-900 font-medium">
                      AI analyzing...
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-gray-300 bg-white">
              {aiOrderSubmitting ? (
                <button
                  onClick={stopAIOrder}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm"
                >
                  Stop Analysis
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-gray-700 text-center font-medium">
                    {liveUpdates.length} updates received
                  </p>
                  <button
                    onClick={() => setLiveUpdates([])}
                    className="w-full px-4 py-1 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors rounded font-medium"
                  >
                    Clear Updates
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
                <h1 className="text-3xl font-bold text-gray-800">
                  {store.store_name}
                </h1>
                <p className="text-gray-600 flex items-center gap-1 mt-1">
                  <Building2 className="w-4 h-4" />
                  {store.store_type}
                </p>
              </div>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                store.is_active
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {store.is_active ? "Active" : "Inactive"}
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
                <p className="font-medium text-gray-800">
                  {store.store_address}
                </p>
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
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Store Conditions
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Economic Conditions
              </label>
              <select
                value={conditions.economic_conditions}
                onChange={(e) =>
                  setConditions((prev) => ({
                    ...prev,
                    economic_conditions: e.target.value,
                  }))
                }
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
                onChange={(e) =>
                  setConditions((prev) => ({
                    ...prev,
                    economic_notes: e.target.value,
                  }))
                }
                className="w-full mt-2 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900"
                rows={3}
              />
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Political Instability
              </label>
              <select
                value={conditions.political_instability}
                onChange={(e) =>
                  setConditions((prev) => ({
                    ...prev,
                    political_instability: e.target.value,
                  }))
                }
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
                onChange={(e) =>
                  setConditions((prev) => ({
                    ...prev,
                    political_notes: e.target.value,
                  }))
                }
                className="w-full mt-2 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900"
                rows={3}
              />
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Environmental Issues
              </label>
              <select
                value={conditions.environmental_issues}
                onChange={(e) =>
                  setConditions((prev) => ({
                    ...prev,
                    environmental_issues: e.target.value,
                  }))
                }
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
                onChange={(e) =>
                  setConditions((prev) => ({
                    ...prev,
                    environmental_notes: e.target.value,
                  }))
                }
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
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50"
              >
                <h3 className="font-semibold text-gray-800 mb-2">
                  {item.item_name}
                </h3>
                <div className="space-y-1 text-sm text-gray-800">
                  <p>
                    <span className="text-gray-600">Category:</span>{" "}
                    <span className="font-medium">{item.category}</span>
                  </p>
                  <p>
                    <span className="text-gray-600">Current:</span>{" "}
                    <span className="font-medium">
                      {item.current_quantity} {item.unit}
                    </span>
                  </p>
                  <p>
                    <span className="text-gray-600">Max:</span>{" "}
                    <span className="font-medium">
                      {item.max_quantity} {item.unit}
                    </span>
                  </p>
                  <p>
                    <span className="text-gray-600">Price:</span>{" "}
                    <span className="font-medium">${item.price}</span>
                  </p>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getStockColor(
                        item.current_quantity,
                        item.max_quantity
                      )}`}
                      style={{
                        width: `${Math.min(
                          (item.current_quantity / item.max_quantity) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {Math.round(
                      (item.current_quantity / item.max_quantity) * 100
                    )}
                    % in stock
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Create Order */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Order Management
            </h2>
            <button
              onClick={() => setIsAIOrderActive(!isAIOrderActive)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isAIOrderActive
                  ? "bg-purple-600 text-white hover:bg-purple-700"
                  : "bg-gray-600 text-white hover:bg-gray-700"
              }`}
            >
              {isAIOrderActive ? "Switch to Manual" : "Switch to AI Assistant"}
            </button>
          </div>

          {isAIOrderActive ? (
            // AI Order Creation Section
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <Brain className="w-6 h-6 text-purple-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">
                      AI-Powered Smart Ordering
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Our AI will analyze your store's current conditions,
                      inventory levels, and market factors to recommend optimal
                      orders from nearby main stores.
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="font-medium text-gray-700">
                          Analysis includes:
                        </span>
                        <ul className="mt-1 text-gray-600 space-y-1">
                          <li>• Current inventory levels</li>
                          <li>• Economic conditions impact</li>
                          <li>• Political stability factors</li>
                        </ul>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          AI will recommend:
                        </span>
                        <ul className="mt-1 text-gray-600 space-y-1">
                          <li>• Priority items to order</li>
                          <li>• Optimal quantities</li>
                          <li>• Best supplier selection</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={createAIOrder}
                  disabled={aiOrderSubmitting || !store}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 font-medium text-lg flex items-center justify-center gap-2"
                >
                  {aiOrderSubmitting ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Analyzing Store...
                    </>
                  ) : (
                    <>
                      <Brain className="w-5 h-5" />
                      Create Smart Order
                    </>
                  )}
                </button>

                {aiOrderSubmitting && (
                  <button
                    onClick={stopAIOrder}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Stop
                  </button>
                )}
              </div>

              {!showLiveSidebar && liveUpdates.length > 0 && (
                <button
                  onClick={() => setShowLiveSidebar(true)}
                  className="w-full px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                >
                  View Live Updates ({liveUpdates.length})
                </button>
              )}
            </div>
          ) : (
            // Original Manual Order Creation
            <button
              onClick={createOrder}
              disabled={
                submitting ||
                orderItems.every((item) => (item.order_quantity || 0) === 0)
              }
              className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-medium text-lg"
            >
              {submitting ? "Creating Order..." : "Create Manual Order"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreConfigPage;
