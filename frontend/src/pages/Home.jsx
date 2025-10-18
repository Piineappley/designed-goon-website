import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '@/App';
import { Button } from '@/components/ui/button';
import { Sparkles, Palette, ShoppingBag, ArrowRight } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">ThreadLab</span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Button
                  data-testid="nav-products-btn"
                  variant="ghost"
                  onClick={() => navigate('/products')}
                >
                  Products
                </Button>
                <Button
                  data-testid="nav-dashboard-btn"
                  variant="ghost"
                  onClick={() => navigate('/dashboard')}
                >
                  My Designs
                </Button>
                <Button
                  data-testid="nav-orders-btn"
                  variant="ghost"
                  onClick={() => navigate('/orders')}
                >
                  Orders
                </Button>
              </>
            ) : (
              <Button
                data-testid="nav-login-btn"
                onClick={() => navigate('/auth')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Get Started
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                Design Your Style
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Create Custom
                <span className="text-blue-600"> Clothing </span>
                That Tells Your Story
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed">
                Design custom t-shirts, hoodies, and mugs with our intuitive design studio.
                Upload images, add text, and bring your creative vision to life.
              </p>
              <div className="flex gap-4">
                <Button
                  data-testid="hero-start-designing-btn"
                  size="lg"
                  onClick={() => navigate(user ? '/products' : '/auth')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all"
                >
                  Start Designing
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  data-testid="hero-browse-products-btn"
                  size="lg"
                  variant="outline"
                  onClick={() => navigate(user ? '/products' : '/auth')}
                  className="px-8 py-6 text-lg rounded-full border-2 border-gray-300 hover:border-blue-600 transition-all"
                >
                  Browse Products
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-400 to-purple-400 rounded-3xl blur-3xl opacity-20"></div>
              <div className="relative bg-white rounded-3xl shadow-2xl p-8">
                <img
                  src="https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800"
                  alt="Custom clothing design"
                  className="rounded-2xl w-full h-[500px] object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose ThreadLab?</h2>
            <p className="text-lg text-gray-600">Everything you need to create amazing custom designs</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Palette className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Intuitive Design Studio</h3>
              <p className="text-gray-600 leading-relaxed">
                Easy-to-use canvas with drag, resize, and rotate tools. Upload images and add custom text with multiple font options.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center mb-6">
                <ShoppingBag className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Quality Products</h3>
              <p className="text-gray-600 leading-relaxed">
                Premium t-shirts, hoodies, and mugs ready for your designs. High-quality materials and printing.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-gradient-to-br from-pink-50 to-pink-100 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-pink-600 rounded-xl flex items-center justify-center mb-6">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Save & Reorder</h3>
              <p className="text-gray-600 leading-relaxed">
                Save your designs and access them anytime. Easy reordering of your favorite custom creations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Create Something Amazing?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of creators designing custom clothing with ThreadLab
          </p>
          <Button
            data-testid="cta-get-started-btn"
            size="lg"
            onClick={() => navigate(user ? '/products' : '/auth')}
            className="bg-white text-blue-600 hover:bg-gray-100 px-10 py-6 text-lg rounded-full shadow-xl hover:shadow-2xl transition-all"
          >
            Get Started for Free
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-blue-500" />
            <span className="text-2xl font-bold text-white">ThreadLab</span>
          </div>
          <p className="text-sm">© 2025 ThreadLab. Create your custom clothing designs.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
