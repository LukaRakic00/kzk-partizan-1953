'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LiveMatches from '@/components/LiveMatches';
import InteractiveBackground from '@/components/InteractiveBackground';
import { apiClient } from '@/lib/api-client';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface Gallery {
  _id: string;
  title: string;
  description?: string;
  images: string[];
  category: string;
}

export default function GalerijaPage() {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [allImages, setAllImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [openGalleries, setOpenGalleries] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadGalleries();
  }, []);

  const loadGalleries = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getGalleries();
      // Filtriraj samo galerije sa kategorijom "igraci"
      const igraciGalleries = data.filter((g: Gallery) => g.category === 'igraci');
      setGalleries(igraciGalleries);
      
      // Pripremi sve slike za galeriju
      const allImagesList: string[] = [];
      igraciGalleries.forEach((gallery) => {
        gallery.images.forEach((img: string) => allImagesList.push(img));
      });
      setAllImages(allImagesList);
    } catch (error) {
      console.error('Error loading galleries:', error);
    } finally {
      setLoading(false);
    }
  };

  const openImageGallery = (imageUrl: string) => {
    const index = allImages.indexOf(imageUrl);
    if (index !== -1) {
      setSelectedImageIndex(index);
    }
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (selectedImageIndex === null) return;
    
    if (direction === 'prev') {
      const newIndex = selectedImageIndex > 0 ? selectedImageIndex - 1 : allImages.length - 1;
      setSelectedImageIndex(newIndex);
    } else {
      const newIndex = selectedImageIndex < allImages.length - 1 ? selectedImageIndex + 1 : 0;
      setSelectedImageIndex(newIndex);
    }
  };

  const closeImageGallery = () => {
    setSelectedImageIndex(null);
  };

  const toggleGallery = (galleryId: string) => {
    setOpenGalleries((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(galleryId)) {
        newSet.delete(galleryId);
      } else {
        newSet.add(galleryId);
      }
      return newSet;
    });
  };

  // Automatski otvori najnoviju galeriju kada se učitaju galerije (samo jednom)
  useEffect(() => {
    if (galleries.length > 0 && openGalleries.size === 0) {
      // Sortiraj po _id (opadajuće za najnoviju - MongoDB ObjectId sadrži timestamp)
      const sorted = [...galleries].sort((a, b) => {
        return b._id.localeCompare(a._id);
      });
      const newestGallery = sorted[0];
      if (newestGallery) {
        setOpenGalleries(new Set([newestGallery._id]));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [galleries.length]); // Samo kada se promeni broj galerija

  // Sortiraj galerije po _id (opadajuće za najnoviju)
  const sortedGalleries = [...galleries].sort((a, b) => {
    return b._id.localeCompare(a._id);
  });

  return (
    <main className="min-h-screen relative">
      {/* Interactive Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <InteractiveBackground />
      </div>

      <div className="relative z-10">
      <Navbar />

      <section className="pt-40 md:pt-48 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
              <h1 className="text-[36px] font-bold font-playfair uppercase tracking-wider mb-4 text-white">
                Galerija
            </h1>
              <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Prolazite kroz naše najlepše trenutke i uspehe kroz godine. Svaka fotografija priča priču o strasti, posvećenosti i zajedništvu koje čini KŽK Partizan 1953 posebnim.
            </p>
              <div className="w-24 h-1 bg-white mx-auto mt-6"></div>
          </motion.div>
          {loading ? (
            <div className="text-center py-20">
              <div className="text-gray-400">Učitavanje galerije...</div>
            </div>
          ) : (
            <>
                {sortedGalleries.length > 0 ? (
                  <div className="space-y-6">
                    {sortedGalleries.map((gallery, galleryIndex) => {
                      const isOpen = openGalleries.has(gallery._id);
                      
                      return (
                    <motion.div
                          key={gallery._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: galleryIndex * 0.1 }}
                          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden"
                        >
                          {/* Gallery Header */}
                          <button
                            onClick={() => toggleGallery(gallery._id)}
                            className="w-full flex items-center justify-between p-6 hover:bg-white/10 transition-colors text-left"
                          >
                            <div className="flex-1">
                              <h2 className="text-2xl md:text-3xl font-bold font-playfair text-white mb-1">
                                {gallery.title || `Galerija ${galleryIndex + 1}`}
                              </h2>
                            </div>
                            {isOpen ? (
                              <ChevronUp size={24} className="text-white flex-shrink-0 ml-4" />
                            ) : (
                              <ChevronDown size={24} className="text-white flex-shrink-0 ml-4" />
                        )}
                          </button>

                          {/* Gallery Content */}
                          <AnimatePresence>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                              >
                                <div className="p-6 pt-0">
                                  {gallery.description && (
                                    <p className="text-gray-300 mb-4 text-sm md:text-base">
                                      {gallery.description}
                                    </p>
                                  )}
                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {gallery.images.map((image, imgIndex) => (
                          <motion.div
                            key={imgIndex}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: imgIndex * 0.05 }}
                                            className="aspect-square relative overflow-hidden cursor-pointer group rounded-lg"
                                            onClick={() => openImageGallery(image)}
                          >
                            <Image
                              src={image}
                                              alt={`${gallery.title || 'Galerija'} - ${imgIndex + 1}`}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                          </motion.div>
                        ))}
                      </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                    </motion.div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-20">
                  <p className="text-gray-400">Galerija će biti dodata uskoro.</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

        {/* Image Gallery Modal */}
        {selectedImageIndex !== null && allImages[selectedImageIndex] && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
            onClick={closeImageGallery}
          >
            <button
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10 p-2 bg-black/50 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                closeImageGallery();
              }}
            >
              <X size={24} />
            </button>
            
            {/* Previous Button */}
            {allImages.length > 1 && (
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10 p-3 bg-black/50 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateImage('prev');
          }}
        >
                <ChevronLeft size={32} />
              </button>
            )}

            {/* Next Button */}
            {allImages.length > 1 && (
          <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10 p-3 bg-black/50 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateImage('next');
            }}
          >
                <ChevronRight size={32} />
          </button>
            )}

            {/* Image Counter */}
            {allImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black/50 px-4 py-2 rounded-full text-sm z-10">
                {selectedImageIndex + 1} / {allImages.length}
              </div>
            )}

            <div className="max-w-5xl w-full relative" onClick={(e) => e.stopPropagation()}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedImageIndex}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
            <Image
                    src={allImages[selectedImageIndex]}
                    alt={`Image ${selectedImageIndex + 1}`}
              width={1200}
              height={800}
                    className="object-contain max-h-[90vh] w-full"
            />
                </motion.div>
              </AnimatePresence>
          </div>
        </div>
      )}

      <LiveMatches />
      <Footer />
      </div>
    </main>
  );
}

