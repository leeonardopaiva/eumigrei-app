'use client';

import React, { useMemo, useState } from 'react';
import { Lightbulb, MessageSquarePlus, X } from 'lucide-react';
import { useToast } from './ToastProvider';

type SuggestionCategoryValue = 'FUNCTIONALITY' | 'IMPROVEMENT';

const categoryOptions: Array<{
  value: SuggestionCategoryValue;
  label: string;
  description: string;
}> = [
  {
    value: 'FUNCTIONALITY',
    label: 'Funcionalidade',
    description: 'Nova ideia ou recurso que ainda nao existe.',
  },
  {
    value: 'IMPROVEMENT',
    label: 'Melhoria',
    description: 'Ajuste em algo que ja existe na plataforma.',
  },
];

const SuggestionButton: React.FC = () => {
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<SuggestionCategoryValue>('FUNCTIONALITY');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectedCategory = useMemo(
    () => categoryOptions.find((option) => option.value === category) ?? categoryOptions[0],
    [category],
  );

  const resetForm = () => {
    setCategory('FUNCTIONALITY');
    setMessage('');
  };

  const closeModal = () => {
    setOpen(false);
    resetForm();
  };

  React.useEffect(() => {
    const openFromNavigation = () => setOpen(true);

    window.addEventListener('emigrei:open-suggestion-modal', openFromNavigation);

    return () => {
      window.removeEventListener('emigrei:open-suggestion-modal', openFromNavigation);
    };
  }, []);

  const submitSuggestion = async () => {
    if (message.trim().length < 8) {
      showToast('Descreva melhor a sua sugestao antes de enviar.', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
          message: message.trim(),
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        showToast(payload?.error ?? 'Nao foi possivel enviar sua sugestao.', 'error');
        return;
      }

      showToast('Sugestao enviada. Obrigado por ajudar a evoluir a plataforma.', 'success');
      closeModal();
    } catch (error) {
      console.error('Failed to submit suggestion:', error);
      showToast('Nao foi possivel enviar sua sugestao.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-28 right-5 z-[70] inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#28B8C7] text-white shadow-2xl shadow-[#28B8C7]/25 transition hover:bg-[#24A9B7] lg:bottom-8 lg:right-8 lg:h-auto lg:w-auto lg:gap-2 lg:px-4 lg:py-3"
        aria-label="Enviar sugestao"
      >
        <MessageSquarePlus size={18} />
        <span className="hidden lg:inline">Sugestao</span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[150] flex items-end justify-center bg-black/35 p-4 backdrop-blur-sm lg:items-center">
          <div className="w-full max-w-lg rounded-[32px] bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-[#28B8C7]">
                  <Lightbulb size={14} />
                  Sugestao
                </div>
                <h2 className="mt-3 text-xl font-bold text-slate-900">Conte para nos o que melhorar</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  Escolha o tipo da sugestao e descreva o que faria diferenca para voce.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Fechar sugestao"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {categoryOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setCategory(option.value)}
                  className={`rounded-3xl border px-4 py-4 text-left transition ${
                    category === option.value
                      ? 'border-[#28B8C7] bg-cyan-50 text-[#28B8C7] shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <p className="text-sm font-bold">{option.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{option.description}</p>
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-3xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                {selectedCategory.label}
              </p>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={5}
                placeholder="Exemplo: seria melhor ter um filtro por tipo de documento na comunidade."
                className="mt-3 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-200 focus:ring-2 focus:ring-cyan-100"
              />
              <p className="mt-2 text-right text-xs text-slate-400">{message.trim().length}/600</p>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600 disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void submitSuggestion()}
                disabled={submitting}
                className="flex-1 rounded-2xl bg-[#28B8C7] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[#28B8C7]/20 disabled:opacity-60"
              >
                {submitting ? 'Enviando...' : 'Enviar sugestao'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default SuggestionButton;
