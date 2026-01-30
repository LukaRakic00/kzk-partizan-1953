'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LiveMatches from '@/components/LiveMatches';
import InteractiveBackground from '@/components/InteractiveBackground';
import { motion } from 'framer-motion';
import Image from 'next/image';
import CloudinaryImage from '@/components/CloudinaryImage';
import Link from 'next/link';
import { Calendar, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { News } from '@/types';

interface VestiDetailClientProps {
  news: News;
}

export default function VestiDetailClient({ news: initialNews }: VestiDetailClientProps) {
  const [news] = useState<News>(initialNews);

  return (
    <main className="min-h-screen relative">
      {/* Interactive Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <InteractiveBackground />
      </div>

      <div className="relative z-10">
        <Navbar />

        <article className="pt-40 md:pt-48 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <Link
              href="/vesti"
              className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors"
              aria-label="Nazad na listu vesti"
            >
              <ArrowLeft className="mr-2" size={20} />
              Nazad na vesti
            </Link>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <header>
                <div className="flex items-center justify-between mb-4 text-sm text-gray-400">
                  <span className="uppercase tracking-wider">{news.category}</span>
                  {news.publishedAt && (
                    <time dateTime={new Date(news.publishedAt).toISOString()} className="flex items-center">
                      <Calendar size={14} className="mr-1" />
                      {format(new Date(news.publishedAt), 'dd.MM.yyyy')}
                    </time>
                  )}
                </div>
                <h1 className="text-4xl md:text-5xl font-bold font-playfair mb-6">{news.title}</h1>
              </header>

              {/* Glavna slika ili galerija */}
              {news.image && typeof news.image === 'string' && news.image.trim() !== '' && (
                <div className="aspect-video relative overflow-hidden rounded-lg">
                  {news.image.includes('cloudinary.com') ? (
                    <CloudinaryImage
                      src={news.image}
                      alt={news.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <Image
                      src={news.image}
                      alt={news.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  )}
                </div>
              )}

              {/* Više slika - galerija */}
              {news.images && Array.isArray(news.images) && news.images.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
                  {news.images
                    .filter((img) => img && typeof img === 'string' && img.trim() !== '')
                    .map((img, index) => (
                      <motion.figure
                        key={index}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="aspect-video relative overflow-hidden rounded-lg"
                      >
                        {img.includes('cloudinary.com') ? (
                          <CloudinaryImage
                            src={img}
                            alt={`${news.title} - Slika ${index + 1}`}
                            fill
                            className="object-cover hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <Image
                            src={img}
                            alt={`${news.title} - Slika ${index + 1}`}
                            fill
                            className="object-cover hover:scale-105 transition-transform duration-300"
                            unoptimized
                          />
                        )}
                      </motion.figure>
                    ))}
                </div>
              )}

              <div className="prose prose-invert max-w-none">
                <ReactMarkdown className="text-gray-300 leading-relaxed">
                  {news.content}
                </ReactMarkdown>
              </div>
            </motion.div>
          </div>
        </article>

        <LiveMatches />
        <Footer />
      </div>
    </main>
  );
}
