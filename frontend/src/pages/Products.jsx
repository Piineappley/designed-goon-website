import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '@/App';
import { Button } from '@/components/ui/button';
import { Sparkles, LogOut, Palette } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Products = () => {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/products`);
      setProducts(response.data);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts =
    filter === 'all' ? products : products.filter((p) => p.category === filter);

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <Sparkles className="w-6 h-6 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">ThreadLab</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Hi, {user?.name}!</span>
            <Button
              data-testid="products-dashboard-btn"
              variant="ghost"
              onClick={() => navigate('/dashboard')}
            >
              My Designs
            </Button>
            <Button
              data-testid="products-orders-btn"
              variant="ghost"
              onClick={() => navigate('/orders')}
            >
              Orders
            </Button>
            <Button
              data-testid="products-logout-btn"
              variant="outline"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">Choose Your Canvas</h1>
            <p className="text-lg text-gray-600">Select a product to start designing</p>
          </div>

          {/* Filter Tabs */}
          <div className="flex justify-center gap-4 mb-12">
            {['all', 't-shirt', 'hoodie', 'mug'].map((category) => (
              <Button
                key={category}
                data-testid={`filter-${category}-btn`}
                variant={filter === category ? 'default' : 'outline'}
                onClick={() => setFilter(category)}
                className={`px-6 py-2 rounded-full capitalize ${
                  filter === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category === 'all' ? 'All Products' : category.replace('-', ' ')}
              </Button>
            ))}
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  data-testid={`product-card-${product.id}`}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all overflow-hidden group"
                >
                  <div className="relative h-72 overflow-hidden bg-gray-100">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full capitalize">
                        {product.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{product.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-gray-900">${product.base_price}</span>
                      <Button
                        data-testid={`design-now-btn-${product.id}`}
                        onClick={() => navigate(`/design/${product.id}`)}
                        className="bg-blue-600 hover:bg-blue-700 text-white gap-2 rounded-xl px-6"
                      >
                        <Palette className="w-4 h-4" />
                        Design Now
                      </Button>
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

export default Products;
