'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';
import Link from 'next/link';

interface News {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  image?: string;
  published: boolean;
  publishedAt?: string;
  category: string;
  views: number;
}

export default function AdminNews() {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    image: '',
    images: [] as string[],
    published: false,
    category: 'Vesti',
    tags: '',
  });
  const [uploading, setUploading] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getNews();
      setNews(data);
    } catch (error) {
      toast.error('Greška pri učitavanju vesti');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isMain = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isMain) {
      setUploading(true);
    } else {
      setUploadingIndex(formData.images.length);
    }

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('folder', 'vesti');

      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadFormData,
      });

      const data = await response.json();
      if (isMain) {
        setFormData((prev) => ({ ...prev, image: data.url }));
      } else {
        setFormData((prev) => ({ ...prev, images: [...prev.images, data.url] }));
      }
      toast.success('Slika je uspešno upload-ovana');
    } catch (error) {
      toast.error('Greška pri upload-u slike');
    } finally {
      setUploading(false);
      setUploadingIndex(null);
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newsData = {
        ...formData,
        slug: formData.slug || generateSlug(formData.title),
        tags: formData.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        publishedAt: formData.published ? new Date().toISOString() : undefined,
      };

      if (editingNews) {
        await apiClient.updateNews(editingNews._id, newsData);
        toast.success('Vest je uspešno ažurirana');
      } else {
        await apiClient.createNews(newsData);
        toast.success('Vest je uspešno kreirana');
      }

      setShowModal(false);
      setEditingNews(null);
      setFormData({
        title: '',
        slug: '',
        content: '',
        excerpt: '',
        image: '',
        images: [],
        published: false,
        category: 'Vesti',
        tags: '',
      });
      loadNews();
    } catch (error: any) {
      toast.error(error.message || 'Greška pri čuvanju vesti');
    }
  };

  const handleEdit = async (item: News) => {
    try {
      // Učitaj punu vest da dobijemo content i images
      const fullNews = await apiClient.getNewsBySlug(item.slug);
      setEditingNews(item);
      setFormData({
        title: fullNews.title || item.title,
        slug: fullNews.slug || item.slug,
        content: fullNews.content || '',
        excerpt: fullNews.excerpt || item.excerpt,
        image: fullNews.image || item.image || '',
        images: fullNews.images || [],
        published: fullNews.published !== undefined ? fullNews.published : item.published,
        category: fullNews.category || item.category,
        tags: fullNews.tags ? fullNews.tags.join(', ') : '',
      });
      setShowModal(true);
    } catch (error) {
      toast.error('Greška pri učitavanju vesti');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Da li ste sigurni da želite da obrišete ovu vest?')) return;

    try {
      await apiClient.deleteNews(id);
      toast.success('Vest je uspešno obrisana');
      loadNews();
    } catch (error: any) {
      toast.error(error.message || 'Greška pri brisanju vesti');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-playfair uppercase tracking-wider">Vesti</h1>
        <button
          onClick={() => {
            setEditingNews(null);
            setFormData({
              title: '',
              slug: '',
              content: '',
              excerpt: '',
              image: '',
              images: [],
              published: false,
              category: 'Vesti',
              tags: '',
            });
            setShowModal(true);
          }}
          className="bg-white text-black px-4 sm:px-6 py-2 sm:py-3 font-semibold uppercase tracking-wider hover:bg-gray-200 transition-all flex items-center text-sm sm:text-base w-full sm:w-auto justify-center"
        >
          <Plus className="mr-2" size={18} />
          Dodaj Vest
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="text-gray-400">Učitavanje...</div>
        </div>
      ) : (
        <div className="space-y-4">
          {news.map((item) => (
            <div
              key={item._id}
              className="bg-white/5 border border-white/10 p-4 sm:p-6 hover:bg-white/10 transition-all"
            >
              <div className="flex flex-col sm:flex-row items-start gap-4 sm:space-x-6">
                <div className="w-full sm:w-32 h-48 sm:h-32 bg-white/10 relative flex-shrink-0">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                      Slika
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <h3 className="text-lg sm:text-xl font-semibold mb-1">{item.title}</h3>
                      <p className="text-gray-400 text-xs sm:text-sm mb-2">{item.excerpt}</p>
                      <div className="flex flex-wrap items-center gap-2 sm:space-x-4 text-xs sm:text-sm text-gray-400">
                        <span>{item.category}</span>
                        <span>•</span>
                        <span className="flex items-center">
                          <Eye size={14} className="mr-1" />
                          {item.views}
                        </span>
                        <span>•</span>
                        <span className={item.published ? 'text-green-400' : 'text-yellow-400'}>
                          {item.published ? 'Objavljeno' : 'Nacrt'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2 mt-4">
                    <Link
                      href={`/novosti/${item.slug}`}
                      target="_blank"
                      className="bg-white/10 text-white px-3 sm:px-4 py-2 hover:bg-white/20 transition-all flex items-center justify-center text-xs sm:text-sm"
                    >
                      <Eye size={14} className="sm:mr-2" />
                      <span className="hidden sm:inline">Pregled</span>
                    </Link>
                    <button
                      onClick={() => handleEdit(item)}
                      className="bg-white/10 text-white px-4 py-2 hover:bg-white/20 transition-all flex items-center text-sm"
                    >
                      <Edit size={16} className="mr-2" />
                      Izmeni
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="bg-red-500/20 text-red-400 px-4 py-2 hover:bg-red-500/30 transition-all flex items-center text-sm"
                    >
                      <Trash2 size={16} className="mr-2" />
                      Obriši
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="bg-black border border-white/10 p-4 sm:p-6 md:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold font-playfair mb-6">
              {editingNews ? 'Izmeni Vest' : 'Dodaj Vest'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Naslov</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      title: e.target.value,
                      slug: generateSlug(e.target.value),
                    })
                  }
                  className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Slug (URL)</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Kategorija</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tagovi (razdvojeno zarezom)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white"
                    placeholder="tag1, tag2, tag3"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Kratak Opis</label>
                <textarea
                  required
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Sadržaj</label>
                <textarea
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={10}
                  className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white resize-none font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Glavna Slika</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, true)}
                  className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white"
                />
                {formData.image && (
                  <div className="mt-4 relative w-64 h-40">
                    <Image
                      src={formData.image}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                {uploading && <p className="text-sm text-gray-400 mt-2">Upload u toku...</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Dodatne Slike (galerija)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, false)}
                  className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white"
                />
                {formData.images.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                    {formData.images.map((img, index) => (
                      <div key={index} className="relative aspect-video group">
                        <Image
                          src={img}
                          alt={`Slika ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {uploadingIndex !== null && <p className="text-sm text-gray-400 mt-2">Upload u toku...</p>}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="published"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  className="w-4 h-4 mr-2"
                />
                <label htmlFor="published" className="text-sm">
                  Objavi odmah
                </label>
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="flex-1 bg-white text-black px-6 py-3 font-semibold uppercase tracking-wider hover:bg-gray-200 transition-all"
                >
                  {editingNews ? 'Sačuvaj Izmene' : 'Kreiraj Vest'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingNews(null);
                  }}
                  className="flex-1 bg-white/10 text-white px-6 py-3 font-semibold uppercase tracking-wider hover:bg-white/20 transition-all"
                >
                  Otkaži
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

