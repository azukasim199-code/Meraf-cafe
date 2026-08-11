import React, { useEffect, useState } from 'react';
import { Category, Product, AddOn } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Plus,
  Edit2,
  Trash2,
  Image,
  Tag,
  Clock,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Check,
  X,
  RefreshCw,
  Upload,
} from 'lucide-react';

export const AdminMenuManager: React.FC = () => {
  const { token } = useAuth();
  const { t, language } = useLanguage();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Form Modal States
  const [showProductModal, setShowProductModal] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [prodNameEn, setProdNameEn] = useState('');
  const [prodNameAm, setProdNameAm] = useState('');
  const [prodDescEn, setProdDescEn] = useState('');
  const [prodDescAm, setProdDescAm] = useState('');
  const [prodPrice, setProdPrice] = useState('45');
  const [prodCategory, setProdCategory] = useState('');
  const [prodImage, setProdImage] = useState('');
  const [prodPrepTime, setProdPrepTime] = useState('5');
  const [prodAvailable, setProdAvailable] = useState(true);
  const [prodFeatured, setProdFeatured] = useState(false);

  const imagePresets = [
    { label: '☕ Ethiopian Bunna', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=800' },
    { label: '🥛 Macchiato / Latte', url: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&q=80&w=800' },
    { label: '⚡ Espresso', url: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&q=80&w=800' },
    { label: '🧊 Iced Coffee', url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&q=80&w=800' },
    { label: '🥐 Croissant / Pastry', url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=800' },
    { label: '🥪 Sandwich / Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800' },
    { label: '🍰 Cake / Dessert', url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=800' },
    { label: '🧃 Juice / Smoothie', url: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&q=80&w=800' },
  ];

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image file is too large (max 5MB)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setProdImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchData = () => {
    setIsLoading(true);
    fetch('/api/menu/public')
      .then((res) => res.json())
      .then((data) => {
        setCategories(data.categories || []);
        setProducts(data.products || []);
        setAddOns(data.addOns || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenNewProduct = () => {
    setEditingProduct(null);
    setProdNameEn('');
    setProdNameAm('');
    setProdDescEn('');
    setProdDescAm('');
    setProdPrice('45');
    setProdCategory(categories.length > 0 ? categories[0].id : '');
    setProdImage('https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=800');
    setProdPrepTime('5');
    setProdAvailable(true);
    setProdFeatured(false);
    setShowProductModal(true);
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProdNameEn(p.nameEn);
    setProdNameAm(p.nameAm);
    setProdDescEn(p.descriptionEn);
    setProdDescAm(p.descriptionAm);
    setProdPrice(p.priceEtb.toString());
    setProdCategory(p.categoryId);
    setProdImage(p.imageUrl);
    setProdPrepTime(p.prepTimeMins.toString());
    setProdAvailable(p.isAvailable);
    setProdFeatured(p.isFeatured);
    setShowProductModal(true);
  };

  const handleSaveProduct = async () => {
    const payload = {
      categoryId: prodCategory,
      nameEn: prodNameEn,
      nameAm: prodNameAm,
      descriptionEn: prodDescEn,
      descriptionAm: prodDescAm,
      priceEtb: parseFloat(prodPrice),
      imageUrl: prodImage,
      prepTimeMins: parseInt(prodPrepTime),
      isAvailable: prodAvailable,
      isFeatured: prodFeatured,
    };

    try {
      const url = editingProduct
        ? `/api/menu/products/${editingProduct.id}`
        : `/api/menu/products`;
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowProductModal(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleAvailability = async (product: Product) => {
    try {
      const res = await fetch(`/api/menu/products/${product.id}/availability`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isAvailable: !product.isAvailable }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`/api/menu/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-[#121215] p-4 rounded-2xl border border-zinc-800 shadow-xl">
        <div>
          <h3 className="font-serif-luxury font-bold text-white text-lg">{t('menuManagement')}</h3>
          <p className="text-zinc-400 text-xs mt-0.5">
            Add, edit, change prices, and toggle availability for Meraf Cafe items.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNewProduct}
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Products Table / Grid */}
      {isLoading ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto mb-2" />
        </div>
      ) : (
        <div className="bg-[#121215] rounded-2xl border border-zinc-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-100">
              <thead className="bg-[#16161a] border-b border-zinc-800 text-amber-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Product</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Price (ETB)</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {products.map((p) => {
                  const cat = categories.find((c) => c.id === p.categoryId);
                  return (
                    <tr key={p.id} className="hover:bg-zinc-900/60 transition-colors">
                      <td className="p-3.5 flex items-center gap-3">
                        <img
                          src={p.imageUrl}
                          alt={p.nameEn}
                          className="w-10 h-10 rounded-xl object-cover bg-zinc-900 border border-zinc-800"
                        />
                        <div>
                          <div className="font-bold text-white">{p.nameEn}</div>
                          <div className="text-[11px] text-zinc-400">{p.nameAm}</div>
                        </div>
                      </td>
                      <td className="p-3.5 text-zinc-300 font-medium">
                        {cat ? cat.nameEn : 'General'}
                      </td>
                      <td className="p-3.5 font-extrabold text-amber-400">
                        {p.priceEtb} ETB
                      </td>
                      <td className="p-3.5">
                        <button
                          type="button"
                          onClick={() => handleToggleAvailability(p)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 transition-all ${
                            p.isAvailable
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {p.isAvailable ? <Check className="w-3 h-3 stroke-[3]" /> : <X className="w-3 h-3 stroke-[3]" />}
                          <span>{p.isAvailable ? 'Available' : 'Unavailable'}</span>
                        </button>
                      </td>
                      <td className="p-3.5 text-right space-x-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditProduct(p)}
                          className="p-1.5 text-zinc-400 hover:text-amber-400 rounded-lg hover:bg-zinc-900 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-zinc-900 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Product Form Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-[#121215] border border-zinc-800 text-slate-100 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl my-8">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h4 className="font-serif-luxury font-bold text-lg text-white">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h4>
              <button
                type="button"
                onClick={() => setShowProductModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-amber-400 mb-1">English Name</label>
                  <input
                    type="text"
                    value={prodNameEn}
                    onChange={(e) => setProdNameEn(e.target.value)}
                    className="w-full p-2.5 bg-zinc-900 border border-zinc-800 text-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-amber-400 mb-1">Amharic Name (አማርኛ)</label>
                  <input
                    type="text"
                    value={prodNameAm}
                    onChange={(e) => setProdNameAm(e.target.value)}
                    className="w-full p-2.5 bg-zinc-900 border border-zinc-800 text-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-amber-400 mb-1">Price (ETB)</label>
                  <input
                    type="number"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    className="w-full p-2.5 bg-zinc-900 border border-zinc-800 text-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-amber-400 mb-1">Category</label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="w-full p-2.5 bg-zinc-900 border border-zinc-800 text-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Product Image Section */}
              <div className="space-y-2 p-3 bg-zinc-950/80 border border-zinc-800 rounded-2xl">
                <label className="block font-bold text-amber-400 text-xs uppercase tracking-wider">
                  Product Image
                </label>

                {/* Preview and Upload controls */}
                <div className="flex gap-3 items-start">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 shrink-0 relative flex items-center justify-center">
                    {prodImage ? (
                      <img
                        src={prodImage}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=800';
                        }}
                      />
                    ) : (
                      <Image className="w-8 h-8 text-zinc-600" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/10">
                        <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Upload File</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileUpload}
                          className="hidden"
                        />
                      </label>

                      {prodImage && (
                        <button
                          type="button"
                          onClick={() => setProdImage('')}
                          className="px-2.5 py-1.5 text-zinc-400 hover:text-red-400 text-xs font-semibold hover:bg-zinc-900 rounded-xl transition-colors cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      value={prodImage}
                      onChange={(e) => setProdImage(e.target.value)}
                      placeholder="Or paste image URL (https://...)"
                      className="w-full p-2 bg-zinc-900 border border-zinc-800 text-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs placeholder-zinc-500"
                    />
                  </div>
                </div>

                {/* Presets */}
                <div>
                  <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Or Pick Cafe Sample Photo:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {imagePresets.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setProdImage(preset.url)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                          prodImage === preset.url
                            ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                            : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-amber-400 mb-1">English Description</label>
                  <textarea
                    rows={2}
                    value={prodDescEn}
                    onChange={(e) => setProdDescEn(e.target.value)}
                    className="w-full p-2.5 bg-zinc-900 border border-zinc-800 text-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-amber-400 mb-1">Amharic Description</label>
                  <textarea
                    rows={2}
                    value={prodDescAm}
                    onChange={(e) => setProdDescAm(e.target.value)}
                    className="w-full p-2.5 bg-zinc-900 border border-zinc-800 text-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 font-bold text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prodAvailable}
                    onChange={(e) => setProdAvailable(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-500 bg-zinc-900 border-zinc-700"
                  />
                  <span>Is Available</span>
                </label>

                <label className="flex items-center gap-2 font-bold text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prodFeatured}
                    onChange={(e) => setProdFeatured(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-500 bg-zinc-900 border-zinc-700"
                  />
                  <span>Is Featured</span>
                </label>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowProductModal(false)}
                className="px-4 py-2 rounded-xl text-zinc-400 hover:bg-zinc-800 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProduct}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 rounded-xl font-bold text-xs shadow-md shadow-amber-500/20"
              >
                Save Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
