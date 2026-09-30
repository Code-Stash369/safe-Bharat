import React, { useState } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  HelpCircle, 
  CheckCircle2, 
  ExternalLink,
  Award,
  ArrowRight
} from 'lucide-react';
import { IKS_EXEMPLARS } from '../data/initialData';
import { audioService } from '../services/audioService';
import confetti from 'canvas-confetti';

interface IKSArchiveProps {
  onAwardBonusPoints: (points: number) => void;
}

export const IKSArchive: React.FC<IKSArchiveProps> = ({ onAwardBonusPoints }) => {
  const [selectedExemplar, setSelectedExemplar] = useState(IKS_EXEMPLARS[0]);
  const [quizAnswered, setQuizAnswered] = useState<Record<number, number>>({});
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false);

  const QUIZ_QUESTIONS = [
    {
      question: 'Which ancient water system of Magadh (Bihar) diverted turbulent monsoon peak waters into retention reservoirs for winter irrigation?',
      options: [
        'Ahar-Pyne System',
        'Kareez Channels',
        'Persian Wheel',
        'Bawari Cascade',
      ],
      correct: 0,
      explanation: 'The Mauryan Ahar-Pyne network absorbed sudden flash floods and irrigated winter crops across South Bihar for over 2,000 years.',
    },
    {
      question: 'How do traditional crescent-shaped earthen check-dams (Johads) in Rajasthan revitalize dry river basins?',
      options: [
        'By evaporating hill water into clouds',
        'By slowing water so it percolates and recharges deep subterranean aquifers',
        'By piping river water across long steel aqueducts',
        'By chemical water purification',
      ],
      correct: 1,
      explanation: 'Johads arrest high-speed rainwater torrents, allowing moisture to sleep in the soil and replenishing dry borewells for miles around.',
    },
    {
      question: 'Why are Sacred Groves (Devrais / Orans) crucial for modern climate resilience?',
      options: [
        'They are cut down for timber during droughts',
        'They stabilize micro-climates, preserve ancient medicinal seed banks, and maintain cooler temperatures by 3-5°C',
        'They prevent clouds from moving across mountains',
        'They are used solely for commercial mining',
      ],
      correct: 1,
      explanation: 'Sacred groves act as living ecological gene banks and catch cloud mist to feed perennial hill springs without human intervention.',
    },
  ];

  const handleSelectOption = (qIdx: number, optIdx: number) => {
    if (quizCompleted) return;
    const next = { ...quizAnswered, [qIdx]: optIdx };
    setQuizAnswered(next);

    if (Object.keys(next).length === QUIZ_QUESTIONS.length) {
      setQuizCompleted(true);
      const allCorrect = QUIZ_QUESTIONS.every((q, idx) => next[idx] === q.correct);
      if (allCorrect) {
        onAwardBonusPoints(30);
        audioService.playSuccessChime();
        try {
          confetti({
            particleCount: 70,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#f59e0b', '#10b981', '#3b82f6'],
          });
        } catch {}
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Banner */}
      <section className="bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border border-amber-900/40 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
              Indian Knowledge Systems (IKS)
            </span>
            <span className="text-xs text-slate-400">Timeless Ecological Engineering</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
            Ancient Indian Sustainability &amp; Water Architecture
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Centuries before modern energy-intensive systems, Indian civilizations mastered zero-carbon water harvesting, micro-climate cooling, and community forest protection.
          </p>
        </div>
      </section>

      {/* Main Showcase Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Navigation list of IKS techniques (4 cols) */}
        <div className="lg:col-span-4 space-y-2.5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block px-1">
            Traditional Ecological Masterpieces
          </span>

          {IKS_EXEMPLARS.map((ex) => {
            const isSelected = selectedExemplar.id === ex.id;
            return (
              <button
                key={ex.id}
                onClick={() => setSelectedExemplar(ex)}
                className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-500 shadow-md text-white'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-amber-400">
                    {ex.category}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">{ex.ancientAge}</span>
                </div>
                <h3 className="font-bold text-sm text-white mt-1.5">{ex.title}</h3>
                <div className="text-[11px] text-amber-300/80 font-medium">{ex.hindiTitle}</div>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{ex.summary}</p>
              </button>
            );
          })}
        </div>

        {/* Detailed Exhibit View (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
          <div className="border-b border-slate-800 pb-4 space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {selectedExemplar.category}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {selectedExemplar.region} · {selectedExemplar.ancientAge}
              </span>
            </div>
            <h2 className="font-display font-black text-2xl text-white">
              {selectedExemplar.title}
            </h2>
            <div className="text-sm font-semibold text-amber-400">
              {selectedExemplar.hindiTitle}
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            {selectedExemplar.summary}
          </p>

          {/* Key Principles */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Core Engineering &amp; Ecological Principles:
            </h4>
            <div className="space-y-2">
              {selectedExemplar.principles.map((pr, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 font-bold text-[11px]">
                    {idx + 1}
                  </div>
                  <span>{pr}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Modern Relevance */}
          <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-800/40 text-xs text-amber-200 leading-relaxed space-y-1">
            <span className="font-bold text-white block">Modern 21st-Century Relevance:</span>
            {selectedExemplar.modernRelevance}
          </div>

          {/* Traditional Proverb */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 italic text-center">
            {selectedExemplar.quote}
          </div>
        </div>

      </div>

      {/* Interactive IKS Eco-Heritage Quiz */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-6 h-6 text-amber-400" />
            <div>
              <h2 className="font-display font-bold text-lg text-white">
                IKS Heritage Eco-Quiz (Earn +30 Green Karma)
              </h2>
              <p className="text-xs text-slate-400">
                Answer 3 questions on traditional Indian environmental ingenuity.
              </p>
            </div>
          </div>

          {quizCompleted && (
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
              Quiz Completed!
            </span>
          )}
        </div>

        <div className="space-y-4">
          {QUIZ_QUESTIONS.map((q, qIdx) => {
            const isAnswered = quizAnswered[qIdx] !== undefined;
            const chosen = quizAnswered[qIdx];
            return (
              <div key={qIdx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="text-sm font-bold text-white">
                  {qIdx + 1}. {q.question}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = chosen === optIdx;
                    const isCorrect = q.correct === optIdx;

                    let btnStyle = 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700';
                    if (isAnswered) {
                      if (isCorrect) btnStyle = 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-bold';
                      else if (isSelected) btnStyle = 'bg-red-950/60 border-red-500 text-red-200';
                      else btnStyle = 'bg-slate-900 border-slate-800 text-slate-500';
                    }

                    return (
                      <button
                        key={optIdx}
                        disabled={isAnswered}
                        onClick={() => handleSelectOption(qIdx, optIdx)}
                        className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${btnStyle}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {isAnswered && (
                  <p className="text-xs text-emerald-400/90 font-medium pt-1">
                    💡 <strong>Insight:</strong> {q.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
};
