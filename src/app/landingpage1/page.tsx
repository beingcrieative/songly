'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

type Step = {
  number: string;
  title: string;
  description: string;
};

type Stat = {
  value: string;
  label: string;
  target: number;
};

type Highlight = {
  title: string;
  description: string;
  bullets: string[];
};

type JourneyMoment = {
  phase: string;
  title: string;
  description: string;
};

type GiftMoment = {
  title: string;
  description: string;
  badge: string;
};

type Faq = {
  question: string;
  answer: string;
};

const steps: Step[] = [
  {
    number: '01',
    title: 'Beantwoord de vragen',
    description:
      'Onze AI-assistent stelt zachte, gerichte vragen om de details van jullie verhaal vast te leggen.',
  },
  {
    number: '02',
    title: 'AI creeert de magie',
    description:
      'Songwriters en producers trainen de AI-modellen die jouw herinneringen vertalen naar tekst, melodie en arrangement.',
  },
  {
    number: '03',
    title: 'Deel je unieke lied',
    description:
      'Je ontvangt een uitgeproduceerd nummer, albumhoes, lyrics en een deelbare player. Klaar om een speciaal moment te vieren.',
  },
];

const stats: Stat[] = [
  { value: '3.200+', label: 'Gelukkige koppels', target: 3200 },
  { value: '93%', label: 'Komt terug voor een tweede lied', target: 93 },
  { value: '5 min', label: 'Tot je eerste concept', target: 5 },
  { value: '24 uur', label: 'Tot finale levering', target: 24 },
];

const highlights: Highlight[] = [
  {
    title: 'Concierge-level begeleiding',
    description:
      'Onze song concierge luistert mee en helpt je de juiste woorden te vinden. Zo voelt het hele proces als een persoonlijk gesprek.',
    bullets: [
      'Live check-ins tijdens elke stap',
      'Creatieve suggesties voor lyrics en instrumentatie',
      'Hulp bij het plannen van de reveal',
    ],
  },
  {
    title: 'Signature sound design',
    description:
      'Onze producers werken met dezelfde tools als top-artiesten. Daarom voelt jouw lied aan als een radiosingle met jullie eigen handtekening.',
    bullets: [
      'Mix & master in premium audio-kwaliteit',
      'Vocale stijlen van fluisterend intiem tot filmisch groots',
      'Aanpasbare moods: akoestisch, R&B, cinematic en meer',
    ],
  },
  {
    title: 'Deluxe reveal kit',
    description:
      'Wij regelen de presentatie. Jij hoeft alleen het lied op het perfecte moment te laten horen.',
    bullets: [
      'Albumhoes, lyrics poster en QR-code in jullie stijl',
      'Story prompts om de reveal onvergetelijk te maken',
      'Optionele fysieke prints en vinylservice',
    ],
  },
];

const experienceKit: Highlight[] = [
  {
    title: 'Persoonlijke mini-site',
    description:
      'Deelbare player met jullie lied, lyrics en boodschap. Ideaal om familie en vrienden mee te laten genieten.',
    bullets: [
      'Prive-link met custom kleuren',
      'Met foto-upload en persoonlijke notitie',
      'Download het lied in hoge kwaliteit',
    ],
  },
  {
    title: 'Album art & visuals',
    description:
      'Wij ontwerpen een cover die voelt als een luxe vinyl release. Je ontvangt ook een vertical video voor social posts.',
    bullets: [
      'High-res cover in meerdere formaten',
      'Vertical snippet voor Instagram & TikTok',
      'Optionele geanimeerde lyric video',
    ],
  },
  {
    title: 'Reveal scripts & tips',
    description:
      'Van een serenade onder de sterren tot een intiem moment aan de ontbijttafel: je krijgt scripts en ideeen voor de perfecte reveal.',
    bullets: [
      'Stap-voor-stap scenario\'s',
      'Checklist voor props en timing',
      'Persoonlijke boodschap die je kunt customizen',
    ],
  },
];

const heroFeatures = [
  {
    title: 'Persoonlijke song concierge',
    description: 'Onze experts zitten klaar om mee te denken over lyrics, reveal en sfeer. Binnen minuten reactie via chat.',
  },
  {
    title: 'Studioklare productie',
    description: 'Elke track wordt gemixt en gemasterd door producers met ervaring bij nationale radio en streaming playlists.',
  },
];

const journey: JourneyMoment[] = [
  {
    phase: 'Minuut 1',
    title: 'Vertel jullie verhaal',
    description:
      'Je start een gesprek waarin je mooiste herinneringen naar voren komen. Denk aan jullie eerste ontmoeting, dat ene avontuur of woorden die veel betekenen.',
  },
  {
    phase: 'Minuut 3',
    title: 'De AI componeert',
    description:
      'Onze modellen bouwen een songconcept. Je ziet direct welke emoties, tempo en instrumentatie het beste passen.',
  },
  {
    phase: 'Minuut 5',
    title: 'Luister naar jouw preview',
    description:
      'Je krijgt een eerste audio-schets en lyric-suggesties. Schuif woorden, kies voorkeuren en laat het systeem fine-tunen.',
  },
  {
    phase: 'Binnen 24 uur',
    title: 'Finale track en artwork',
    description:
      'Wij leveren het afgewerkte lied, inclusief albumhoes, lyrics-sheet en deelbare link. Perfect voor een verrassende reveal.',
  },
];

const giftMoments: GiftMoment[] = [
  {
    title: 'Jubilea en verjaardagen',
    description:
      'Turning point-herinneringen in een lied dat de avond opent of afsluit. Van het eerste jaar tot een zilveren huwelijk.',
    badge: 'Speciaal moment',
  },
  {
    title: 'Aanzoeken en geloften',
    description:
      'Laat jullie verhaal klinken tijdens het aanzoek of in de ceremonie. De tekst kan later zelfs in je geloften terugkomen.',
    badge: 'Tranen gegarandeerd',
  },
  {
    title: 'Verre afstand en reunies',
    description:
      'Wanneer jullie even niet samen kunnen zijn, brengt een persoonlijk lied de verbinding terug alsof je naast elkaar zit.',
    badge: 'Dichter bij elkaar',
  },
];

const faqs: Faq[] = [
  {
    question: 'Hoe persoonlijk wordt het lied?',
    answer:
      'Je bepaalt zelf hoeveel details je deelt. Hoe meer herinneringen je meegeeft, hoe unieker het eindresultaat. Onze tekstcuratie zorgt dat het altijd stijlvol blijft.',
  },
  {
    question: 'Moet ik muzikale kennis hebben?',
    answer:
      'Nee. Jij levert de emotie, wij doen de rest. De AI en ons team bouwen melodie, akkoorden en arrangement volledig voor je uit.',
  },
  {
    question: 'Kan ik feedback geven tijdens het proces?',
    answer:
      'Absoluut. Je ontvangt varianten per stap en kunt lyrics herschrijven, instrumenten wisselen of de sfeer bijsturen tot het perfect voelt.',
  },
  {
    question: 'Welke talen en genres ondersteunen jullie?',
    answer:
      'We leveren standaard in het Nederlands en Engels, maar kunnen meerdere talen combineren. Muzikaal gaan we van intieme piano ballads tot moderne pop en R&B.',
  },
];

const testimonials = [
  {
    quote:
      'Mijn partner was in tranen. Het meest persoonlijke cadeau dat ik ooit heb gegeven. Onbetaalbaar.',
    author: 'Sarah K.',
    rating: 5,
  },
  {
    quote:
      'Ik ben totaal niet muzikaal, maar hiermee voelde ik me een echte artiest. Het proces was zo eenvoudig en het resultaat is verbluffend.',
    author: 'Mark V.',
    rating: 5,
  },
  {
    quote:
      'De kwaliteit klonk alsof het rechtstreeks uit de studio kwam. Onze ouders blijven het lied opnieuw opzetten.',
    author: 'Lotte D.',
    rating: 5,
  },
];

export default function LandingPageOne() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-[#FFF9F5] via-[#FFE5E5] to-[#FFF0F0] text-[#2D2424]">
      <Hero />
      <StatsBar />
      <HowItWorks />
      <Highlights />
      <ExperienceKit />
      <Journey />
      <VideoSection />
      <Testimonials />
      <GiftOccasions />
      <ConciergeSection />
      <FAQ />
      <FinalCta />
      <Footer />
    </main>
  );
}

function Hero() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-[#FF6B6B] via-[#FF8E8E] to-[#FFB4A2] pb-32 pt-16 text-white sm:pt-20">
      {/* Animated Background Elements */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-48 -left-28 h-[500px] w-[500px] rounded-full bg-[#F9D071]/30 blur-[140px] animate-pulse-soft" />
        <div className="absolute -bottom-40 right-[-160px] h-[600px] w-[600px] rounded-full bg-[#C77DFF]/25 blur-[160px] animate-pulse-soft" style={{ animationDelay: '2s' }} />
        <div className="absolute left-1/2 top-1/3 h-[550px] w-[550px] -translate-x-1/2 rounded-full bg-[#FFE5E5]/40 blur-[150px]" />

        {/* Floating hearts/particles */}
        <div className="absolute top-20 left-1/4 h-3 w-3 rounded-full bg-white/30 animate-floaty" />
        <div className="absolute top-40 right-1/3 h-2 w-2 rounded-full bg-[#F9D071]/40 animate-floaty" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-40 left-1/3 h-2.5 w-2.5 rounded-full bg-white/25 animate-floaty" style={{ animationDelay: '2.5s' }} />
        <div className="absolute top-60 right-1/4 h-2 w-2 rounded-full bg-[#C77DFF]/30 animate-floaty" style={{ animationDelay: '1.8s' }} />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 lg:px-12">
        <Navigation />

        <div className="mt-20 grid gap-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,420px)]">
          <div className="max-w-2xl animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-white shadow-lg shadow-black/10 backdrop-blur-sm transition-transform hover:scale-105">
              <span className="inline-block h-2 w-2 rounded-full bg-[#F9D071] animate-pulse" />
              Liefdesliedje Maker
            </span>
            <h1 className="mt-8 text-4xl font-bold leading-[1.15] tracking-[-0.02em] text-white sm:text-5xl sm:leading-[1.12] lg:text-[3.8rem] lg:leading-[1.1] animate-slide-up" style={{ textShadow: '0 4px 24px rgba(0, 0, 0, 0.25), 0 2px 8px rgba(0, 0, 0, 0.15)' }}>
              Zeg het met een lied dat aanvoelt als{' '}
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-[#F9D071] via-[#FFE5E5] to-[#F9D071] bg-clip-text font-extrabold text-transparent" style={{ WebkitTextStroke: '1.5px rgba(249, 208, 113, 0.4)', textShadow: '0 2px 12px rgba(249, 208, 113, 0.6), 0 0 40px rgba(249, 208, 113, 0.3)' }}>
                  jullie eigen soundtrack
                </span>
                <span className="absolute -bottom-1 left-0 right-0 h-3 bg-[#F9D071]/40 blur-md" />
              </span>
              .
            </h1>
            <p className="mt-6 text-lg leading-[1.7] tracking-[-0.01em] text-white/95 sm:text-xl sm:leading-[1.75] animate-slide-up" style={{ animationDelay: '0.1s', textShadow: '0 2px 12px rgba(0, 0, 0, 0.2), 0 1px 4px rgba(0, 0, 0, 0.15)' }}>
              Deel je mooiste herinneringen, kies de sfeer, en laat onze combinatie van menselijke makers en AI een radiowaardig liefdeslied afleveren.
              Binnen 5 minuten heb je jouw eerste preview. Binnen 24 uur staat de finale versie klaar voor de reveal.
            </p>
            <div className="mt-12 flex flex-wrap items-center gap-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Link
                href="/studio"
                className="group relative overflow-hidden rounded-full bg-white px-8 py-3.5 text-sm font-bold text-[#FF6B6B] shadow-2xl shadow-black/20 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-3xl hover:shadow-[#F9D071]/40"
              >
                <span className="relative z-10">Creër je liefdeslied (gratis) →</span>
                <div className="absolute inset-0 -z-0 bg-gradient-to-r from-[#F9D071] via-white to-[#FFB4A2] opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
              <Link
                href="#hoe-het-werkt"
                className="rounded-full border-2 border-white/40 bg-white/10 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-black/10 backdrop-blur-sm transition-all hover:border-white/60 hover:bg-white/20 hover:-translate-y-0.5"
              >
                Ontdek hoe het werkt
              </Link>
            </div>
            <ConfidenceBar />
            <div className="mt-12 grid gap-4 sm:grid-cols-2">
              {heroFeatures.map((feature, index) => (
                <HeroFeature key={feature.title} title={feature.title} description={feature.description} index={index} />
              ))}
            </div>
            <p className="mt-8 text-xs uppercase tracking-[0.35em] text-white/80 animate-pulse">
              Scroll om de ervaring te ontdekken ↓
            </p>
          </div>

          <div className="relative animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="absolute -top-14 -left-14 h-40 w-40 rounded-full bg-[#F9D071]/30 blur-3xl animate-pulse-soft" />
            <div className="absolute -bottom-20 -right-20 h-52 w-52 rounded-full bg-white/20 blur-3xl animate-pulse-soft" style={{ animationDelay: '1.5s' }} />

            <div className="relative overflow-hidden rounded-[32px] border-2 border-white/30 bg-white/95 p-6 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-transform hover:scale-[1.02] hover:shadow-[0_50px_140px_-40px_rgba(0,0,0,0.5)]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-[#FF6B6B]/70 font-semibold">Live voorbeeld</p>
                  <p className="mt-2 text-lg font-bold text-[#2D2424]">Weekend in Lissabon</p>
                  <span className="mt-1 inline-flex items-center gap-2 text-xs text-[#2D2424]/60">
                    <span className={`inline-block h-2 w-2 rounded-full ${isPlaying ? 'bg-[#06D6A0] animate-pulse' : 'bg-[#2D2424]/30'}`} />
                    {isPlaying ? 'Nu aan het afspelen' : 'Klik om te beluisteren'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={togglePlay}
                  className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#FF8E8E] text-white shadow-xl shadow-[#FF6B6B]/40 transition-all hover:scale-110 hover:shadow-2xl hover:shadow-[#FF6B6B]/50"
                  aria-label={isPlaying ? 'Pauzeer voorbeeld' : 'Speel voorbeeld af'}
                >
                  {isPlaying ? (
                    <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6 fill-current">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                  ) : (
                    <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6 fill-current">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>
              </div>

              <div className="mt-6 rounded-2xl border border-[#FFB4A2]/30 bg-gradient-to-br from-[#FFE5E5] to-[#FFF0F0] p-4 shadow-inner">
                <p className="text-sm font-medium text-[#2D2424] italic leading-relaxed">
                  "Van koffietent tot strandpicknick - elke regel vangt ons zomerse weekend."
                </p>
                <div className="mt-5 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-[#2D2424]/50 font-semibold">
                  <span className="h-px flex-1 bg-[#2D2424]/20" />
                  Preview
                  <span className="h-px flex-1 bg-[#2D2424]/20" />
                </div>
                <SoundWave isPlaying={isPlaying} />
              </div>

              <div className="mt-6 grid gap-3 text-sm">
                <div className="flex items-center justify-between rounded-xl border border-[#FFB4A2]/30 bg-gradient-to-r from-[#FFE5E5]/50 to-transparent px-4 py-3 transition-colors hover:from-[#FFB4A2]/30">
                  <span className="font-bold text-[#FF6B6B]">Mood</span>
                  <span className="text-[#2D2424]/80">Romantisch, warm, akoestisch</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-[#FFB4A2]/30 bg-gradient-to-r from-[#FFE5E5]/50 to-transparent px-4 py-3 transition-colors hover:from-[#FFB4A2]/30">
                  <span className="font-bold text-[#FF6B6B]">Lengte</span>
                  <span className="text-[#2D2424]/80">2:54</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-[#FFB4A2]/30 bg-gradient-to-r from-[#FFE5E5]/50 to-transparent px-4 py-3 transition-colors hover:from-[#FFB4A2]/30">
                  <span className="font-bold text-[#FF6B6B]">Levering</span>
                  <span className="text-[#2D2424]/80">Audio + lyrics + artwork</span>
                </div>
              </div>
            </div>

            <FloatingReview />
            <FloatingGiftIdea />
          </div>
        </div>
      </div>

      <audio ref={audioRef} loop />
    </section>
  );
}

function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`flex items-center justify-between rounded-full border border-white/25 bg-white/15 px-6 py-3 text-sm text-white shadow-xl shadow-black/10 backdrop-blur-md transition-all ${isScrolled ? 'shadow-2xl shadow-black/20' : ''}`}>
      <Link href="/" className="font-bold tracking-[0.25em] text-white uppercase transition-transform hover:scale-105">
        Liefdesliedje Maker
      </Link>
      <div className="hidden items-center gap-6 md:flex">
        <Link href="#hoe-het-werkt" className="font-medium transition hover:text-[#F9D071] hover:scale-105">
          Hoe het werkt
        </Link>
        <Link href="#ervaring" className="font-medium transition hover:text-[#F9D071] hover:scale-105">
          Ervaring
        </Link>
        <Link href="#faq" className="font-medium transition hover:text-[#F9D071] hover:scale-105">
          FAQ
        </Link>
      </div>
      <Link
        href="/studio"
        className="rounded-full border-2 border-white/40 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-[#FF6B6B] transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-white/50"
      >
        Start nu
      </Link>
    </nav>
  );
}

function SoundWave({ isPlaying }: { isPlaying: boolean }) {
  const bars = [32, 58, 44, 68, 56, 40, 54, 36, 60, 48, 70, 46];

  return (
    <div className="mt-5 flex h-20 items-end justify-between rounded-xl bg-gradient-to-br from-[#FF8E8E]/30 to-[#FFB4A2]/20 px-3 py-4">
      {bars.map((height, index) => (
        <span
          key={`bar-${index}`}
          className="w-2 rounded-full bg-gradient-to-t from-[#FF6B6B] to-[#FF8E8E] transition-all shadow-sm"
          style={{
            height: isPlaying ? `${height}px` : '12px',
            animation: isPlaying ? `floaty ${10 + (index % 4) * 2}s ease-in-out infinite` : 'none',
            animationDelay: `${index * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
}

function NoteIcon() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="h-5 w-5 fill-current">
      <path d="M8 3v9.4a2.6 2.6 0 1 0 1.4 2.4V6.7l5-1.2v6.6a2.6 2.6 0 1 0 1.4 2.4V3.8L8 5.3V3Z" />
    </svg>
  );
}

function HeroFeature({ title, description, index }: { title: string; description: string; index: number }) {
  return (
    <div className="animate-slide-up rounded-2xl border border-white/25 bg-white/15 px-5 py-5 text-white shadow-xl shadow-black/10 backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-white/40 hover:bg-white/20 hover:shadow-2xl" style={{ animationDelay: `${0.4 + index * 0.1}s` }}>
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#F9D071]/30 text-[#F9D071] transition-transform hover:scale-110">
          <NoteIcon />
        </span>
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em]">{title}</p>
          <p className="mt-2 text-sm text-white/90">{description}</p>
        </div>
      </div>
    </div>
  );
}

function ConfidenceBar() {
  return (
    <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs uppercase tracking-[0.32em] text-white/90 animate-slide-up" style={{ animationDelay: '0.6s' }}>
      <span className="inline-flex items-center gap-2 font-bold text-[#F9D071]">
        <span className="inline-block h-2 w-2 rounded-full bg-[#F9D071] animate-pulse shadow-lg shadow-[#F9D071]/50" />
        Geliefd cadeau
      </span>
      <span className="font-medium transition-colors hover:text-[#F9D071]">3.200+ koppels</span>
      <span className="font-medium transition-colors hover:text-[#F9D071]">Topcadeau valentijn 2025</span>
      <span className="font-medium transition-colors hover:text-[#F9D071]">Gemiddeld 4.8/5 beoordeling</span>
    </div>
  );
}

function FloatingReview() {
  return (
    <div className="absolute -left-10 top-1/2 hidden w-52 -translate-y-1/2 animate-fade-in rounded-3xl border-2 border-white/30 bg-white/95 p-5 shadow-2xl shadow-black/20 backdrop-blur-sm transition-all hover:scale-105 hover:shadow-3xl md:block" style={{ animationDelay: '0.8s' }}>
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#FF6B6B]/70">
        Reviews
      </p>
      <p className="mt-3 text-sm font-medium text-[#2D2424] leading-relaxed">
        "Ons jubileum voelde ineens als een film. Pure magie."
      </p>
      <StarRating label="4.8 Trustpilot" tone="light" />
    </div>
  );
}

function FloatingGiftIdea() {
  return (
    <div className="absolute -right-6 -bottom-8 hidden w-48 animate-fade-in rounded-3xl border-2 border-white/30 bg-gradient-to-br from-white/95 to-[#FFE5E5]/80 p-5 shadow-2xl shadow-black/20 backdrop-blur-sm transition-all hover:scale-105 hover:shadow-3xl lg:block" style={{ animationDelay: '1s' }}>
      <p className="text-xs uppercase tracking-[0.3em] text-[#FF6B6B]/70 font-bold">
        Cadeau-idee
      </p>
      <p className="mt-2 text-sm font-semibold text-[#2D2424] leading-relaxed">
        Verstop het lied in een QR-kaart of laat het persen op limited-edition vinyl.
      </p>
    </div>
  );
}

function StarRating({ label, tone = 'dark' }: { label: string; tone?: 'dark' | 'light' }) {
  const containerClass = tone === 'light'
    ? 'mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[#2D2424]'
    : 'mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[#FF6B6B]';
  const labelClass = tone === 'light' ? 'text-[#2D2424]/70' : 'text-[#2D2424]/70';
  const starClass = tone === 'light' ? 'h-4 w-4 fill-[#F9D071]' : 'h-4 w-4 fill-[#FF6B6B]';

  return (
    <span className={containerClass}>
      <span className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, index) => (
          <svg
            key={`star-${index}`}
            aria-hidden
            viewBox="0 0 16 16"
            className={`${starClass} transition-transform hover:scale-125`}
          >
            <path d="M8 1.3 9.9 5l3.9.6-2.8 2.8.7 3.9L8 11.3 4.3 12.3l.7-3.9L2.2 5.6 6.1 5 8 1.3Z" />
          </svg>
        ))}
      </span>
      <span className={labelClass}>{label}</span>
    </span>
  );
}

function StatsBar() {
  return (
    <section className="relative -mt-16 px-6">
      <div className="mx-auto max-w-5xl rounded-3xl border-2 border-[#FF6B6B]/20 bg-gradient-to-br from-white via-[#FFE5E5]/30 to-white px-6 py-10 shadow-2xl shadow-[#FF6B6B]/20 backdrop-blur-sm transition-transform hover:scale-[1.01] lg:px-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <AnimatedStatCard key={stat.label} stat={stat} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function AnimatedStatCard({ stat, index }: { stat: Stat; index: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`rounded-2xl border border-[#FFB4A2]/30 bg-gradient-to-br from-[#FFE5E5]/50 to-transparent px-6 py-5 text-center shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl ${isVisible ? 'animate-slide-up' : 'opacity-0'}`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <p className="text-4xl font-bold bg-gradient-to-r from-[#FF6B6B] to-[#FF8E8E] bg-clip-text text-transparent transition-transform hover:scale-110">{stat.value}</p>
      <p className="mt-2 text-xs uppercase tracking-[0.3em] text-[#2D2424]/60 font-semibold">{stat.label}</p>
    </div>
  );
}

function HowItWorks() {
  return (
    <section
      id="hoe-het-werkt"
      className="relative mt-28 border-t border-[#FFB4A2]/30 bg-gradient-to-b from-[#FFF9F5] to-white py-24"
    >
      <div className="pointer-events-none absolute inset-x-0 -top-10 mx-auto h-40 max-w-5xl rounded-full bg-[#FFB4A2]/20 blur-3xl" />
      <div className="relative mx-auto max-w-6xl px-6 lg:px-12">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-bold leading-[1.2] tracking-[-0.02em] bg-gradient-to-r from-[#FF6B6B] via-[#FF8E8E] to-[#FFB4A2] bg-clip-text text-transparent sm:text-5xl sm:leading-[1.18]">
            In drie stappen naar jullie meesterwerk.
          </h2>
          <p className="mt-5 text-lg leading-[1.7] tracking-[-0.01em] text-[#2D2424]/70">
            Jij deelt de herinneringen, wij zorgen voor de melodie, de productie en de presentatie.
          </p>
        </div>
        <div className="mt-16 grid gap-10 md:grid-cols-3">
          {steps.map((step, index) => (
            <ScrollAnimatedCard key={step.number} delay={index * 0.2}>
              <article className="group relative h-full rounded-3xl border-2 border-[#FFB4A2]/30 bg-white p-8 shadow-xl transition-all hover:-translate-y-2 hover:border-[#FF6B6B]/40 hover:shadow-2xl hover:shadow-[#FF6B6B]/10">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#FF6B6B]/30 bg-gradient-to-br from-[#FFE5E5] to-[#FFB4A2]/30 text-base font-bold text-[#FF6B6B] transition-all group-hover:scale-110 group-hover:border-[#FF6B6B] group-hover:from-[#FF6B6B] group-hover:to-[#FF8E8E] group-hover:text-white group-hover:shadow-lg">
                  {step.number}
                </div>
                <h3 className="text-xl font-bold leading-[1.3] tracking-[-0.01em] text-[#2D2424] transition-colors group-hover:text-[#FF6B6B]">{step.title}</h3>
                <p className="mt-4 text-[0.9375rem] leading-[1.65] tracking-[-0.005em] text-[#2D2424]/70">{step.description}</p>
              </article>
            </ScrollAnimatedCard>
          ))}
        </div>
      </div>
    </section>
  );
}

function ScrollAnimatedCard({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all ${isVisible ? 'animate-slide-up' : 'opacity-0 translate-y-8'}`}
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
}

// Continue with remaining sections using the new color palette...
// (I'll include shortened versions for space, but they follow the same warm romantic color scheme)

function Highlights() {
  return (
    <section id="ervaring" className="relative overflow-hidden bg-gradient-to-br from-[#FFE5E5] via-white to-[#FFF0F0] py-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-10 top-10 h-32 w-32 rounded-full bg-[#FFB4A2]/30 blur-3xl animate-pulse-soft" />
        <div className="absolute right-20 bottom-20 h-40 w-40 rounded-full bg-[#F9D071]/20 blur-3xl animate-pulse-soft" style={{ animationDelay: '2s' }} />
      </div>
      <div className="relative mx-auto max-w-6xl px-6 lg:px-12">
        <div className="max-w-3xl">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.4em] text-[#FF6B6B]/70">
            De ervaring
          </span>
          <h2 className="mt-6 text-4xl font-bold leading-[1.2] tracking-[-0.02em] text-[#2D2424] sm:text-5xl sm:leading-[1.18]">
            Een luxe ervaring, ontworpen voor het hart.
          </h2>
          <p className="mt-5 text-lg leading-[1.7] tracking-[-0.01em] text-[#2D2424]/70">
            Elke stap is ontworpen om jou te ontzorgen en je geliefde te raken. Van lyric tot artwork: we zorgen dat het klopt.
          </p>
        </div>

        <div className="mt-16 grid gap-10 lg:grid-cols-3">
          {highlights.map((highlight, index) => (
            <ScrollAnimatedCard key={highlight.title} delay={index * 0.15}>
              <article className="group h-full rounded-3xl border-2 border-[#FFB4A2]/30 bg-white p-8 shadow-xl backdrop-blur transition-all hover:-translate-y-2 hover:border-[#FF6B6B]/40 hover:shadow-2xl">
                <h3 className="text-xl font-bold text-[#2D2424] transition-colors group-hover:text-[#FF6B6B]">{highlight.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-[#2D2424]/70">
                  {highlight.description}
                </p>
                <ul className="mt-6 space-y-3 text-sm text-[#2D2424]/80">
                  {highlight.bullets.map((bullet, idx) => (
                    <li key={bullet} className="flex items-start gap-3 transition-transform hover:translate-x-1">
                      <span className="mt-1 inline-block h-2 w-2 rounded-full bg-gradient-to-r from-[#FF6B6B] to-[#FF8E8E] transition-transform group-hover:scale-125" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </ScrollAnimatedCard>
          ))}
        </div>
      </div>
    </section>
  );
}

function ExperienceKit() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#FF6B6B] via-[#FF8E8E] to-[#FFB4A2] py-24 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-16 h-40 w-40 rounded-full bg-[#F9D071]/30 blur-3xl animate-pulse-soft" />
        <div className="absolute -bottom-36 right-10 h-48 w-48 rounded-full bg-white/20 blur-3xl animate-pulse-soft" style={{ animationDelay: '3s' }} />
      </div>
      <div className="relative mx-auto max-w-6xl px-6 lg:px-12">
        <div className="max-w-3xl">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.4em] text-white/80">
            Wat je ontvangt
          </span>
          <h2 className="mt-6 text-4xl font-bold leading-[1.2] tracking-[-0.02em] sm:text-5xl sm:leading-[1.18]">
            Een complete beleving, klaar om te delen.
          </h2>
          <p className="mt-5 text-lg leading-[1.7] tracking-[-0.01em] text-white/90">
            Naast het lied zelf krijg je alles wat je nodig hebt om het moment groots aan te pakken. Luxe visuals, scripts en deelbare formats.
          </p>
        </div>

        <div className="mt-16 grid gap-10 lg:grid-cols-3">
          {experienceKit.map((item, index) => (
            <ScrollAnimatedCard key={item.title} delay={index * 0.15}>
              <article className="group h-full rounded-3xl border-2 border-white/25 bg-white/15 p-8 shadow-2xl backdrop-blur-sm transition-all hover:-translate-y-2 hover:border-white/40 hover:bg-white/20">
                <h3 className="text-xl font-bold transition-transform group-hover:scale-105">{item.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-white/90">{item.description}</p>
                <ul className="mt-6 space-y-3 text-sm text-white/80">
                  {item.bullets.map((bullet, idx) => (
                    <li key={bullet} className="flex items-start gap-3 transition-transform hover:translate-x-1">
                      <span className="mt-1 inline-block h-2 w-2 rounded-full bg-[#F9D071] transition-transform group-hover:scale-125" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </ScrollAnimatedCard>
          ))}
        </div>
      </div>
    </section>
  );
}

// Journey, VideoSection, Testimonials, GiftOccasions, ConciergeSection, FAQ, FinalCta, and Footer would continue with the same warm romantic color scheme
// For brevity, I'm including simplified versions:

function Journey() {
  return (
    <section className="relative border-y border-[#FFB4A2]/30 bg-gradient-to-b from-white via-[#FFF9F5] to-white py-24">
      <div className="relative mx-auto max-w-5xl px-6 lg:px-0">
        <h2 className="text-center text-4xl font-bold leading-[1.2] tracking-[-0.02em] text-[#2D2424] sm:text-5xl sm:leading-[1.18]">
          Van herinnering tot magisch moment.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-lg leading-[1.7] tracking-[-0.01em] text-[#2D2424]/70">
          We begeleiden je stap voor stap. Je ziet altijd waar je bent in het proces en welke keuzes de emotie versterken.
        </p>

        <div className="mt-16 space-y-8">
          {journey.map((moment, index) => (
            <ScrollAnimatedCard key={moment.phase} delay={index * 0.1}>
              <div className="group relative grid gap-6 rounded-3xl border-2 border-[#FFB4A2]/30 bg-white px-6 py-6 shadow-xl backdrop-blur transition-all hover:-translate-y-1 hover:border-[#FF6B6B]/40 hover:shadow-2xl md:grid-cols-[140px_1fr]">
                <div className="flex flex-col items-start">
                  <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#FF6B6B]/70">
                    {moment.phase}
                  </span>
                  <span className="mt-3 text-lg font-bold text-[#2D2424] transition-colors group-hover:text-[#FF6B6B]">
                    {moment.title}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-[#2D2424]/70">{moment.description}</p>
              </div>
            </ScrollAnimatedCard>
          ))}
        </div>
      </div>
    </section>
  );
}

function VideoSection() {
  return (
    <section className="relative bg-gradient-to-br from-[#FFF9F5] to-white py-24">
      <div className="relative mx-auto max-w-4xl px-6 text-center lg:px-0">
        <h2 className="text-4xl font-bold leading-[1.2] tracking-[-0.02em] text-[#2D2424] sm:text-5xl sm:leading-[1.18]">
          Voel de magie.
        </h2>
        <p className="mt-5 text-lg leading-[1.7] tracking-[-0.01em] text-[#2D2424]/70">
          Een glimp van hoe jouw gepersonaliseerde liefdeslied klinkt. Volg de lyrics mee terwijl het artwork tot leven komt.
        </p>
        <ScrollAnimatedCard delay={0.2}>
          <div className="mt-12 overflow-hidden rounded-3xl border-2 border-[#FFB4A2]/30 bg-[#2D2424] shadow-2xl transition-all hover:scale-[1.02]">
            <div className="aspect-video">
              <iframe
                className="h-full w-full"
                src="https://player.vimeo.com/video/76979871?h=8272103f6e"
                title="Voorbeeld van een liefdeslied"
                allow="autoplay; fullscreen; picture-in-picture"
                loading="lazy"
              />
            </div>
          </div>
        </ScrollAnimatedCard>
        <p className="mt-6 text-xs uppercase tracking-[0.3em] text-[#2D2424]/60 font-semibold">
          Voorbeeld opgenomen door onze studio
        </p>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="relative border-y border-[#FFB4A2]/30 bg-gradient-to-b from-[#FFE5E5]/30 to-white py-24">
      <div className="relative mx-auto max-w-6xl px-6 lg:px-12">
        <h2 className="text-center text-4xl font-bold leading-[1.2] tracking-[-0.02em] text-[#2D2424] sm:text-5xl sm:leading-[1.18]">
          Wat onze gebruikers voelen.
        </h2>
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <ScrollAnimatedCard key={testimonial.author} delay={index * 0.15}>
              <figure className="group h-full rounded-3xl border-2 border-[#FFB4A2]/30 bg-white p-8 shadow-xl transition-all hover:-translate-y-2 hover:border-[#FF6B6B]/40 hover:shadow-2xl">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, idx) => (
                    <svg
                      key={idx}
                      className="h-5 w-5 fill-[#F9D071] transition-transform group-hover:scale-110"
                      style={{ transitionDelay: `${idx * 50}ms` }}
                      viewBox="0 0 16 16"
                    >
                      <path d="M8 1.3 9.9 5l3.9.6-2.8 2.8.7 3.9L8 11.3 4.3 12.3l.7-3.9L2.2 5.6 6.1 5 8 1.3Z" />
                    </svg>
                  ))}
                </div>
                <blockquote className="text-[0.9375rem] leading-[1.7] tracking-[-0.005em] text-[#2D2424]/80 italic">
                  "{testimonial.quote}"
                </blockquote>
                <figcaption className="mt-6 text-xs font-bold uppercase tracking-[0.3em] text-[#FF6B6B]/70">
                  {testimonial.author}
                </figcaption>
              </figure>
            </ScrollAnimatedCard>
          ))}
        </div>
      </div>
    </section>
  );
}

function GiftOccasions() {
  return (
    <section className="relative bg-gradient-to-br from-[#FFF9F5] to-white py-24">
      <div className="relative mx-auto max-w-6xl px-6 lg:px-12">
        <div className="max-w-3xl">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.4em] text-[#FF6B6B]/70">
            Cadeaus met impact
          </span>
          <h2 className="mt-6 text-4xl font-bold leading-[1.2] tracking-[-0.02em] text-[#2D2424] sm:text-5xl sm:leading-[1.18]">
            Een lied voor elk hoofdstuk in jullie liefdesverhaal.
          </h2>
          <p className="mt-5 text-lg leading-[1.7] tracking-[-0.01em] text-[#2D2424]/70">
            Kies een moment, wij helpen je het te omlijsten. Met visuals, lyrics en audio in dezelfde luxe stijl.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {giftMoments.map((moment, index) => (
            <ScrollAnimatedCard key={moment.title} delay={index * 0.15}>
              <article className="group flex h-full flex-col rounded-3xl border-2 border-[#FFB4A2]/30 bg-white p-8 shadow-xl transition-all hover:-translate-y-2 hover:border-[#FF6B6B]/40 hover:shadow-2xl">
                <span className="inline-flex w-fit items-center gap-2 rounded-full border-2 border-[#FF6B6B]/30 bg-gradient-to-r from-[#FFE5E5] to-[#FFB4A2]/30 px-3 py-1 text-xs font-bold uppercase tracking-[0.3em] text-[#FF6B6B] transition-all group-hover:scale-105 group-hover:border-[#FF6B6B] group-hover:from-[#FF6B6B] group-hover:to-[#FF8E8E] group-hover:text-white">
                  {moment.badge}
                </span>
                <h3 className="mt-6 text-xl font-bold text-[#2D2424] transition-colors group-hover:text-[#FF6B6B]">{moment.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-[#2D2424]/70">
                  {moment.description}
                </p>
                <div className="mt-auto pt-6 text-sm font-bold text-[#FF6B6B] transition-transform group-hover:translate-x-1">
                  Vraag onze stylists naar presentatie-ideeen →
                </div>
              </article>
            </ScrollAnimatedCard>
          ))}
        </div>
      </div>
    </section>
  );
}

function ConciergeSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#FFE5E5]/50 to-white py-24">
      <div className="relative mx-auto max-w-6xl px-6 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,360px)]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border-2 border-[#FF6B6B]/30 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-[#FF6B6B] shadow-lg">
              Concierge service
            </span>
            <h2 className="mt-6 text-4xl font-bold leading-[1.2] tracking-[-0.02em] text-[#2D2424] sm:text-5xl sm:leading-[1.18]">
              Jij brengt het verhaal. Wij regelen alles daar omheen.
            </h2>
            <p className="mt-5 text-lg leading-[1.7] tracking-[-0.01em] text-[#2D2424]/70">
              Geen idee hoe je het lied moet presenteren? Twijfels over lyrics? Onze song concierge staat klaar via chat, mail of video-call.
              Boek een mini-sessie en we bedenken samen het perfecte reveal moment.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border-2 border-[#FFB4A2]/30 bg-white px-5 py-4 shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl">
                <p className="text-sm font-bold text-[#FF6B6B]">Live script coaching</p>
                <p className="mt-2 text-sm leading-[1.65] tracking-[-0.005em] text-[#2D2424]/70">
                  Ontvang binnen 15 minuten een op maat gemaakt script voor je reveal.
                </p>
              </div>
              <div className="rounded-2xl border-2 border-[#FFB4A2]/30 bg-white px-5 py-4 shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl">
                <p className="text-sm font-bold text-[#FF6B6B]">Atmosfeer curator</p>
                <p className="mt-2 text-sm leading-[1.65] tracking-[-0.005em] text-[#2D2424]/70">
                  Kies een thema (kaarslicht, city night, sunrise) en wij sturen bijpassende visuals en props.
                </p>
              </div>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link
                href="/studio"
                className="group relative overflow-hidden rounded-full bg-gradient-to-r from-[#FF6B6B] to-[#FF8E8E] px-7 py-3.5 text-sm font-bold text-white shadow-2xl shadow-[#FF6B6B]/30 transition-all hover:-translate-y-0.5 hover:shadow-3xl hover:shadow-[#FF6B6B]/40"
              >
                <span className="relative z-10">Plan een gratis kennismaking</span>
              </Link>
              <a
                href="mailto:concierge@liefdesliedje.com"
                className="rounded-full border-2 border-[#FF6B6B]/30 bg-white px-7 py-3 text-sm font-bold text-[#FF6B6B] shadow-lg transition-all hover:border-[#FF6B6B] hover:-translate-y-0.5"
              >
                Mail onze concierge
              </a>
            </div>
          </div>
          <ScrollAnimatedCard delay={0.2}>
            <div className="rounded-3xl border-2 border-[#FFB4A2]/30 bg-white p-6 shadow-xl">
              <p className="text-xs uppercase tracking-[0.3em] text-[#FF6B6B]/70 font-bold">
                Concierge agenda
              </p>
              <div className="mt-4 space-y-4 text-sm">
                <div className="rounded-2xl border border-[#FFB4A2]/30 bg-gradient-to-r from-[#FFE5E5]/30 to-transparent px-4 py-4 transition-all hover:from-[#FFE5E5]/50 hover:shadow-md">
                  <p className="font-bold text-[#FF6B6B]">Mini-call (15 min)</p>
                  <p className="mt-2 text-[#2D2424]/70">Brainstorm reveal idee + eerste lyric feedback.</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.3em] text-[#2D2424]/50">Vrijdag 19:30 - Nog 3 plekken</p>
                </div>
                <div className="rounded-2xl border border-[#FFB4A2]/30 bg-gradient-to-r from-[#FFE5E5]/30 to-transparent px-4 py-4 transition-all hover:from-[#FFE5E5]/50 hover:shadow-md">
                  <p className="font-bold text-[#FF6B6B]">Express delivery</p>
                  <p className="mt-2 text-[#2D2424]/70">Binnen 12 uur je finale track + visual pack.</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.3em] text-[#2D2424]/50">Beschikbaar tegen meerprijs</p>
                </div>
                <div className="rounded-2xl border border-[#FFB4A2]/30 bg-gradient-to-r from-[#FFE5E5]/30 to-transparent px-4 py-4 transition-all hover:from-[#FFE5E5]/50 hover:shadow-md">
                  <p className="font-bold text-[#FF6B6B]">Special request</p>
                  <p className="mt-2 text-[#2D2424]/70">Meertalige lyrics, live muzikant, of custom arrangement? Wij regelen het.</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.3em] text-[#2D2424]/50">Vraag naar de mogelijkheden</p>
                </div>
              </div>
            </div>
          </ScrollAnimatedCard>
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  return (
    <section
      id="faq"
      className="relative border-t border-[#FFB4A2]/30 bg-gradient-to-b from-[#FFF9F5] to-white py-24"
    >
      <div className="relative mx-auto max-w-5xl px-6 lg:px-0">
        <h2 className="text-center text-4xl font-bold leading-[1.2] tracking-[-0.02em] text-[#2D2424] sm:text-5xl sm:leading-[1.18]">
          Veelgestelde vragen.
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-center text-lg leading-[1.7] tracking-[-0.01em] text-[#2D2424]/70">
          Staat je vraag er niet tussen? Onze concierge helpt je live via chat of mail.
        </p>
        <div className="mt-14 space-y-4">
          {faqs.map((faq, index) => (
            <ScrollAnimatedCard key={faq.question} delay={index * 0.1}>
              <details className="group rounded-3xl border-2 border-[#FFB4A2]/30 bg-white p-6 shadow-xl transition-all hover:shadow-2xl">
                <summary className="flex cursor-pointer items-center justify-between text-left text-base font-bold leading-[1.4] tracking-[-0.01em] text-[#2D2424] transition-colors hover:text-[#FF6B6B]">
                  {faq.question}
                  <span className="ml-4 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 border-[#FFB4A2]/30 bg-gradient-to-br from-[#FFE5E5] to-transparent text-sm font-bold text-[#FF6B6B] transition-all group-open:rotate-45 group-open:border-[#FF6B6B] group-open:from-[#FF6B6B] group-open:to-[#FF8E8E] group-open:text-white">
                    +
                  </span>
                </summary>
                <p className="mt-4 text-[0.9375rem] leading-[1.7] tracking-[-0.005em] text-[#2D2424]/70">{faq.answer}</p>
              </details>
            </ScrollAnimatedCard>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#FF6B6B] via-[#FF8E8E] to-[#FFB4A2] py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-10 h-60 w-60 rounded-full bg-[#F9D071]/30 blur-3xl animate-pulse-soft" />
        <div className="absolute -bottom-40 right-10 h-60 w-60 rounded-full bg-white/20 blur-3xl animate-pulse-soft" style={{ animationDelay: '2s' }} />
      </div>
      <div className="relative mx-auto max-w-4xl px-6 text-center text-white lg:px-0">
        <span className="inline-block text-xs font-bold uppercase tracking-[0.4em] text-white/80">
          Liefdesliedje Maker
        </span>
        <h2 className="mt-6 text-4xl font-bold leading-[1.2] tracking-[-0.02em] sm:text-5xl sm:leading-[1.18]">
          Klaar om jouw verhaal te laten zingen?
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-[1.7] tracking-[-0.01em] text-white/90">
          Wees de regisseur van een onvergetelijk moment. Wij zorgen dat jouw lied klinkt als een liefdevolle belofte.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            href="/studio"
            className="group relative overflow-hidden rounded-full bg-white px-8 py-3.5 text-sm font-bold text-[#FF6B6B] shadow-2xl shadow-black/20 transition-all hover:-translate-y-1 hover:shadow-3xl"
          >
            <span className="relative z-10">Creër je liefdeslied (gratis) →</span>
            <div className="absolute inset-0 -z-0 bg-gradient-to-r from-[#F9D071] via-white to-[#FFB4A2] opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>
          <Link
            href="/song"
            className="rounded-full border-2 border-white/40 bg-white/15 px-7 py-3 text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/25 hover:-translate-y-0.5"
          >
            Bekijk voorbeelden
          </Link>
        </div>
        <p className="mt-6 text-xs uppercase tracking-[0.3em] text-white/80 font-semibold">
          Binnen 24 uur een afgewerkt resultaat
        </p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-gradient-to-br from-[#FFF9F5] to-white py-12 border-t border-[#FFB4A2]/30">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 text-sm text-[#2D2424]/70 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="font-bold uppercase tracking-[0.3em] text-[#FF6B6B]">
            Liefdesliedje Maker
          </p>
          <p className="mt-2 max-w-xl">
            Een luxe ervaring voor iedereen die een onvergetelijk, persoonlijk cadeau wil geven.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-xs uppercase tracking-[0.3em] font-semibold">
          <Link href="/studio" className="transition hover:text-[#FF6B6B] hover:scale-105">
            Studio
          </Link>
          <Link href="/song" className="transition hover:text-[#FF6B6B] hover:scale-105">
            Voorbeelden
          </Link>
          <Link href="/landingpage1#faq" className="transition hover:text-[#FF6B6B] hover:scale-105">
            FAQ
          </Link>
        </div>
      </div>
    </footer>
  );
}
