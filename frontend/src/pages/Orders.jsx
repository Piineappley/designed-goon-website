import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '@/App';
import { Button } from '@/components/ui/button';
import { Sparkles, Package, ArrowLeft, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Orders = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API}/orders`);
      setOrders(response.data);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              data-testid="orders-back-btn"
              variant="ghost"
              onClick={() => navigate('/products')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Products
            </Button>
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">My Orders</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              data-testid="orders-dashboard-btn"
              variant="ghost"
              onClick={() => navigate('/dashboard')}
            >
              My Designs
            </Button>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Orders</h1>
            <p className="text-lg text-gray-600">Track your custom design orders</p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingBag className="w-20 h-20 mx-auto text-gray-400 mb-6" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">No orders yet</h2>
              <p className="text-gray-600 mb-8">Design and order your first custom product!</p>
              <Button
                data-testid="orders-start-designing-btn"
                onClick={() => navigate('/products')}
                className="bg-blue-600 hover:bg-blue-700 px-8 py-6 text-lg rounded-xl"
              >
                Browse Products
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div
                  key={order.id}
                  data-testid={`order-card-${order.id}`}
                  className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                        <Package className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Order #{order.id.slice(0, 8)}</h3>
                        <p className="text-sm text-gray-600">
                          Placed on {new Date(order.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-500">Quantity: {order.quantity}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">${order.total_price.toFixed(2)}</p>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${
                          order.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : order.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Orders;
