'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LiveMatches from '@/components/LiveMatches';
import InteractiveBackground from '@/components/InteractiveBackground';
import { apiClient } from '@/lib/api-client';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import CloudinaryImage from '@/components/CloudinaryImage';
import { Management, Team, subcategoryLabels } from '@/types';

export default function KlubPage() {
  const [teamData, setTeamData] = useState<Team>({});
  const [management, setManagement] = useState<Management[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const team = await apiClient.getTeam() as Team | null;
      if (team) {
        setTeamData({
          season: team.season || '2024/25',
          upravniOdborImage: team.upravniOdborImage || '',
          menadzmentImage: team.menadzmentImage || '',
          subcategoryImages: team.subcategoryImages || {},
        });
      }
      const mgmt = await apiClient.getManagement();
      setManagement(mgmt.sort((a, b) => a.order - b.order));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group management by type and subcategory
  const groupedManagement = {
    upravni_odbor: {
      predsednik: [] as Management[],
      podpredsednik: [] as Management[],
      clanovi_upravnog_odbora: [] as Management[],
      menadzment: [] as Management[],
    },
    menadzment: {
      direktor: [] as Management[],
      sportski_direktor: [] as Management[],
      direktor_marketinga: [] as Management[],
      pr_marketinga: [] as Management[],
      finansijski_direktor: [] as Management[],
    },
  };

  management.forEach((member) => {
    if (member.type === 'upravni_odbor' && member.subcategory) {
      const subcat = member.subcategory as keyof typeof groupedManagement.upravni_odbor;
      if (groupedManagement.upravni_odbor.hasOwnProperty(subcat)) {
        groupedManagement.upravni_odbor[subcat].push(member);
      }
    } else if (member.type === 'menadzment' && member.subcategory) {
      const subcat = member.subcategory as keyof typeof groupedManagement.menadzment;
      if (groupedManagement.menadzment.hasOwnProperty(subcat)) {
        groupedManagement.menadzment[subcat].push(member);
      }
    }
  });

  const upravniOdborSubcategories = ['predsednik', 'podpredsednik', 'clanovi_upravnog_odbora', 'menadzment'] as const;
  const menadzmentSubcategories = ['direktor', 'sportski_direktor', 'direktor_marketinga', 'pr_marketinga', 'finansijski_direktor'] as const;

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
            {loading ? (
              <div className="text-center py-20">
                <div className="text-gray-400">Učitavanje...</div>
              </div>
            ) : (
              <div className="space-y-16">
                {/* Upravni Odbor Sekcija */}
                <motion.div
                  id="upravni-odbor"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="scroll-mt-32"
                >
                  <div className="text-center mb-8 sm:mb-12">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-playfair uppercase tracking-wider text-white mb-4">
                      UPRAVNI ODBOR
                    </h2>
                    <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
                      Sa zadovoljstvom vam predstavljamo upravni odbor našeg kluba – ljude posvećene viziji, razvoju i uspehu KŽK Partizan!
                    </p>
                  </div>

                  {/* Kartice za Subkategorije */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                    {upravniOdborSubcategories.map((subcat) => {
                      const members = groupedManagement.upravni_odbor[subcat] || [];
                      const subcatId = subcat === 'clanovi_upravnog_odbora' ? 'clanovi-upravnog-odbora' : subcat;
                      const subcatImage = teamData.subcategoryImages?.[subcat as keyof typeof teamData.subcategoryImages];
                      
                      return (
                        <motion.div
                          key={subcat}
                          id={subcatId}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="scroll-mt-32"
                        >
                          <div className="bg-gradient-to-b from-white/5 to-white/0 border border-white/10 rounded-2xl p-8 hover:border-white/20 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 h-full flex flex-col backdrop-blur-sm">
                            {/* Naslov - centriran na vrhu */}
                            <h3 className="text-lg font-bold font-playfair uppercase tracking-wider text-white mb-6 text-center">
                              {subcategoryLabels[subcat]}
                            </h3>
                            
                            {/* Slika subkategorije - centrirana */}
                            {subcatImage && (
                              <div className="relative w-full h-48 mx-auto mb-6 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center bg-white/5">
                                {subcatImage.includes('cloudinary.com') ? (
                                  <CloudinaryImage
                                    src={subcatImage}
                                    alt={subcategoryLabels[subcat]}
                                    fill
                                    className="object-contain"
                                  />
                                ) : (
                                  <Image
                                    src={subcatImage}
                                    alt={subcategoryLabels[subcat]}
                                    fill
                                    className="object-contain"
                                    unoptimized
                                  />
                                )}
                              </div>
                            )}
                            
                            {/* Članovi */}
                            {members.length > 0 ? (
                              <div className="flex-grow flex flex-col gap-6">
                                {members.length === 1 ? (
                                  // Ako je samo jedan član - centriran prikaz
                                  <div className="flex flex-col items-center justify-center text-center">
                                    <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-white/20 mb-4 shadow-lg flex items-center justify-center">
                                      {members[0].image ? (
                                        members[0].image.includes('cloudinary.com') ? (
                                          <CloudinaryImage
                                            src={members[0].image}
                                            alt={members[0].name}
                                            fill
                                            className="object-cover"
                                          />
                                        ) : (
                                          <Image
                                            src={members[0].image}
                                            alt={members[0].name}
                                            fill
                                            className="object-cover"
                                            unoptimized
                                          />
                                        )
                                      ) : (
                                        <div className="w-full h-full bg-white/10 flex items-center justify-center">
                                          <span className="text-gray-500 text-sm">Slika</span>
                                        </div>
                                      )}
                                    </div>
                                    <h4 className="text-base font-bold text-white mb-2">{members[0].name}</h4>
                                    {members[0].position && (
                                      <p className="text-sm text-gray-300">{members[0].position}</p>
                                    )}
                                  </div>
                                ) : (
                                  // Ako ima više članova - grid layout
                                  <div className="grid grid-cols-2 gap-4">
                                    {members.slice(0, 4).map((member) => (
                                      <div key={member._id} className="flex flex-col items-center text-center">
                                        <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-white/20 mb-3 shadow-md flex items-center justify-center">
                                          {member.image ? (
                                            member.image.includes('cloudinary.com') ? (
                                              <CloudinaryImage
                                                src={member.image}
                                                alt={member.name}
                                                fill
                                                className="object-cover"
                                              />
                                            ) : (
                                              <Image
                                                src={member.image}
                                                alt={member.name}
                                                fill
                                                className="object-cover"
                                                unoptimized
                                              />
                                            )
                                          ) : (
                                            <div className="w-full h-full bg-white/10 flex items-center justify-center">
                                              <span className="text-gray-500 text-xs">Slika</span>
                                            </div>
                                          )}
                                        </div>
                                        <h4 className="text-xs font-bold text-white mb-1 line-clamp-1">{member.name}</h4>
                                        {member.position && (
                                          <p className="text-xs text-gray-400 line-clamp-2">{member.position}</p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                {members.length > 4 && (
                                  <div className="text-center text-xs text-gray-400 mt-2 pt-4 border-t border-white/10">
                                    +{members.length - 4} {members.length - 4 === 1 ? 'više' : 'više'}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex-grow flex items-center justify-center">
                                <div className="text-center text-sm text-gray-400 py-8">
                                  Nema članova
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>


                  {/* Glavna slika Upravnog Odbora */}
                  {teamData.upravniOdborImage && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 }}
                      className="relative w-full max-w-3xl mx-auto aspect-[16/9] rounded-lg overflow-hidden border border-white/10 shadow-xl"
                    >
                      {teamData.upravniOdborImage.includes('cloudinary.com') ? (
                        <CloudinaryImage
                          src={teamData.upravniOdborImage}
                          alt="Upravni Odbor"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <Image
                          src={teamData.upravniOdborImage}
                          alt="Upravni Odbor"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      )}
                    </motion.div>
                  )}
                </motion.div>

                {/* Menadžment Sekcija */}
                <motion.div
                  id="menadzment"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="scroll-mt-32"
                >
                  <div className="text-center mb-8 sm:mb-12">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-playfair uppercase tracking-wider text-white mb-4">
                      MENADŽMENT
                    </h2>
                    <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
                      Naš menadžment tim čine stručnjaci koji vode klub ka novim visinama, obezbeđujući profesionalizam, strategiju i kontinuirani rast KŽK Partizan.
                    </p>
                  </div>

                  {/* Kartice za Subkategorije */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
                    {menadzmentSubcategories.map((subcat) => {
                      const members = groupedManagement.menadzment[subcat] || [];
                      const subcatId = subcat === 'sportski_direktor' ? 'sportski-direktor' : 
                                      subcat === 'direktor_marketinga' ? 'direktor-marketinga' :
                                      subcat === 'pr_marketinga' ? 'pr-marketinga' :
                                      subcat === 'finansijski_direktor' ? 'finansijski-direktor' : subcat;
                      const subcatImage = teamData.subcategoryImages?.[subcat as keyof typeof teamData.subcategoryImages];
                      
                      return (
                        <motion.div
                          key={subcat}
                          id={subcatId}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                          className="scroll-mt-32"
                        >
                          <div className="bg-gradient-to-b from-white/5 to-white/0 border border-white/10 rounded-2xl p-8 hover:border-white/20 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 h-full flex flex-col backdrop-blur-sm">
                            {/* Naslov - centriran na vrhu */}
                            <h3 className="text-base font-bold font-playfair uppercase tracking-wider text-white mb-6 text-center leading-tight">
                              {subcategoryLabels[subcat]}
                            </h3>
                            
                            {/* Slika subkategorije - centrirana */}
                            {subcatImage && (
                              <div className="relative w-full h-40 mx-auto mb-6 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center bg-white/5">
                                {subcatImage.includes('cloudinary.com') ? (
                                  <CloudinaryImage
                                    src={subcatImage}
                                    alt={subcategoryLabels[subcat]}
                                    fill
                                    className="object-contain"
                                  />
                                ) : (
                                  <Image
                                    src={subcatImage}
                                    alt={subcategoryLabels[subcat]}
                                    fill
                                    className="object-contain"
                                    unoptimized
                                  />
                                )}
                              </div>
                            )}
                            
                            {/* Članovi */}
                            {members.length > 0 ? (
                              <div className="flex-grow flex flex-col gap-5">
                                {members.length === 1 ? (
                                  // Ako je samo jedan član - centriran prikaz
                                  <div className="flex flex-col items-center justify-center text-center">
                                    <div className="relative w-36 h-36 rounded-full overflow-hidden border-4 border-white/20 mb-4 shadow-lg flex items-center justify-center">
                                      {members[0].image ? (
                                        members[0].image.includes('cloudinary.com') ? (
                                          <CloudinaryImage
                                            src={members[0].image}
                                            alt={members[0].name}
                                            fill
                                            className="object-cover"
                                          />
                                        ) : (
                                          <Image
                                            src={members[0].image}
                                            alt={members[0].name}
                                            fill
                                            className="object-cover"
                                            unoptimized
                                          />
                                        )
                                      ) : (
                                        <div className="w-full h-full bg-white/10 flex items-center justify-center">
                                          <span className="text-gray-500 text-sm">Slika</span>
                                        </div>
                                      )}
                                    </div>
                                    <h4 className="text-sm font-bold text-white mb-2">{members[0].name}</h4>
                                    {members[0].position && (
                                      <p className="text-xs text-gray-300">{members[0].position}</p>
                                    )}
                                  </div>
                                ) : (
                                  // Ako ima više članova - vertikalni layout
                                  <div className="flex flex-col gap-5">
                                    {members.slice(0, 3).map((member) => (
                                      <div key={member._id} className="flex flex-col items-center text-center">
                                        <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-white/20 mb-2 shadow-md flex items-center justify-center">
                                          {member.image ? (
                                            member.image.includes('cloudinary.com') ? (
                                              <CloudinaryImage
                                                src={member.image}
                                                alt={member.name}
                                                fill
                                                className="object-cover"
                                              />
                                            ) : (
                                              <Image
                                                src={member.image}
                                                alt={member.name}
                                                fill
                                                className="object-cover"
                                                unoptimized
                                              />
                                            )
                                          ) : (
                                            <div className="w-full h-full bg-white/10 flex items-center justify-center">
                                              <span className="text-gray-500 text-xs">Slika</span>
                                            </div>
                                          )}
                                        </div>
                                        <h4 className="text-xs font-bold text-white mb-1 line-clamp-2">{member.name}</h4>
                                        {member.position && (
                                          <p className="text-xs text-gray-400 line-clamp-2">{member.position}</p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                {members.length > 3 && (
                                  <div className="text-center text-xs text-gray-400 mt-2 pt-4 border-t border-white/10">
                                    +{members.length - 3} {members.length - 3 === 1 ? 'više' : 'više'}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex-grow flex items-center justify-center">
                                <div className="text-center text-sm text-gray-400 py-8">
                                  Nema članova
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>


                  {/* Glavna slika Menadžmenta */}
                  {teamData.menadzmentImage && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 }}
                      className="relative w-full max-w-3xl mx-auto aspect-[16/9] rounded-lg overflow-hidden border border-white/10 shadow-xl"
                    >
                      {teamData.menadzmentImage.includes('cloudinary.com') ? (
                        <CloudinaryImage
                          src={teamData.menadzmentImage}
                          alt="Menadžment"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <Image
                          src={teamData.menadzmentImage}
                          alt="Menadžment"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      )}
                    </motion.div>
                  )}
                </motion.div>
              </div>
            )}
          </div>
        </section>

        <LiveMatches />
        <Footer />
      </div>
    </main>
  );
}
