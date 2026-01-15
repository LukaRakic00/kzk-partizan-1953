'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/lib/api-client';
import CloudinaryImage from './CloudinaryImage';

const navItems = [
  { href: '/', label: 'POČETNA' },
  { href: '/klub', label: 'KLUB' },
  { href: '/tim', label: 'TIM' },
  { href: '/o-nama', label: 'O NAMA' },
  { href: '/galerija', label: 'GALERIJA' },
  { href: '/vesti', label: 'VESTI' },
  { href: '/kontakt', label: 'KONTAKT' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [showKlubDropdown, setShowKlubDropdown] = useState(false);
  const [showTimDropdown, setShowTimDropdown] = useState(false);
  const [showONamaDropdown, setShowONamaDropdown] = useState(false);
  const [showIgraciDropdown, setShowIgraciDropdown] = useState(false);
  const [showKontaktDropdown, setShowKontaktDropdown] = useState(false);
  const [showMobileKlubDropdown, setShowMobileKlubDropdown] = useState(false);
  const [showMobileTimDropdown, setShowMobileTimDropdown] = useState(false);
  const [showMobileONamaDropdown, setShowMobileONamaDropdown] = useState(false);
  const [showMobileIgraciDropdown, setShowMobileIgraciDropdown] = useState(false);
  const [showMobileKontaktDropdown, setShowMobileKontaktDropdown] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDifference = Math.abs(currentScrollY - lastScrollY);
      
      // Ako je scroll na vrhu, uvek prikaži navbar
      if (currentScrollY < 10) {
        setScrolled(false);
        setLastScrollY(currentScrollY);
        return;
      }
      
      // Threshold da se izbegnu previše česte promene
      if (scrollDifference < 5) {
        return;
      }
      
      // Ako se scroll-uje na dole, prikaži navbar
      if (currentScrollY > lastScrollY) {
        setScrolled(false);
      } 
      // Ako se scroll-uje na gore, sakrij navbar
      else if (currentScrollY < lastScrollY) {
        setScrolled(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    loadLogo();
  }, []);

  // Zatvori sve mobilne dropdown menije kada se mobilni meni zatvara
  useEffect(() => {
    if (!isOpen) {
      setShowMobileKlubDropdown(false);
      setShowMobileTimDropdown(false);
      setShowMobileONamaDropdown(false);
      setShowMobileIgraciDropdown(false);
      setShowMobileKontaktDropdown(false);
    }
  }, [isOpen]);

  const loadLogo = async () => {
    // Primarno koristi logo iz /public foldera
    setLogoUrl('/kzk_partizan.png');
    
    // Opciono: ako želiš da se učitava iz baze kao fallback, otkomentariši kod ispod
    // try {
    //   const setting = await apiClient.getSettings('logo_url');
    //   if (setting && setting.value) {
    //     setLogoUrl(setting.value);
    //   }
    // } catch (error) {
    //   // Koristi default logo iz /public
    // }
  };

  // Split nav items into left and right
  const leftNavItems = navItems.slice(0, 3); // POČETNA, KLUB, TIM
  const rightNavItems = navItems.slice(3); // O NAMA, GALERIJA, VESTI, KONTAKT

  const renderNavItem = (item: typeof navItems[0]) => {
    if (item.href === '/klub') {
      return (
        <div
          key={item.href}
          className="relative"
          onMouseEnter={() => setShowKlubDropdown(true)}
          onMouseLeave={() => setShowKlubDropdown(false)}
        >
          <Link
            href={item.href}
            className={`text-xs lg:text-sm font-semibold font-montserrat tracking-wider uppercase transition-colors relative group px-2 py-1 ${
              pathname === item.href || pathname.startsWith('/klub')
                ? 'text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            {item.label}
            {(pathname === item.href || pathname.startsWith('/klub')) && (
              <motion.div
                className="absolute -bottom-1 left-0 right-0 h-0.5 bg-white"
                layoutId="underline"
              />
            )}
          </Link>
          {/* Dropdown Menu */}
          <AnimatePresence>
            {showKlubDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 mt-2 bg-black/95 backdrop-blur-sm border border-white/10 rounded-lg shadow-xl min-w-[200px] py-2"
              >
                <Link
                  href="/klub#upravni-odbor"
                  className="block px-4 py-2 text-sm font-montserrat tracking-wider uppercase text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                  onClick={() => setShowKlubDropdown(false)}
                >
                  Upravni Odbor
                </Link>
                <Link
                  href="/klub#menadzment"
                  className="block px-4 py-2 text-sm font-montserrat tracking-wider uppercase text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                  onClick={() => setShowKlubDropdown(false)}
                >
                  Menadžment
                </Link>
                <Link
                  href="/klub#rukovodstvo"
                  className="block px-4 py-2 text-sm font-montserrat tracking-wider uppercase text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                  onClick={() => setShowKlubDropdown(false)}
                >
                  Rukovodstvo
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }
    if (item.href === '/tim') {
      return (
        <div
          key={item.href}
          className="relative"
          onMouseEnter={() => setShowTimDropdown(true)}
          onMouseLeave={() => setShowTimDropdown(false)}
        >
          <Link
            href={item.href}
            className={`text-xs lg:text-sm font-semibold font-montserrat tracking-wider uppercase transition-colors relative group px-2 py-1 ${
              pathname === item.href || pathname.startsWith('/tim/') || pathname.startsWith('/igraci')
                ? 'text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            {item.label}
            {(pathname === item.href || pathname.startsWith('/tim/') || pathname.startsWith('/igraci')) && (
              <motion.div
                className="absolute -bottom-1 left-0 right-0 h-0.5 bg-white"
                layoutId="underline"
              />
            )}
          </Link>
          {/* Dropdown Menu */}
          <AnimatePresence>
            {showTimDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 mt-2 bg-black/95 backdrop-blur-sm border border-white/10 rounded-lg shadow-xl min-w-[200px] py-2"
              >
                <div
                  className="relative"
                  onMouseEnter={() => setShowIgraciDropdown(true)}
                  onMouseLeave={() => setShowIgraciDropdown(false)}
                >
                  <div className="block px-4 py-2 text-sm font-montserrat tracking-wider uppercase text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
                    Igrači
                    <span className="ml-2">›</span>
                  </div>
                  <AnimatePresence>
                    {showIgraciDropdown && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute left-full top-0 ml-2 bg-black/95 backdrop-blur-sm border border-white/10 rounded-lg shadow-xl min-w-[180px] py-2"
                        onMouseEnter={() => setShowIgraciDropdown(true)}
                        onMouseLeave={() => setShowIgraciDropdown(false)}
                      >
                        <Link
                          href="/igraci#seniori"
                          className="block px-4 py-2 text-sm font-montserrat tracking-wider uppercase text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                          onClick={() => {
                            setShowTimDropdown(false);
                            setShowIgraciDropdown(false);
                          }}
                        >
                          Seniori
                        </Link>
                        <Link
                          href="/igraci#juniori"
                          className="block px-4 py-2 text-sm font-montserrat tracking-wider uppercase text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                          onClick={() => {
                            setShowTimDropdown(false);
                            setShowIgraciDropdown(false);
                          }}
                        >
                          Juniori
                        </Link>
                        <Link
                          href="/igraci#kadetkinje"
                          className="block px-4 py-2 text-sm font-montserrat tracking-wider uppercase text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                          onClick={() => {
                            setShowTimDropdown(false);
                            setShowIgraciDropdown(false);
                          }}
                        >
                          Kadetkinje
                        </Link>
                        <Link
                          href="/igraci#pionirke"
                          className="block px-4 py-2 text-sm font-montserrat tracking-wider uppercase text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                          onClick={() => {
                            setShowTimDropdown(false);
                            setShowIgraciDropdown(false);
                          }}
                        >
                          Pionirke
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }
              if (item.href === '/o-nama') {
                return (
                  <div
                    key={item.href}
                    className="relative"
                    onMouseEnter={() => setShowONamaDropdown(true)}
                    onMouseLeave={() => setShowONamaDropdown(false)}
                  >
                    <Link
                      href={item.href}
                      className={`text-xs lg:text-sm font-semibold font-montserrat tracking-wider uppercase transition-colors relative group px-2 py-1 ${
                        pathname === item.href
                          ? 'text-white'
                          : 'text-gray-300 hover:text-white'
                      }`}
                    >
                      {item.label}
                      {pathname === item.href && (
                        <motion.div
                          className="absolute -bottom-1 left-0 right-0 h-0.5 bg-white"
                          layoutId="underline"
                        />
                      )}
                    </Link>
                    {/* Dropdown Menu */}
                    <AnimatePresence>
                      {showONamaDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-full left-0 mt-2 bg-black/95 backdrop-blur-sm border border-white/10 rounded-lg shadow-xl min-w-[200px] py-2"
                        >
                          <Link
                            href="/o-nama#istorijat"
                            className="block px-4 py-2 text-sm font-montserrat tracking-wider uppercase text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                            onClick={() => setShowONamaDropdown(false)}
                          >
                            Istorijat
                          </Link>
                          <Link
                            href="/o-nama#statut"
                            className="block px-4 py-2 text-sm font-montserrat tracking-wider uppercase text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                            onClick={() => setShowONamaDropdown(false)}
                          >
                            Statut
                          </Link>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }
              if (item.href === '/kontakt') {
                return (
                  <div
                    key={item.href}
                    className="relative"
                    onMouseEnter={() => setShowKontaktDropdown(true)}
                    onMouseLeave={() => setShowKontaktDropdown(false)}
                  >
                    <Link
                      href={item.href}
                      className={`text-xs lg:text-sm font-semibold font-montserrat tracking-wider uppercase transition-colors relative group px-2 py-1 ${
                        pathname === item.href
                          ? 'text-white'
                          : 'text-gray-300 hover:text-white'
                      }`}
                    >
                      {item.label}
                      {pathname === item.href && (
                        <motion.div
                          className="absolute -bottom-1 left-0 right-0 h-0.5 bg-white"
                          layoutId="underline"
                        />
                      )}
                    </Link>
                    {/* Dropdown Menu */}
                    <AnimatePresence>
                      {showKontaktDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-full right-0 mt-2 bg-black/95 backdrop-blur-sm border border-white/10 rounded-lg shadow-xl min-w-[200px] py-2"
                        >
                          <Link
                            href="/kontakt#skola-kosarke"
                            className="block px-4 py-2 text-sm font-montserrat tracking-wider uppercase text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                            onClick={() => setShowKontaktDropdown(false)}
                          >
                            Škola Košarke
                          </Link>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }
              return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-xs lg:text-sm font-semibold font-montserrat tracking-wider uppercase transition-colors relative group px-2 py-1 ${
                  pathname === item.href
                    ? 'text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                {item.label}
                {pathname === item.href && (
                  <motion.div
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-white"
                    layoutId="underline"
                  />
                )}
              </Link>
    );
  };

  // Navbar je uvek fixed na vrhu
  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-500 ${
        scrolled
          ? 'opacity-0 pointer-events-none -translate-y-full' 
          : 'opacity-100 pointer-events-auto translate-y-0 pb-4 md:pb-6'
      }`}
      style={{ background: 'transparent' }}
    >
      {/* Crna pozadina za mobilne verzije - samo kada je menu otvoren */}
      {isOpen && <div className="md:hidden absolute inset-0 bg-black/95 -z-10" />}
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center justify-between relative transition-all duration-500 ${
          scrolled ? 'h-20 md:h-24' : 'h-20 md:h-24'
        }`}>
          {/* Desktop Navigation - Left Side */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8 flex-1 justify-start">
            {leftNavItems.map((item) => renderNavItem(item))}
          </div>

          {/* Logo - Centered (Desktop) - Ispada iz navbara */}
          <Link 
            href="/" 
            className={`hidden md:flex absolute left-1/2 transform -translate-x-1/2 items-center justify-center group z-20 transition-all duration-500 ${
              scrolled 
                ? 'top-1/2 -translate-y-1/2' 
                : 'bottom-0 -bottom-2 md:-bottom-3 lg:-bottom-4'
            }`}
          >
            {logoUrl && (
              <div className={`relative flex-shrink-0 transition-all duration-500 ${
                scrolled 
                  ? 'w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24' 
                  : 'w-24 h-24 md:w-28 md:h-28 lg:w-32 lg:h-32'
              }`}>
                <CloudinaryImage
                  src={logoUrl}
                  alt="KŽK Partizan 1953 Logo"
                  fill
                  className="object-contain transition-transform duration-300 group-hover:scale-110"
                  priority
                  placeholder="blur"
                  objectFit="contain"
                />
              </div>
            )}
          </Link>

          {/* Desktop Navigation - Right Side */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8 flex-1 justify-end">
            {rightNavItems.map((item) => renderNavItem(item))}
          </div>

          {/* Mobile Logo - Centered u navbar-u */}
          <Link 
            href="/" 
            className="md:hidden absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center group z-10"
            onClick={() => setIsOpen(false)}
          >
            {logoUrl && (
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0">
                <CloudinaryImage
                  src={logoUrl}
                  alt="KŽK Partizan 1953 Logo"
                  fill
                  className="object-contain transition-transform duration-300 group-hover:scale-110"
                  priority
                  placeholder="blur"
                  objectFit="contain"
                />
              </div>
            )}
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-white p-2 z-20 ml-auto"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/10"
            style={{ background: 'transparent' }}
          >
            <div className="px-4 py-4 space-y-4">
              {navItems.map((item) => {
                if (item.href === '/klub') {
                  return (
                    <div key={item.href}>
                      <div className="flex items-center">
                        <Link
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className={`flex-1 text-left text-sm font-bold tracking-wider uppercase transition-colors ${
                            pathname === item.href || pathname.startsWith('/klub')
                              ? 'text-white border-l-2 border-white pl-4'
                              : 'text-gray-300 hover:text-white pl-4'
                          }`}
                        >
                          {item.label}
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowMobileKlubDropdown(!showMobileKlubDropdown);
                          }}
                          className="p-2 text-gray-400 hover:text-white transition-colors"
                          aria-label="Toggle dropdown"
                        >
                          {showMobileKlubDropdown ? (
                            <ChevronDown size={18} />
                          ) : (
                            <ChevronRight size={18} />
                          )}
                        </button>
                      </div>
                      <AnimatePresence>
                        {showMobileKlubDropdown && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="pl-6 mt-2 space-y-2 overflow-hidden"
                          >
                            <Link
                              href="/klub#upravni-odbor"
                              onClick={() => {
                                setIsOpen(false);
                                setShowMobileKlubDropdown(false);
                              }}
                              className="block text-sm font-montserrat tracking-wider uppercase text-gray-400 hover:text-white transition-colors"
                            >
                              Upravni Odbor
                            </Link>
                            <Link
                              href="/klub#menadzment"
                              onClick={() => {
                                setIsOpen(false);
                                setShowMobileKlubDropdown(false);
                              }}
                              className="block text-sm font-montserrat tracking-wider uppercase text-gray-400 hover:text-white transition-colors"
                            >
                              Menadžment
                            </Link>
                            <Link
                              href="/klub#rukovodstvo"
                              onClick={() => {
                                setIsOpen(false);
                                setShowMobileKlubDropdown(false);
                              }}
                              className="block text-sm font-montserrat tracking-wider uppercase text-gray-400 hover:text-white transition-colors"
                            >
                              Rukovodstvo
                            </Link>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }
                if (item.href === '/o-nama') {
                  return (
                    <div key={item.href}>
                      <div className="flex items-center">
                        <Link
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className={`flex-1 text-left text-sm font-bold tracking-wider uppercase transition-colors ${
                            pathname === item.href
                              ? 'text-white border-l-2 border-white pl-4'
                              : 'text-gray-300 hover:text-white pl-4'
                          }`}
                        >
                          {item.label}
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowMobileONamaDropdown(!showMobileONamaDropdown);
                          }}
                          className="p-2 text-gray-400 hover:text-white transition-colors"
                          aria-label="Toggle dropdown"
                        >
                          {showMobileONamaDropdown ? (
                            <ChevronDown size={18} />
                          ) : (
                            <ChevronRight size={18} />
                          )}
                        </button>
                      </div>
                      <AnimatePresence>
                        {showMobileONamaDropdown && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="pl-6 mt-2 space-y-2 overflow-hidden"
                          >
                            <Link
                              href="/o-nama#istorijat"
                              onClick={() => {
                                setIsOpen(false);
                                setShowMobileONamaDropdown(false);
                              }}
                              className="block text-sm font-montserrat tracking-wider uppercase text-gray-400 hover:text-white transition-colors"
                            >
                              Istorijat
                            </Link>
                            <Link
                              href="/o-nama#statut"
                              onClick={() => {
                                setIsOpen(false);
                                setShowMobileONamaDropdown(false);
                              }}
                              className="block text-sm font-montserrat tracking-wider uppercase text-gray-400 hover:text-white transition-colors"
                            >
                              Statut
                            </Link>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }
                if (item.href === '/tim') {
                  return (
                    <div key={item.href}>
                      <div className="flex items-center">
                        <Link
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className={`flex-1 text-left text-sm font-bold tracking-wider uppercase transition-colors ${
                            pathname === item.href || pathname.startsWith('/tim/') || pathname.startsWith('/igraci')
                              ? 'text-white border-l-2 border-white pl-4'
                              : 'text-gray-300 hover:text-white pl-4'
                          }`}
                        >
                          {item.label}
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowMobileTimDropdown(!showMobileTimDropdown);
                          }}
                          className="p-2 text-gray-400 hover:text-white transition-colors"
                          aria-label="Toggle dropdown"
                        >
                          {showMobileTimDropdown ? (
                            <ChevronDown size={18} />
                          ) : (
                            <ChevronRight size={18} />
                          )}
                        </button>
                      </div>
                      <AnimatePresence>
                        {showMobileTimDropdown && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="pl-6 mt-2 space-y-2 overflow-hidden"
                          >
                            <div>
                              <div className="flex items-center">
                                <span className="flex-1 text-sm font-montserrat tracking-wider uppercase text-gray-400 pl-4">
                                  Igrači
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowMobileIgraciDropdown(!showMobileIgraciDropdown);
                                  }}
                                  className="p-2 text-gray-400 hover:text-white transition-colors"
                                  aria-label="Toggle igrači dropdown"
                                >
                                  {showMobileIgraciDropdown ? (
                                    <ChevronDown size={16} />
                                  ) : (
                                    <ChevronRight size={16} />
                                  )}
                                </button>
                              </div>
                              <AnimatePresence>
                                {showMobileIgraciDropdown && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="pl-4 mt-2 space-y-2 overflow-hidden"
                                  >
                                    <Link
                                      href="/igraci#seniori"
                                      onClick={() => {
                                        setIsOpen(false);
                                        setShowMobileTimDropdown(false);
                                        setShowMobileIgraciDropdown(false);
                                      }}
                                      className="block text-sm font-montserrat tracking-wider uppercase text-gray-400 hover:text-white transition-colors"
                                    >
                                      Seniori
                                    </Link>
                                    <Link
                                      href="/igraci#juniori"
                                      onClick={() => {
                                        setIsOpen(false);
                                        setShowMobileTimDropdown(false);
                                        setShowMobileIgraciDropdown(false);
                                      }}
                                      className="block text-sm font-montserrat tracking-wider uppercase text-gray-400 hover:text-white transition-colors"
                                    >
                                      Juniori
                                    </Link>
                                    <Link
                                      href="/igraci#kadetkinje"
                                      onClick={() => {
                                        setIsOpen(false);
                                        setShowMobileTimDropdown(false);
                                        setShowMobileIgraciDropdown(false);
                                      }}
                                      className="block text-sm font-montserrat tracking-wider uppercase text-gray-400 hover:text-white transition-colors"
                                    >
                                      Kadetkinje
                                    </Link>
                                    <Link
                                      href="/igraci#pionirke"
                                      onClick={() => {
                                        setIsOpen(false);
                                        setShowMobileTimDropdown(false);
                                        setShowMobileIgraciDropdown(false);
                                      }}
                                      className="block text-sm font-montserrat tracking-wider uppercase text-gray-400 hover:text-white transition-colors"
                                    >
                                      Pionirke
                                    </Link>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }
                if (item.href === '/kontakt') {
                  return (
                    <div key={item.href}>
                      <div className="flex items-center">
                        <Link
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className={`flex-1 text-left text-sm font-bold tracking-wider uppercase transition-colors ${
                            pathname === item.href
                              ? 'text-white border-l-2 border-white pl-4'
                              : 'text-gray-300 hover:text-white pl-4'
                          }`}
                        >
                          {item.label}
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowMobileKontaktDropdown(!showMobileKontaktDropdown);
                          }}
                          className="p-2 text-gray-400 hover:text-white transition-colors"
                          aria-label="Toggle dropdown"
                        >
                          {showMobileKontaktDropdown ? (
                            <ChevronDown size={18} />
                          ) : (
                            <ChevronRight size={18} />
                          )}
                        </button>
                      </div>
                      <AnimatePresence>
                        {showMobileKontaktDropdown && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="pl-6 mt-2 space-y-2 overflow-hidden"
                          >
                            <Link
                              href="/kontakt#skola-kosarke"
                              onClick={() => {
                                setIsOpen(false);
                                setShowMobileKontaktDropdown(false);
                              }}
                              className="block text-sm font-montserrat tracking-wider uppercase text-gray-400 hover:text-white transition-colors"
                            >
                              Škola Košarke
                            </Link>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }
                return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`block text-sm font-bold tracking-wider uppercase transition-colors ${
                    pathname === item.href
                      ? 'text-white border-l-2 border-white pl-4'
                      : 'text-gray-300 hover:text-white pl-4'
                  }`}
                >
                  {item.label}
                </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
