'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LiveMatches from '@/components/LiveMatches';
import InteractiveBackground from '@/components/InteractiveBackground';
import { apiClient } from '@/lib/api-client';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Eye, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';

interface News {
  _id: string;
  title: string;
  slug: string;
  content: string;
  image?: string;
  images?: string[];
  publishedAt?: string;
  views: number;
  category: string;
}

export default function VestiDetailPage() {
  const params = useParams();
  const [news, setNews] = useState<News | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.slug) {
      loadNews();
    }
  }, [params.slug]);

  const loadNews = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getNewsBySlug(params.slug as string);
      setNews(data);
    } catch (error) {
      console.error('Error loading news:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen relative">
      {/* Interactive Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <InteractiveBackground />
      </div>

      <div className="relative z-10">
        <Navbar />

      <article className="pt-32 md:pt-40 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/vesti"
            className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="mr-2" size={20} />
            Nazad na vesti
          </Link>

          {loading ? (
            <div className="text-center py-20">
              <div className="text-gray-400">Učitavanje vesti...</div>
            </div>
          ) : news ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div>
                <div className="flex items-center justify-between mb-4 text-sm text-gray-400">
                  <span className="uppercase tracking-wider">{news.category}</span>
                  {news.publishedAt && (
                    <div className="flex items-center">
                      <Calendar size={14} className="mr-1" />
                      {format(new Date(news.publishedAt), 'dd.MM.yyyy')}
                    </div>
                  )}
                </div>
                <h1 className="text-4xl md:text-5xl font-bold font-playfair mb-6">{news.title}</h1>
                <div className="flex items-center text-sm text-gray-400 mb-8">
                  <Eye size={16} className="mr-1" />
                  {news.views} pregleda
                </div>
              </div>

              {/* Glavna slika ili galerija */}
              {news.image && (
                <div className="aspect-video relative overflow-hidden rounded-lg">
                  <Image
                    src={news.image}
                    alt={news.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              {/* Više slika - galerija */}
              {news.images && news.images.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
                  {news.images.map((img, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="aspect-video relative overflow-hidden rounded-lg"
                    >
                      <Image
                        src={img}
                        alt={`${news.title} - Slika ${index + 1}`}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </motion.div>
                  ))}
                </div>
              )}

              <div className="prose prose-invert max-w-none">
                <ReactMarkdown className="text-gray-300 leading-relaxed">
                  {news.content}
                </ReactMarkdown>
              </div>
            </motion.div>
          ) : (
            <div className="text-center py-20">
              <p className="text-gray-400">Vest nije pronađena.</p>
            </div>
          )}
        </div>
      </article>

        <LiveMatches />
        <Footer />
      </div>
    </main>
  );
}

