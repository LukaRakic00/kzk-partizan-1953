'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { motion } from 'framer-motion';
import { Mail, Phone, User, Calendar, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

interface Contact {
  _id: string;
  name: string;
  email: string;
  title: string;
  message?: string;
  read: boolean;
  createdAt: string;
}

export default function AdminKontakt() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  useEffect(() => {
    loadContacts();
  }, [showUnreadOnly]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getContacts(showUnreadOnly);
      setContacts(data.contacts || []);
    } catch (error: any) {
      toast.error('Greška pri učitavanju poruka');
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await apiClient.request(`/api/contact/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ read: true }),
      });
      toast.success('Poruka je označena kao pročitana');
      loadContacts();
      if (selectedContact?._id === id) {
        setSelectedContact({ ...selectedContact, read: true });
      }
    } catch (error) {
      toast.error('Greška pri označavanju poruke');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sr-RS', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold font-playfair uppercase tracking-wider mb-4">
          Kontakt Poruke
        </h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            className={`px-4 py-2 border transition-colors ${
              showUnreadOnly
                ? 'bg-white text-black border-white'
                : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
            }`}
          >
            {showUnreadOnly ? (
              <>
                <EyeOff className="inline mr-2" size={16} />
                Prikaži sve
              </>
            ) : (
              <>
                <Eye className="inline mr-2" size={16} />
                Samo nepročitane
              </>
            )}
          </button>
          <button
            onClick={loadContacts}
            className="px-4 py-2 bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
          >
            Osveži
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="text-gray-400">Učitavanje poruka...</div>
        </div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-20">
          <Mail size={64} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400 text-xl">Nema poruka</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista poruka */}
          <div className="lg:col-span-1 space-y-4">
            {contacts.map((contact) => (
              <motion.div
                key={contact._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedContact(contact)}
                className={`p-4 border cursor-pointer transition-all ${
                  selectedContact?._id === contact._id
                    ? 'bg-white/10 border-white'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                } ${!contact.read ? 'border-l-4 border-l-blue-500' : ''}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-white mb-1">{contact.title}</h3>
                    <p className="text-sm text-gray-400 truncate">{contact.name}</p>
                  </div>
                  {!contact.read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar size={12} />
                  <span>{formatDate(contact.createdAt)}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Detalji poruke */}
          <div className="lg:col-span-2">
            {selectedContact ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/5 border border-white/10 p-6 md:p-8"
              >
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold font-playfair mb-2 text-white">
                      {selectedContact.title}
                    </h2>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <User size={16} />
                        <span>{selectedContact.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail size={16} />
                        <a
                          href={`mailto:${selectedContact.email}`}
                          className="hover:text-white transition-colors"
                        >
                          {selectedContact.email}
                        </a>
                      </div>
                    </div>
                  </div>
                  {!selectedContact.read && (
                    <button
                      onClick={() => markAsRead(selectedContact._id)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white transition-colors text-sm flex items-center gap-2"
                    >
                      <CheckCircle size={16} />
                      Označi kao pročitano
                    </button>
                  )}
                </div>

                {selectedContact.message && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 text-white">Poruka:</h3>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
                      <p className="text-gray-300 whitespace-pre-wrap">{selectedContact.message}</p>
                    </div>
                  </div>
                )}

                <div className="border-t border-white/10 pt-4">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar size={16} />
                    <span>Poslato: {formatDate(selectedContact.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400 mt-2">
                    {selectedContact.read ? (
                      <>
                        <CheckCircle size={16} className="text-green-400" />
                        <span className="text-green-400">Pročitano</span>
                      </>
                    ) : (
                      <>
                        <XCircle size={16} className="text-blue-400" />
                        <span className="text-blue-400">Nepročitano</span>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-white/5 border border-white/10 p-12 text-center">
                <Mail size={64} className="mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400">Izaberite poruku za pregled</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

