'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LiveMatches from '@/components/LiveMatches';
import LeagueTable from '@/components/LeagueTable';
import InteractiveBackground from '@/components/InteractiveBackground';
import { apiClient } from '@/lib/api-client';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

interface News {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  image?: string;
  published: boolean;
  publishedAt?: string;
  category: string;
}

export default function VestiPage() {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getNews();
      const publishedNews = data.filter((item: News) => item.published);
      setNews(publishedNews);
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

      <section className="pt-40 md:pt-48 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-[36px] font-bold font-playfair mb-4 uppercase tracking-wider text-white">
              Vesti
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Pratite najnovije vesti i dešavanja u klubu
            </p>
          </motion.div>

          {loading ? (
            <div className="text-center py-20">
              <div className="text-gray-400">Učitavanje vesti...</div>
            </div>
          ) : (
            <>
              {news.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {news.map((item, index) => (
                    <motion.article
                      key={item._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                    >
                      <Link href={`/vesti/${item.slug}`}>
                        <div className="aspect-video relative overflow-hidden">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full bg-white/10 flex items-center justify-center">
                              <span className="text-gray-500">Slika</span>
                            </div>
                          )}
                        </div>
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-3 text-sm text-gray-400">
                            <span className="uppercase tracking-wider">{item.category}</span>
                            {item.publishedAt && (
                              <div className="flex items-center">
                                <Calendar size={14} className="mr-1" />
                                {format(new Date(item.publishedAt), 'dd.MM.yyyy')}
                              </div>
                            )}
                          </div>
                          <h2 className="text-2xl font-bold font-playfair mb-3 group-hover:text-white transition-colors">
                            {item.title}
                          </h2>
                          <p className="text-gray-300 mb-4 line-clamp-3">{item.excerpt}</p>
                          <div className="flex items-center justify-end">
                            <span className="text-white text-sm uppercase tracking-wider flex items-center group-hover:underline">
                              Pročitaj više
                              <ArrowRight className="ml-2" size={16} />
                            </span>
                          </div>
                        </div>
                      </Link>
                    </motion.article>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <p className="text-gray-400">Vesti će biti dodate uskoro.</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

        <div className="pt-12">
          <LeagueTable />
        </div>
        <div className="pt-12">
          <LiveMatches />
        </div>
        <Footer />
      </div>
    </main>
  );
}

