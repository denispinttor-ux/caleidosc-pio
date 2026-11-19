import {useEffect, useState} from 'react';
import {CalendarDays, Clock, MapPin, Timer} from 'lucide-react';
import {EVENT_INFO} from '../types/rsvp';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

function getTimeLeft(): TimeLeft {
  const target = new Date(EVENT_INFO.dateIso).getTime();
  const now = Date.now();
  const diff = target - now;

  if (diff <= 0) {
    return {days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true};
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    isPast: false,
  };
}

export function CountdownStrip() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => getTimeLeft());

  useEffect(() => {
    const id = window.setInterval(() => {
      setTimeLeft(getTimeLeft());
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-[#D4E3FA] bg-white/95 backdrop-blur-md rounded-2xl overflow-hidden shadow-[0_12px_36px_-18px_rgba(38,50,138,0.22)]">
      <div className="p-5 sm:p-6 border-b sm:border-b-0 sm:border-r border-[#E6EFFC]">
        <div className="flex items-center gap-2 text-xs font-medium text-[#4D5E8C]">
          <CalendarDays className="h-4 w-4 text-[#2EA5DB]" aria-hidden="true" />
          <span>Data do Evento</span>
        </div>
        <p className="mt-2 font-display text-2xl font-bold text-[#141E46] tabular-nums">
          20/12/2026
        </p>
        <p className="mt-1 text-xs text-[#5B6B95]">Domingo · Confirmar até 10/12</p>
      </div>

      <div className="p-5 sm:p-6 border-b lg:border-b-0 lg:border-r border-[#E6EFFC]">
        <div className="flex items-center gap-2 text-xs font-medium text-[#4D5E8C]">
          <Clock className="h-4 w-4 text-[#B81D62]" aria-hidden="true" />
          <span>Horário</span>
        </div>
        <p className="mt-2 font-display text-2xl font-bold text-[#141E46] tabular-nums">
          09h às 17h
        </p>
        <p className="mt-1 text-xs text-[#5B6B95]">Dia completo de lazer e festa</p>
      </div>

      <div className="p-5 sm:p-6 border-b sm:border-b-0 sm:border-r border-[#E6EFFC]">
        <div className="flex items-center gap-2 text-xs font-medium text-[#4D5E8C]">
          <MapPin className="h-4 w-4 text-[#7BB62D]" aria-hidden="true" />
          <span>Localização</span>
        </div>
        <p className="mt-2 font-display text-xl font-bold text-[#141E46] leading-snug">
          Chácara Irmãos Pincinato
        </p>
        <p className="mt-1 text-xs text-[#5B6B95]">Malota · Jundiaí/SP</p>
      </div>

      <div className="p-5 sm:p-6 bg-gradient-to-br from-[#172566] to-[#26328A] text-white">
        <div className="flex items-center gap-2 text-xs font-medium text-[#A9CEF8]">
          <Timer className="h-4 w-4 text-[#F5931E]" aria-hidden="true" />
          <span>Contagem Regressiva</span>
        </div>
        {timeLeft.isPast ? (
          <p className="mt-2 font-display text-2xl font-bold text-white">
            É hoje!
          </p>
        ) : (
          <div className="mt-2 flex items-baseline gap-2 font-mono-num text-2xl font-semibold text-white">
            <span>{timeLeft.days}d</span>
            <span className="text-[#5E82D6]">:</span>
            <span>{pad(timeLeft.hours)}h</span>
            <span className="text-[#5E82D6]">:</span>
            <span>{pad(timeLeft.minutes)}m</span>
            <span className="text-[#5E82D6]">:</span>
            <span className="text-[#7ED3FA]">{pad(timeLeft.seconds)}s</span>
          </div>
        )}
        <p className="mt-1 text-xs text-[#B9D6F8]">Início às 09h00</p>
      </div>
    </div>
  );
}
