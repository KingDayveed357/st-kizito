import Image from "next/image";
import { Download, Play, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#FDFCF9] dark:bg-slate-950 pt-28 pb-16 px-6 lg:px-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        <div className="absolute -top-[15%] -right-[10%] w-[60%] h-[60%] bg-emerald-100/30 dark:bg-emerald-900/10 blur-[130px] rounded-full" />
        <div className="absolute -bottom-[10%] -left-[5%] w-[45%] h-[45%] bg-amber-100/30 dark:bg-amber-900/10 blur-[130px] rounded-full" />
      </div>

      <div className="container mx-auto max-w-7xl z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="flex flex-col space-y-8 text-center lg:text-left items-center lg:items-start">
            <div>
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/40 shadow-sm backdrop-blur-md">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-emerald-800 dark:text-emerald-400">
                  St. Kizito Parish App
                </span>
              </div>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-serif font-medium text-slate-900 dark:text-white leading-[1.05] tracking-tight">
              Walk with Christ <br />
              <span className="italic text-emerald-700 dark:text-emerald-500 font-normal">Each Day.</span> <br />
              Stay close to <span className="relative inline-block">St. Kizito.
                <svg className="absolute -bottom-2 lg:-bottom-4 left-0 w-full" viewBox="0 0 100 10" aria-hidden="true">
                  <path d="M0,5 Q50,10 100,5" stroke="#10b981" strokeWidth="2.5" fill="transparent" opacity="0.4" />
                </svg>
              </span>
            </h1>

            <p className="text-lg md:text-xl lg:text-2xl text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed font-light">
              A holy digital home for our parishioners and families. Receive daily readings,
              the Divine Office, Mass updates, and parish notices that keep your faith life
              rooted in prayer and communion.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-5 pt-4 w-full sm:w-auto">
              <Button asChild size="lg"
                className="group relative w-full sm:w-auto rounded-2xl px-10 py-8 h-auto text-lg font-medium bg-emerald-900 hover:bg-emerald-950 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white transition-all duration-500 shadow-[0_25px_50px_-12px_rgba(6,95,70,0.4)] dark:shadow-none hover:-translate-y-1.5 overflow-hidden border-none"
              >
                <a href="#" aria-label="Download the St. Kizito Parish app">
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <Download className="mr-2.5 h-6 w-6" />
                  Download the Parish App
                </a>
              </Button>
              
              <Button asChild variant="outline" size="lg"
                className="w-full sm:w-auto rounded-2xl px-10 py-8 h-auto text-lg font-medium border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all duration-300 gap-3 text-slate-700 dark:text-slate-300 backdrop-blur-sm"
              >
                <a href="#" aria-label="Learn how the app helps parishioners">
                  <span className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center transition-colors">
                    <Play className="h-4 w-4 fill-slate-900 dark:fill-white text-slate-900 dark:text-white ml-1" />
                  </span>
                  See How It Helps
                </a>
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 pt-10 border-t border-slate-200/50 dark:border-slate-800/50 w-full lg:w-auto">
              <div className="flex -space-x-3.5">
                {["SK", "PA", "MK", "CG", "JN"].map((label) => (
                  <div key={label} className="h-11 w-11 rounded-full border-2 border-white dark:border-slate-950 bg-slate-100 overflow-hidden shadow-lg ring-1 ring-slate-200/20 flex items-center justify-center text-[10px] font-semibold text-slate-700">
                    {label}
                  </div>
                ))}
              </div>
              <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
                <div className="flex items-center gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400 drop-shadow-sm" />
                  ))}
                  <span className="text-xs font-bold text-slate-900 dark:text-white ml-1.5 uppercase tracking-widest">Faith-Centered Experience</span>
                </div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                  Made with love for St. Kizito Parishioners
                </p>
              </div>
            </div>
          </div>

          <div className="relative flex justify-center group">
            <div className="relative z-20 w-[310px] h-[640px] md:w-[360px] md:h-[740px] bg-[#0F0F10] rounded-[3.8rem] p-4 shadow-[0_60px_120px_-20px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.05)] border-[12px] border-[#1C1C1E] ring-1 ring-slate-800">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-8 bg-[#1C1C1E] rounded-b-[24px] z-50 flex items-center justify-center">
                <div className="w-[3px] h-[3px] rounded-full bg-blue-500/50 mr-4" />
                <div className="w-11 h-1 bg-[#2C2C2E] rounded-full" />
              </div>

              <div className="relative w-full h-full rounded-[2.8rem] overflow-hidden bg-[#FBF9F4] shadow-inner ring-1 ring-black/10">
                <Image
                  src="/assets/app-preview.png"
                  alt="St. Kizito Parish app preview"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 310px, 360px"
                  quality={78}
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-white/5 to-transparent pointer-events-none z-40" />
              </div>

              <div className="absolute -left-[16px] top-36 w-[4px] h-12 bg-[#1C1C1E] rounded-l-lg" />
              <div className="absolute -left-[16px] top-52 w-[4px] h-[40px] bg-[#1C1C1E] rounded-l-lg border-b border-black/20" />
              <div className="absolute -left-[16px] top-64 w-[4px] h-[40px] bg-[#1C1C1E] rounded-l-lg border-b border-black/20" />
              <div className="absolute -right-[16px] top-44 w-[4px] h-24 bg-[#1C1C1E] rounded-r-lg" />
            </div>

            <FloatingNotification
              className="absolute top-[15%] -right-4 md:-right-16 z-30 hidden md:flex"
              icon="🔔"
              title="Mass Alert"
              text="Evening Mass at 6:00 PM"
              time="Now"
            />
            <FloatingNotification
              className="absolute bottom-[25%] -left-6 md:-left-20 z-30 hidden md:flex"
              icon="📖"
              title="Daily Reading"
              text="The Word of the Lord..."
              time="8:00 AM"
            />

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-gradient-to-tr from-emerald-500/10 via-amber-500/5 to-teal-500/10 blur-[140px] -z-10 rounded-full" />
          </div>

        </div>
      </div>
    </section>
  );
};
const FloatingNotification = ({
  icon,
  title,
  text,
  time,
  className,
}: {
  icon: string
  title: string
  text: string
  time: string
  className?: string
}) => (
  <div className={`rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/40 dark:border-slate-800/40 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.12)] p-4 min-w-[240px] ${className ?? ""}`}>
    <div className="flex gap-4">
    <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-xl shadow-sm border border-slate-100/50 dark:border-slate-700/50">
      {icon}
    </div>
    <div className="flex flex-col flex-1">
      <div className="flex justify-between items-center mb-0.5">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{title}</h3>
        <span className="text-[9px] font-medium text-slate-400">{time}</span>
      </div>
      <p className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">{text}</p>
    </div>
    </div>
  </div>
);

