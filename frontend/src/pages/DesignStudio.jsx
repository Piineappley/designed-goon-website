import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Transformer } from 'react-konva';
import useImage from 'use-image';
import { AuthContext } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useDropzone } from 'react-dropzone';
import { Sparkles, Upload, Type, Save, ShoppingCart, Trash2, ArrowLeft } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Component to render an uploaded image on canvas
const CanvasImage = ({ imageData, isSelected, onSelect, onChange }) => {
  const [image] = useImage(imageData.src);
  const shapeRef = useRef();
  const trRef = useRef();

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <KonvaImage
        image={image}
        ref={shapeRef}
        x={imageData.x}
        y={imageData.y}
        width={imageData.width}
        height={imageData.height}
        rotation={imageData.rotation}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          onChange({
            ...imageData,
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={(e) => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          onChange({
            ...imageData,
            x: node.x(),
            y: node.y(),
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(5, node.height() * scaleY),
            rotation: node.rotation(),
          });
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
};

// Component to render text on canvas
const CanvasTextElement = ({ textData, isSelected, onSelect, onChange }) => {
  const shapeRef = useRef();
  const trRef = useRef();

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <KonvaText
        ref={shapeRef}
        text={textData.text}
        x={textData.x}
        y={textData.y}
        fontSize={textData.fontSize}
        fontFamily={textData.fontFamily}
        fill={textData.color}
        rotation={textData.rotation}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          onChange({
            ...textData,
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={(e) => {
          const node = shapeRef.current;
          onChange({
            ...textData,
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
          });
        }}
      />
      {isSelected && <Transformer ref={trRef} enabledAnchors={[]} rotateEnabled={true} />}
    </>
  );
};

const DesignStudio = () => {
  const navigate = useNavigate();
  const { productId, designId } = useParams();
  const { user } = useContext(AuthContext);
  const stageRef = useRef();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Canvas elements
  const [images, setImages] = useState([]);
  const [texts, setTexts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedType, setSelectedType] = useState(null);

  // Text editor state
  const [newText, setNewText] = useState('');
  const [textColor, setTextColor] = useState('#000000');
  const [fontSize, setFontSize] = useState(32);
  const [fontFamily, setFontFamily] = useState('Arial');

  useEffect(() => {
    loadProduct();
    if (designId) {
      loadDesign();
    }
  }, [productId, designId]);

  const loadProduct = async () => {
    try {
      const response = await axios.get(`${API}/products/${productId}`);
      setProduct(response.data);
    } catch (error) {
      toast.error('Failed to load product');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const loadDesign = async () => {
    try {
      const response = await axios.get(`${API}/designs/${designId}`);
      const designData = response.data.design_data;
      setImages(designData.images || []);
      setTexts(designData.texts || []);
    } catch (error) {
      toast.error('Failed to load design');
    }
  };

  const onDrop = (acceptedFiles) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const newImage = {
          id: `img-${Date.now()}-${Math.random()}`,
          src: reader.result,
          x: 50,
          y: 50,
          width: 200,
          height: 200,
          rotation: 0,
        };
        setImages([...images, newImage]);
        toast.success('Image added to canvas');
      };
      reader.readAsDataURL(file);
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
    multiple: true,
  });

  const addText = () => {
    if (!newText.trim()) {
      toast.error('Please enter some text');
      return;
    }

    const newTextElement = {
      id: `text-${Date.now()}`,
      text: newText,
      x: 100,
      y: 100,
      fontSize: fontSize,
      fontFamily: fontFamily,
      color: textColor,
      rotation: 0,
    };
    setTexts([...texts, newTextElement]);
    setNewText('');
    toast.success('Text added to canvas');
  };

  const handleSelect = (id, type) => {
    setSelectedId(id);
    setSelectedType(type);
  };

  const deleteSelected = () => {
    if (!selectedId) {
      toast.error('Please select an element to delete');
      return;
    }

    if (selectedType === 'image') {
      setImages(images.filter((img) => img.id !== selectedId));
    } else if (selectedType === 'text') {
      setTexts(texts.filter((txt) => txt.id !== selectedId));
    }
    setSelectedId(null);
    setSelectedType(null);
    toast.success('Element deleted');
  };

  const saveDesign = async () => {
    if (images.length === 0 && texts.length === 0) {
      toast.error('Please add at least one element to your design');
      return;
    }

    setSaving(true);
    try {
      const designData = {
        images,
        texts,
      };

      // Generate thumbnail (simplified - just export stage)
      const dataURL = stageRef.current.toDataURL();

      const payload = {
        product_id: productId,
        design_data: designData,
        thumbnail: dataURL,
      };

      if (designId) {
        await axios.put(`${API}/designs/${designId}`, payload);
        toast.success('Design updated successfully!');
      } else {
        await axios.post(`${API}/designs`, payload);
        toast.success('Design saved successfully!');
      }

      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to save design');
    } finally {
      setSaving(false);
    }
  };

  const proceedToCheckout = async () => {
    if (images.length === 0 && texts.length === 0) {
      toast.error('Please add elements to your design before ordering');
      return;
    }

    setSaving(true);
    try {
      const designData = { images, texts };
      const dataURL = stageRef.current.toDataURL();
      const payload = {
        product_id: productId,
        design_data: designData,
        thumbnail: dataURL,
      };

      let savedDesignId = designId;
      if (!designId) {
        const designResponse = await axios.post(`${API}/designs`, payload);
        savedDesignId = designResponse.data.id;
      }

      // Create order
      await axios.post(`${API}/orders`, {
        design_id: savedDesignId,
        product_id: productId,
        quantity: 1,
      });

      toast.success('Order placed successfully!');
      navigate('/orders');
    } catch (error) {
      toast.error('Failed to place order');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              data-testid="design-back-btn"
              variant="ghost"
              onClick={() => navigate('/products')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Design Studio</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              data-testid="design-save-btn"
              variant="outline"
              onClick={saveDesign}
              disabled={saving}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              Save Design
            </Button>
            <Button
              data-testid="design-checkout-btn"
              onClick={proceedToCheckout}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              Order Now
            </Button>
          </div>
        </div>
      </nav>

      <div className="pt-20 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Canvas Area */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
                  <p className="text-gray-600">Design your custom {product.category}</p>
                </div>

                <div className="relative bg-gray-100 rounded-xl overflow-hidden" style={{ aspectRatio: '1' }}>
                  <Stage
                    ref={stageRef}
                    width={600}
                    height={600}
                    className="border-2 border-gray-200"
                    onClick={(e) => {
                      if (e.target === e.target.getStage()) {
                        setSelectedId(null);
                        setSelectedType(null);
                      }
                    }}
                  >
                    <Layer>
                      {images.map((img) => (
                        <CanvasImage
                          key={img.id}
                          imageData={img}
                          isSelected={img.id === selectedId && selectedType === 'image'}
                          onSelect={() => handleSelect(img.id, 'image')}
                          onChange={(newAttrs) => {
                            const newImages = images.map((i) => (i.id === img.id ? newAttrs : i));
                            setImages(newImages);
                          }}
                        />
                      ))}
                      {texts.map((txt) => (
                        <CanvasTextElement
                          key={txt.id}
                          textData={txt}
                          isSelected={txt.id === selectedId && selectedType === 'text'}
                          onSelect={() => handleSelect(txt.id, 'text')}
                          onChange={(newAttrs) => {
                            const newTexts = texts.map((t) => (t.id === txt.id ? newAttrs : t));
                            setTexts(newTexts);
                          }}
                        />
                      ))}
                    </Layer>
                  </Stage>
                </div>

                {selectedId && (
                  <div className="mt-4">
                    <Button
                      data-testid="design-delete-btn"
                      variant="destructive"
                      onClick={deleteSelected}
                      className="gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Selected
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Tools Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-24">
                <Tabs defaultValue="upload" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="upload" data-testid="tab-upload">
                      <Upload className="w-4 h-4 mr-2" />
                      Image
                    </TabsTrigger>
                    <TabsTrigger value="text" data-testid="tab-text">
                      <Type className="w-4 h-4 mr-2" />
                      Text
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload" className="space-y-4">
                    <div
                      {...getRootProps()}
                      data-testid="dropzone-area"
                      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                        isDragActive
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      <input {...getInputProps()} />
                      <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600 font-medium mb-2">
                        {isDragActive ? 'Drop images here' : 'Drag & drop images'}
                      </p>
                      <p className="text-sm text-gray-500">or click to browse</p>
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      Uploaded images: {images.length}
                    </p>
                  </TabsContent>

                  <TabsContent value="text" className="space-y-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="text-input">Your Text</Label>
                        <Input
                          id="text-input"
                          data-testid="text-input"
                          type="text"
                          placeholder="Enter text..."
                          value={newText}
                          onChange={(e) => setNewText(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addText()}
                          className="h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="font-family">Font</Label>
                        <Select value={fontFamily} onValueChange={setFontFamily}>
                          <SelectTrigger data-testid="font-select">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Arial">Arial</SelectItem>
                            <SelectItem value="Helvetica">Helvetica</SelectItem>
                            <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                            <SelectItem value="Courier New">Courier New</SelectItem>
                            <SelectItem value="Georgia">Georgia</SelectItem>
                            <SelectItem value="Verdana">Verdana</SelectItem>
                            <SelectItem value="Impact">Impact</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="font-size">Size: {fontSize}px</Label>
                        <Slider
                          id="font-size"
                          data-testid="font-size-slider"
                          value={[fontSize]}
                          onValueChange={(vals) => setFontSize(vals[0])}
                          min={12}
                          max={120}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="text-color">Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="text-color"
                            data-testid="text-color-input"
                            type="color"
                            value={textColor}
                            onChange={(e) => setTextColor(e.target.value)}
                            className="h-12 w-20 cursor-pointer"
                          />
                          <Input
                            type="text"
                            value={textColor}
                            onChange={(e) => {
                              const val = e.target.value;
                              // Only update if valid hex color format or empty
                              if (val === '' || /^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                                setTextColor(val);
                              }
                            }}
                            placeholder="#000000"
                            className="h-12 flex-1"
                          />
                        </div>
                      </div>

                      <Button
                        data-testid="add-text-btn"
                        onClick={addText}
                        className="w-full h-12 bg-blue-600 hover:bg-blue-700"
                      >
                        <Type className="w-4 h-4 mr-2" />
                        Add Text to Canvas
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignStudio;
