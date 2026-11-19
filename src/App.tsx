import {useCallback, useEffect, useState} from 'react';
import {AnimatePresence, motion, useReducedMotion} from 'motion/react';
import {
  ArrowUpRight,
  CalendarHeart,
  Check,
  Copy,
  Lock,
  MapPin,
  Menu,
  Navigation,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import {AdminPanel} from './components/AdminPanel';
import {CelebrationConfetti} from './components/CelebrationConfetti';
import {CountdownStrip} from './components/CountdownStrip';
import {KaleidoscopeBackdrop} from './components/KaleidoscopeBackdrop';
import {RsvpForm} from './components/RsvpForm';
import {EVENT_INFO, type RsvpStats} from './types/rsvp';

const VENUE_SLIDES = [
  {
    id: 'pool',
    title: 'Piscina & Área Social',
    subtitle: 'Espaço de lazer, quiosque e área coberta',
    src: EVENT_INFO.venuePoolImageUrl,
    alt: 'Piscina com espreguiçadeiras, guarda-sóis e salão na Chácara Irmãos Pincinato',
  },
  {
    id: 'field',
    title: 'Campo Gramado & Jardins',
    subtitle: 'Ampla área verde para recreação e integração',
    src: EVENT_INFO.venueFieldImageUrl,
    alt: 'Campo gramado cercado por árvores e área verde da Chácara Irmãos Pincinato',
  },
] as const;

export default function App() {
  const shouldReduceMotion = useReducedMotion();
  const [viewMode, setViewMode] = useState<'invite' | 'admin'>('invite');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);
  const [stats, setStats] = useState<RsvpStats | null>(null);
  const [addressCopied, setAddressCopied] = useState(false);
  const [activeSlide, setActiveSlide] = useState<number>(0);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // ignore transient stats error
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (shouldReduceMotion || viewMode !== 'invite') return;
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % VENUE_SLIDES.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, [shouldReduceMotion, viewMode]);

  const navigateToSection = (sectionId: string) => {
    setMobileMenuOpen(false);
    if (viewMode !== 'invite') {
      setViewMode('invite');
      window.setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({behavior: 'smooth'});
      }, 60);
    } else {
      document.getElementById(sectionId)?.scrollIntoView({behavior: 'smooth'});
    }
  };

  const openAdmin = () => {
    setMobileMenuOpen(false);
    setViewMode('admin');
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  const handleCopyAddress = async () => {
    const fullAddress = `${EVENT_INFO.venueName} - ${EVENT_INFO.addressLine1}, ${EVENT_INFO.addressLine2}`;
    try {
      await navigator.clipboard.writeText(fullAddress);
      setAddressCopied(true);
      window.setTimeout(() => setAddressCopied(false), 2400);
    } catch {
      setAddressCopied(false);
    }
  };

  const markImageFailed = (key: string) => {
    setFailedImages((prev) => ({...prev, [key]: true}));
  };

  const currentSlide = VENUE_SLIDES[activeSlide];

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F8FE] text-[#141E46]">
      <CelebrationConfetti triggerKey={confettiKey} />

      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-30 border-b border-[#DCE8FA] bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-4 sm:px-6 py-3.5">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => {
              setViewMode('invite');
              window.scrollTo({top: 0, behavior: 'smooth'});
            }}
            className="font-display text-lg sm:text-xl font-bold tracking-tight text-[#26328A] whitespace-nowrap shrink-0 cursor-pointer"
          >
            Caleidoscópio
          </button>

          {/* Zone 2: Concise single-line navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#4D5E8C]">
            <button
              type="button"
              onClick={() => navigateToSection('evento')}
              className="hover:text-[#26328A] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              O Evento
            </button>
            <button
              type="button"
              onClick={() => navigateToSection('localizacao')}
              className="hover:text-[#26328A] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Localização
            </button>
            <button
              type="button"
              onClick={openAdmin}
              className={`hover:text-[#26328A] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                viewMode === 'admin' ? 'text-[#B81D62] font-semibold' : ''
              }`}
            >
              Área Admin
            </button>
          </nav>

          {/* Zone 3: 1 Primary CTA */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => navigateToSection('confirmar')}
              className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-[#26328A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1D2770] transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-sm"
            >
              <span>Confirmar Presença</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
              className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#DCE8FA] text-[#26328A] cursor-pointer"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#E6EFFC] bg-white px-4 py-3 space-y-1">
            <button
              type="button"
              onClick={() => navigateToSection('evento')}
              className="block w-full text-left rounded-lg px-3 py-2 text-sm font-medium text-[#141E46] hover:bg-[#F3F8FF]"
            >
              O Evento
            </button>
            <button
              type="button"
              onClick={() => navigateToSection('localizacao')}
              className="block w-full text-left rounded-lg px-3 py-2 text-sm font-medium text-[#141E46] hover:bg-[#F3F8FF]"
            >
              Localização
            </button>
            <button
              type="button"
              onClick={openAdmin}
              className="block w-full text-left rounded-lg px-3 py-2 text-sm font-medium text-[#B81D62] hover:bg-[#FDF2F6]"
            >
              Área Admin
            </button>
            <button
              type="button"
              onClick={() => navigateToSection('confirmar')}
              className="mt-2 block w-full text-center rounded-xl bg-[#26328A] px-4 py-2.5 text-sm font-semibold text-white"
            >
              Confirmar Presença
            </button>
          </div>
        )}
      </header>

      {viewMode === 'admin' ? (
        <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 py-10">
          <AdminPanel
            onClose={() => setViewMode('invite')}
            onStatsChange={fetchStats}
          />
        </main>
      ) : (
        <main className="flex-1">
          {/* Hero Section */}
          <section className="relative overflow-hidden border-b border-[#DCE8FA] bg-gradient-to-b from-white via-[#F5F9FF] to-[#EAF2FE]">
            <KaleidoscopeBackdrop />

            {/* 5-color signature hairline top accent */}
            <div className="relative z-10 grid grid-cols-5 h-1">
              <div className="bg-[#26328A]" />
              <div className="bg-[#2EA5DB]" />
              <div className="bg-[#B81D62]" />
              <div className="bg-[#F5931E]" />
              <div className="bg-[#7BB62D]" />
            </div>

            <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 pt-10 pb-12 sm:pt-14 sm:pb-16 space-y-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
                {/* Hero Copy & Transparent Logo */}
                <motion.div
                  initial={shouldReduceMotion ? false : {opacity: 0, y: 18}}
                  animate={{opacity: 1, y: 0}}
                  transition={{duration: 0.55, ease: [0.16, 1, 0.3, 1]}}
                  className="lg:col-span-6 flex flex-col justify-center space-y-6"
                >
                  <div className="flex items-center gap-5">
                    <motion.div
                      animate={shouldReduceMotion ? undefined : {y: [0, -4, 0]}}
                      transition={
                        shouldReduceMotion
                          ? undefined
                          : {duration: 5.5, repeat: Infinity, ease: 'easeInOut'}
                      }
                      className="h-28 w-28 sm:h-32 sm:w-32 shrink-0 flex items-center justify-center"
                    >
                      {failedImages.logo ? (
                        <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-[#26328A] text-white font-display font-bold text-2xl">
                          EC
                        </div>
                      ) : (
                        <img
                          src={EVENT_INFO.logoUrl}
                          alt="Logo oficial Escola Infantil Caleidoscópio"
                          referrerPolicy="no-referrer"
                          onError={() => markImageFailed('logo')}
                          className="h-full w-full object-contain drop-shadow-[0_12px_24px_rgba(38,50,138,0.18)]"
                        />
                      )}
                    </motion.div>

                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold tracking-wide text-[#B81D62]">
                        ESCOLA INFANTIL CALEIDOSCÓPIO
                      </p>
                      <p className="text-sm font-medium text-[#26328A]">
                        Festa de Fim de Ano
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h1
                      className="font-display font-bold tracking-tight text-[#141E46] leading-[1.06]"
                      style={{
                        fontSize: 'clamp(2.25rem, 4.1vw, 3.6rem)',
                        textWrap: 'balance',
                      }}
                    >
                      Confraternização Caleidoscópio 2026
                    </h1>
                    <p className="max-w-xl text-base sm:text-lg text-[#4D5E8C] leading-relaxed">
                      Um dia especial para celebrar, compartilhar e agradecer!
                      Chegou o momento de reunir nossa equipe e suas famílias para
                      um dia de alegria, descontração e muita diversão.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => navigateToSection('confirmar')}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#B81D62] px-6 py-3.5 text-sm font-semibold text-white hover:bg-[#9B1652] transition-all shadow-[0_10px_24px_-8px_rgba(184,29,98,0.55)] hover:-translate-y-0.5 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <CalendarHeart className="h-4 w-4" />
                      <span>Confirmar minha presença</span>
                    </button>

                    <a
                      href={EVENT_INFO.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-[#C8DAF5] bg-white/90 backdrop-blur-sm px-5 py-3.5 text-sm font-semibold text-[#26328A] hover:bg-white hover:border-[#2EA5DB] transition-all whitespace-nowrap shrink-0"
                    >
                      <MapPin className="h-4 w-4 text-[#2EA5DB]" />
                      <span>Como chegar (Mapa)</span>
                      <ArrowUpRight className="h-4 w-4 opacity-70" />
                    </a>
                  </div>

                  {stats && stats.totalPeople > 0 && (
                    <div className="flex items-center gap-2 text-xs text-[#4D5E8C] pt-1">
                      <Users className="h-4 w-4 text-[#2EA5DB]" />
                      <span>
                        <strong className="font-mono-num text-[#141E46]">
                          {stats.totalPeople}
                        </strong>{' '}
                        {stats.totalPeople === 1
                          ? 'pessoa confirmada'
                          : 'pessoas confirmadas'}{' '}
                        até o momento
                      </span>
                    </div>
                  )}
                </motion.div>

                {/* Hero Interactive Venue Frame */}
                <motion.div
                  initial={shouldReduceMotion ? false : {opacity: 0, scale: 0.97}}
                  animate={{opacity: 1, scale: 1}}
                  transition={{duration: 0.65, delay: 0.1, ease: [0.16, 1, 0.3, 1]}}
                  className="lg:col-span-6 flex flex-col"
                >
                  <div className="relative flex-1 min-h-[340px] sm:min-h-[400px] overflow-hidden rounded-2xl border border-[#C8DAF5] bg-[#141E46] shadow-[0_24px_56px_-24px_rgba(20,30,70,0.45)]">
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={currentSlide.id}
                        src={currentSlide.src}
                        alt={currentSlide.alt}
                        referrerPolicy="no-referrer"
                        onError={() => markImageFailed(currentSlide.id)}
                        initial={shouldReduceMotion ? false : {opacity: 0.35, scale: 1.04}}
                        animate={{opacity: 1, scale: 1}}
                        exit={shouldReduceMotion ? undefined : {opacity: 0.35}}
                        transition={{duration: 0.65, ease: [0.16, 1, 0.3, 1]}}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    </AnimatePresence>

                    {failedImages[currentSlide.id] && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#26328A] to-[#2EA5DB] text-white">
                        <CalendarHeart className="h-10 w-10 mb-3" />
                        <p className="font-display text-xl font-bold">
                          Chácara Irmãos Pincinato
                        </p>
                      </div>
                    )}

                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0D1538]/90 via-[#0D1538]/20 to-transparent"
                    />

                    {/* Bottom Interactive Venue Switcher Overlay */}
                    <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-white">
                      <div className="space-y-1">
                        <p className="font-display text-xl font-bold">
                          {currentSlide.title}
                        </p>
                        <p className="text-xs text-[#DCE8FA]">
                          {currentSlide.subtitle}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 shrink-0 self-start sm:self-end">
                        {VENUE_SLIDES.map((slide, idx) => (
                          <button
                            key={slide.id}
                            type="button"
                            onClick={() => setActiveSlide(idx)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                              activeSlide === idx
                                ? 'bg-white text-[#141E46] shadow-sm'
                                : 'text-white/85 hover:text-white'
                            }`}
                          >
                            {idx === 0 ? 'Piscina' : 'Campo'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* 4-column Event Details & Countdown Strip */}
              <motion.div
                initial={shouldReduceMotion ? false : {opacity: 0, y: 14}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1]}}
              >
                <CountdownStrip />
              </motion.div>
            </div>
          </section>

          {/* Section 01: Sobre a Celebração e Regras de Convidados */}
          <section id="evento" className="py-16 sm:py-20">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="max-w-2xl space-y-3">
                  <p className="text-xs font-semibold text-[#B81D62]">
                    01. Política de convidados
                  </p>
                  <h2
                    className="font-display text-3xl sm:text-4xl font-bold text-[#141E46] tracking-tight"
                    style={{textWrap: 'balance'}}
                  >
                    Juntos, celebramos nossas conquistas!
                  </h2>
                </div>
                <p className="max-w-md text-sm text-[#4D5E8C] leading-relaxed">
                  Preparamos tudo com carinho para comemorarmos juntos mais um ano
                  de dedicação, conquistas e parceria. Será um prazer compartilhar
                  esse momento com vocês!
                </p>
              </div>

              <motion.div
                initial={shouldReduceMotion ? false : {opacity: 0, y: 16}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true, amount: 0.2}}
                transition={{duration: 0.5, ease: [0.16, 1, 0.3, 1]}}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <div className="rounded-2xl border border-[#D4E3FA] bg-white p-6 sm:p-8 shadow-sm space-y-3 transition-transform duration-200 hover:-translate-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#26328A]">
                      Funcionários com família
                    </span>
                    <Users className="h-5 w-5 text-[#2EA5DB]" />
                  </div>
                  <h3 className="font-display text-2xl font-bold text-[#141E46]">
                    Cônjuge e Filhos
                  </h3>
                  <p className="text-sm text-[#4D5E8C] leading-relaxed">
                    Cada funcionário poderá levar o(a) cônjuge e seus filhos.
                    Informe o nome completo de cada participante e o grau de
                    parentesco no formulário abaixo.
                  </p>
                </div>

                <div className="rounded-2xl border border-[#D4E3FA] bg-white p-6 sm:p-8 shadow-sm space-y-3 transition-transform duration-200 hover:-translate-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#B81D62]">
                      Funcionários solteiros
                    </span>
                    <Sparkles className="h-5 w-5 text-[#B81D62]" />
                  </div>
                  <h3 className="font-display text-2xl font-bold text-[#141E46]">
                    Direito a 1 Acompanhante
                  </h3>
                  <p className="text-sm text-[#4D5E8C] leading-relaxed">
                    Funcionários solteiros terão direito a levar 1 acompanhante,
                    informando o nome completo e o grau de parentesco ou vínculo.
                  </p>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Section 02: Localização & Botão Direto para Mapa */}
          <section
            id="localizacao"
            className="border-y border-[#DCE8FA] bg-white py-16 sm:py-20"
          >
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <motion.div
                initial={shouldReduceMotion ? false : {opacity: 0, y: 16}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true, amount: 0.2}}
                transition={{duration: 0.5, ease: [0.16, 1, 0.3, 1]}}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-2xl border border-[#D4E3FA] bg-[#F7FAFF] p-6 sm:p-10 shadow-sm"
              >
                <div className="lg:col-span-7 space-y-5">
                  <p className="text-xs font-semibold text-[#2EA5DB]">
                    02. Localização e trajeto
                  </p>
                  <h2
                    className="font-display text-3xl sm:text-4xl font-bold text-[#141E46] tracking-tight"
                    style={{textWrap: 'balance'}}
                  >
                    {EVENT_INFO.venueName}
                  </h2>
                  <div className="space-y-1 text-base text-[#4D5E8C]">
                    <p className="font-medium text-[#141E46]">
                      {EVENT_INFO.addressLine1}
                    </p>
                    <p>{EVENT_INFO.addressLine2}</p>
                  </div>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleCopyAddress}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#C8DAF5] bg-white px-4 py-2.5 text-sm font-medium text-[#26328A] hover:bg-[#EEF6FF] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {addressCopied ? (
                        <>
                          <Check className="h-4 w-4 text-[#7BB62D]" />
                          <span>Endereço copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          <span>Copiar endereço</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Single Primary Map CTA Card */}
                <div className="lg:col-span-5">
                  <div className="rounded-2xl bg-gradient-to-br from-[#172566] to-[#26328A] p-6 sm:p-8 text-white space-y-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 border border-white/20 text-[#7ED3FA]">
                      <MapPin className="h-6 w-6" />
                    </div>

                    <div className="space-y-1.5">
                      <p className="font-display text-lg font-bold">
                        Traçar rota pelo celular ou GPS
                      </p>
                      <p className="text-sm text-[#DCE8FA] leading-relaxed">
                        Abra a localização exata diretamente no Google Maps para
                        iniciar a navegação até a chácara.
                      </p>
                    </div>

                    <a
                      href={EVENT_INFO.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#141E46] hover:bg-[#EEF6FF] transition-colors"
                    >
                      <Navigation className="h-4 w-4 text-[#26328A]" />
                      <span>Abrir Rota no Google Maps</span>
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Section 03: Confirmação de Presença (RSVP) */}
          <section id="confirmar" className="py-16 sm:py-20">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 space-y-8">
              <div className="max-w-2xl space-y-3">
                <p className="text-xs font-semibold text-[#B81D62]">
                  03. Confirmação de presença
                </p>
                <h2
                  className="font-display text-3xl sm:text-4xl font-bold text-[#141E46] tracking-tight"
                  style={{textWrap: 'balance'}}
                >
                  Confirme sua presença até 10 de dezembro
                </h2>
                <p className="text-base text-[#4D5E8C]">
                  Preencha seus dados e adicione os acompanhantes informando o
                  grau de parentesco.
                </p>
              </div>

              <RsvpForm
                onSuccess={() => {
                  setConfettiKey((k) => k + 1);
                  fetchStats();
                }}
              />
            </div>
          </section>
        </main>
      )}

      {/* Quiet Footer */}
      <footer className="border-t border-[#DCE8FA] bg-white py-10">
        <div className="mx-auto flex max-w-6xl flex-col sm:flex-row items-center justify-between gap-6 px-4 sm:px-6">
          <div className="flex items-center gap-3.5">
            <img
              src={EVENT_INFO.logoUrl}
              alt="Escola Infantil Caleidoscópio"
              referrerPolicy="no-referrer"
              className="h-12 w-12 object-contain"
            />
            <div>
              <p className="font-display text-sm font-bold text-[#26328A]">
                Escola Infantil Caleidoscópio
              </p>
              <p className="text-xs text-[#5B6B95]">
                Juntos, celebramos nossas conquistas!
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-xs font-medium text-[#4D5E8C]">
            <button
              type="button"
              onClick={() => navigateToSection('confirmar')}
              className="hover:text-[#26328A] cursor-pointer"
            >
              Confirmar Presença
            </button>
            <a
              href={EVENT_INFO.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#26328A]"
            >
              Google Maps
            </a>
            <button
              type="button"
              onClick={openAdmin}
              className="inline-flex items-center gap-1 text-[#26328A] hover:text-[#B81D62] cursor-pointer"
            >
              <Lock className="h-3 w-3" />
              <span>Acesso Administrativo</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
