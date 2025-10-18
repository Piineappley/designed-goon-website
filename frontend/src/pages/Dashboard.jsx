import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '@/App';
import { Button } from '@/components/ui/button';
import { Sparkles, Palette, Trash2, Edit, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState(null);

  useEffect(() => {
    fetchDesigns();
  }, []);

  const fetchDesigns = async () => {
    try {
      const response = await axios.get(`${API}/designs`);
      setDesigns(response.data);
    } catch (error) {
      toast.error('Failed to load designs');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/designs/${selectedDesign.id}`);
      setDesigns(designs.filter((d) => d.id !== selectedDesign.id));
      toast.success('Design deleted successfully');
    } catch (error) {
      toast.error('Failed to delete design');
    } finally {
      setDeleteDialogOpen(false);
      setSelectedDesign(null);
    }
  };

  const openDeleteDialog = (design) => {
    setSelectedDesign(design);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              data-testid="dashboard-back-btn"
              variant="ghost"
              onClick={() => navigate('/products')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Products
            </Button>
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">My Designs</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              data-testid="dashboard-orders-btn"
              variant="ghost"
              onClick={() => navigate('/orders')}
            >
              Orders
            </Button>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome back, {user?.name}!</h1>
            <p className="text-lg text-gray-600">Your saved designs are ready to edit or order</p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : designs.length === 0 ? (
            <div className="text-center py-20">
              <Palette className="w-20 h-20 mx-auto text-gray-400 mb-6" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">No designs yet</h2>
              <p className="text-gray-600 mb-8">Start creating your first custom design!</p>
              <Button
                data-testid="dashboard-start-designing-btn"
                onClick={() => navigate('/products')}
                className="bg-blue-600 hover:bg-blue-700 px-8 py-6 text-lg rounded-xl"
              >
                <Palette className="w-5 h-5 mr-2" />
                Start Designing
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {designs.map((design) => (
                <div
                  key={design.id}
                  data-testid={`design-card-${design.id}`}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all overflow-hidden group"
                >
                  <div className="relative h-64 overflow-hidden bg-gray-100">
                    {design.thumbnail ? (
                      <img
                        src={design.thumbnail}
                        alt="Design preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Palette className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <p className="text-sm text-gray-500 mb-4">
                      Created {new Date(design.created_at).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        data-testid={`edit-design-btn-${design.id}`}
                        onClick={() => navigate(`/design/${design.product_id}/${design.id}`)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </Button>
                      <Button
                        data-testid={`delete-design-btn-${design.id}`}
                        variant="outline"
                        onClick={() => openDeleteDialog(design)}
                        className="px-4 hover:bg-red-50 hover:text-red-600 hover:border-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Design?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your design.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="delete-cancel-btn">Cancel</AlertDialogCancel>
            <AlertDialogAction
              data-testid="delete-confirm-btn"
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;
