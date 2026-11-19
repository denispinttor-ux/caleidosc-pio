import {useState, type FormEvent} from 'react';
import {motion, AnimatePresence} from 'motion/react';
import {
  CheckCircle2,
  MapPin,
  Plus,
  Trash2,
  UserCheck,
  Users,
  Heart,
  Baby,
  AlertCircle,
} from 'lucide-react';
import {
  EVENT_INFO,
  SINGLE_COMPANION_RELATIONSHIPS,
  type AttendanceStatus,
  type Companion,
  type GuestType,
  type RsvpRecord,
  type SingleCompanionRelationship,
} from '../types/rsvp';

interface RsvpFormProps {
  onSuccess: (record: RsvpRecord) => void;
}

function createId(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function RsvpForm({onSuccess}: RsvpFormProps) {
  const [employeeName, setEmployeeName] = useState('');
  const [employeeRole, setEmployeeRole] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [attendance, setAttendance] = useState<AttendanceStatus>('attending');
  const [guestType, setGuestType] = useState<GuestType>('family');
  const [companions, setCompanions] = useState<Companion[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedRecord, setSubmittedRecord] = useState<RsvpRecord | null>(null);

  const hasSpouse = companions.some((c) => c.relationship === 'Cônjuge');

  const handleGuestTypeChange = (nextType: GuestType) => {
    setGuestType(nextType);
    setError(null);
    if (nextType === 'alone') {
      setCompanions([]);
    } else if (nextType === 'family') {
      setCompanions((prev) =>
        prev.filter(
          (c) => c.relationship === 'Cônjuge' || c.relationship === 'Filho(a)',
        ),
      );
    } else if (nextType === 'single_plus_one') {
      setCompanions((prev) => {
        if (prev.length === 0) return [];
        return [
          {
            ...prev[0],
            relationship: SINGLE_COMPANION_RELATIONSHIPS.includes(
              prev[0].relationship as SingleCompanionRelationship,
            )
              ? prev[0].relationship
              : 'Acompanhante',
            age: undefined,
          },
        ];
      });
    }
  };

  const addSpouse = () => {
    if (hasSpouse) return;
    setCompanions((prev) => [
      {id: createId(), name: '', relationship: 'Cônjuge'},
      ...prev,
    ]);
  };

  const addChild = () => {
    setCompanions((prev) => [
      ...prev,
      {id: createId(), name: '', relationship: 'Filho(a)', age: ''},
    ]);
  };

  const addSingleCompanion = () => {
    if (companions.length >= 1) return;
    setCompanions([
      {id: createId(), name: '', relationship: 'Acompanhante'},
    ]);
  };

  const updateCompanion = (id: string, patch: Partial<Companion>) => {
    setCompanions((prev) =>
      prev.map((c) => (c.id === id ? {...c, ...patch} : c)),
    );
  };

  const removeCompanion = (id: string) => {
    setCompanions((prev) => prev.filter((c) => c.id !== id));
  };

  const totalPeople =
    attendance === 'not_attending'
      ? 0
      : 1 + (guestType === 'alone' ? 0 : companions.length);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (employeeName.trim().length < 2) {
      setError('Por favor, informe seu nome completo.');
      return;
    }

    if (attendance === 'attending' && guestType !== 'alone') {
      for (const comp of companions) {
        if (comp.name.trim().length < 2) {
          setError('Preencha o nome completo de todos os acompanhantes adicionados.');
          return;
        }
      }
      if (guestType === 'single_plus_one' && companions.length === 0) {
        setError(
          'Você selecionou "Solteiro(a) com 1 acompanhante". Adicione o acompanhante ou selecione "Vou sozinho(a)".',
        );
        return;
      }
      if (guestType === 'family' && companions.length === 0) {
        setError(
          'Você selecionou "Com família (Cônjuge e/ou Filhos)". Adicione pelo menos 1 familiar ou selecione "Vou sozinho(a)".',
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/rsvps', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          employeeName: employeeName.trim(),
          employeeRole: employeeRole.trim(),
          phone: phone.trim(),
          attendance,
          guestType: attendance === 'not_attending' ? 'alone' : guestType,
          companions:
            attendance === 'not_attending' || guestType === 'alone'
              ? []
              : companions,
          notes: notes.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data?.error || 'Não foi possível registrar sua confirmação.');
        return;
      }

      setSubmittedRecord(data.rsvp);
      onSuccess(data.rsvp);
    } catch {
      setError('Erro de conexão ao enviar sua confirmação. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmittedRecord(null);
    setEmployeeName('');
    setEmployeeRole('');
    setPhone('');
    setNotes('');
    setAttendance('attending');
    setGuestType('family');
    setCompanions([]);
    setError(null);
  };

  if (submittedRecord) {
    const confirmedCount =
      submittedRecord.attendance === 'attending'
        ? 1 + submittedRecord.companions.length
        : 0;

    return (
      <motion.div
        initial={{opacity: 0, y: 12}}
        animate={{opacity: 1, y: 0}}
        transition={{duration: 0.3, ease: [0.16, 1, 0.3, 1]}}
        className="rounded-2xl border border-[#D4E3FA] bg-white p-6 sm:p-10 shadow-[0_16px_44px_-20px_rgba(38,50,138,0.2)]"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E6EFFC]">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#EEF6FF] text-[#26328A]">
              <CheckCircle2 className="h-6 w-6 text-[#7BB62D]" />
            </div>
            <div>
              <p className="text-xs font-medium text-[#5B6B95]">
                Registro confirmado · Código{' '}
                <span className="font-mono-num font-semibold text-[#26328A]">
                  {submittedRecord.code}
                </span>
              </p>
              <h3 className="mt-1 font-display text-2xl font-bold text-[#141E46]">
                {submittedRecord.attendance === 'attending'
                  ? 'Presença confirmada com sucesso!'
                  : 'Resposta registrada'}
              </h3>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-[#5B6B95]">Total confirmado</span>
            <p className="font-mono-num text-2xl font-bold text-[#26328A]">
              {confirmedCount} {confirmedCount === 1 ? 'pessoa' : 'pessoas'}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <p className="text-xs font-medium text-[#5B6B95]">Funcionário(a)</p>
            <p className="text-base font-semibold text-[#141E46]">
              {submittedRecord.employeeName}
            </p>
            {(submittedRecord.employeeRole || submittedRecord.phone) && (
              <p className="text-sm text-[#4D5E8C]">
                {[submittedRecord.employeeRole, submittedRecord.phone]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}
            {submittedRecord.notes && (
              <p className="text-xs text-[#4D5E8C] pt-1">
                Observação: {submittedRecord.notes}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-[#5B6B95]">
              Acompanhantes e parentesco
            </p>
            {submittedRecord.attendance === 'not_attending' ? (
              <p className="text-sm text-[#4D5E8C]">
                Informou que não poderá comparecer nesta edição.
              </p>
            ) : submittedRecord.companions.length === 0 ? (
              <p className="text-sm text-[#4D5E8C]">
                Participação individual (sem acompanhantes).
              </p>
            ) : (
              <ul className="space-y-1.5">
                {submittedRecord.companions.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between text-sm text-[#141E46] border-b border-[#F0F5FD] pb-1.5"
                  >
                    <span className="font-medium">{c.name}</span>
                    <span className="text-xs text-[#4D5E8C]">
                      {c.relationship}
                      {c.age ? ` · ${c.age}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[#E6EFFC] flex flex-wrap items-center justify-between gap-4">
          <a
            href={EVENT_INFO.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-[#26328A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1D2770] transition-colors whitespace-nowrap shrink-0"
          >
            <MapPin className="h-4 w-4" />
            <span>Abrir rota no Google Maps</span>
          </a>

          <button
            type="button"
            onClick={resetForm}
            className="inline-flex items-center gap-2 rounded-xl border border-[#C8DAF5] bg-white px-4 py-2.5 text-sm font-medium text-[#26328A] hover:bg-[#F3F8FF] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Registrar outra confirmação
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-[#D4E3FA] bg-white p-6 sm:p-8 lg:p-10 shadow-[0_16px_44px_-22px_rgba(38,50,138,0.18)] space-y-8"
    >
      {/* Attendance segmented control */}
      <div>
        <label className="block text-sm font-semibold text-[#141E46] mb-3">
          1. Você participará da Confraternização?
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1.5 bg-[#F1F6FE] rounded-xl border border-[#DCE8FA]">
          <button
            type="button"
            onClick={() => setAttendance('attending')}
            className={`flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              attendance === 'attending'
                ? 'bg-[#26328A] text-white shadow-sm'
                : 'text-[#4D5E8C] hover:text-[#141E46]'
            }`}
          >
            <UserCheck className="h-4 w-4 shrink-0" />
            <span>Sim, vou participar</span>
          </button>
          <button
            type="button"
            onClick={() => setAttendance('not_attending')}
            className={`flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              attendance === 'not_attending'
                ? 'bg-white text-[#B81D62] shadow-sm border border-[#E6EFFC]'
                : 'text-[#4D5E8C] hover:text-[#141E46]'
            }`}
          >
            <span>Não poderei comparecer</span>
          </button>
        </div>
      </div>

      {/* Employee Data */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-[#141E46]">
          2. Dados do(a) Funcionário(a)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label
              htmlFor="employeeName"
              className="block text-xs font-medium text-[#4D5E8C] mb-1.5"
            >
              Nome completo *
            </label>
            <input
              id="employeeName"
              type="text"
              required
              maxLength={100}
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              placeholder="Ex.: Mariana Oliveira"
              className="w-full rounded-xl border border-[#C8DAF5] bg-[#FAFBFD] px-3.5 py-2.5 text-sm text-[#141E46] placeholder:text-[#8E9EC4] focus:border-[#2EA5DB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2EA5DB]/20"
            />
          </div>

          <div>
            <label
              htmlFor="employeeRole"
              className="block text-xs font-medium text-[#4D5E8C] mb-1.5"
            >
              Cargo / Turma na escola
            </label>
            <input
              id="employeeRole"
              type="text"
              maxLength={80}
              value={employeeRole}
              onChange={(e) => setEmployeeRole(e.target.value)}
              placeholder="Ex.: Professora Infantil II"
              className="w-full rounded-xl border border-[#C8DAF5] bg-[#FAFBFD] px-3.5 py-2.5 text-sm text-[#141E46] placeholder:text-[#8E9EC4] focus:border-[#2EA5DB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2EA5DB]/20"
            />
          </div>

          <div>
            <label
              htmlFor="employeePhone"
              className="block text-xs font-medium text-[#4D5E8C] mb-1.5"
            >
              WhatsApp / Telefone
            </label>
            <input
              id="employeePhone"
              type="tel"
              maxLength={30}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 99999-9999"
              className="w-full rounded-xl border border-[#C8DAF5] bg-[#FAFBFD] px-3.5 py-2.5 text-sm text-[#141E46] placeholder:text-[#8E9EC4] focus:border-[#2EA5DB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2EA5DB]/20"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="employeeNotes"
            className="block text-xs font-medium text-[#4D5E8C] mb-1.5"
          >
            Observação — Tem alguma observação ou ressalva?
          </label>
          <input
            id="employeeNotes"
            type="text"
            maxLength={300}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Tem alguma observação ou ressalva"
            className="w-full rounded-xl border border-[#C8DAF5] bg-[#FAFBFD] px-3.5 py-2.5 text-sm text-[#141E46] placeholder:text-[#8E9EC4] focus:border-[#2EA5DB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2EA5DB]/20"
          />
        </div>
      </div>

      {/* Companions Section (only when attending) */}
      <AnimatePresence mode="wait">
        {attendance === 'attending' && (
          <motion.div
            key="companions-block"
            initial={{opacity: 0, y: 8}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -8}}
            transition={{duration: 0.2}}
            className="space-y-5 pt-2 border-t border-[#E6EFFC]"
          >
            <div>
              <h3 className="text-sm font-semibold text-[#141E46]">
                3. Acompanhantes
              </h3>
              <p className="mt-1 text-xs text-[#4D5E8C]">
                Selecione uma modalidade abaixo para informar seus acompanhantes e
                o grau de parentesco.
              </p>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleGuestTypeChange('alone')}
                  className={`text-left rounded-xl border p-4 transition-all cursor-pointer ${
                    guestType === 'alone'
                      ? 'border-[#26328A] bg-[#F3F8FF] ring-1 ring-[#26328A]'
                      : 'border-[#DCE8FA] bg-white hover:border-[#A8C4EE]'
                  }`}
                >
                  <p className="text-sm font-semibold text-[#141E46]">
                    Vou sozinho(a)
                  </p>
                  <p className="mt-1 text-xs text-[#5B6B95]">
                    Apenas a minha confirmação (0 acompanhantes)
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleGuestTypeChange('family')}
                  className={`text-left rounded-xl border p-4 transition-all cursor-pointer ${
                    guestType === 'family'
                      ? 'border-[#26328A] bg-[#F3F8FF] ring-1 ring-[#26328A]'
                      : 'border-[#DCE8FA] bg-white hover:border-[#A8C4EE]'
                  }`}
                >
                  <p className="text-sm font-semibold text-[#141E46]">
                    Família (Cônjuge e Filhos)
                  </p>
                  <p className="mt-1 text-xs text-[#5B6B95]">
                    Até 1 cônjuge e seus filhos
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleGuestTypeChange('single_plus_one')}
                  className={`text-left rounded-xl border p-4 transition-all cursor-pointer ${
                    guestType === 'single_plus_one'
                      ? 'border-[#26328A] bg-[#F3F8FF] ring-1 ring-[#26328A]'
                      : 'border-[#DCE8FA] bg-white hover:border-[#A8C4EE]'
                  }`}
                >
                  <p className="text-sm font-semibold text-[#141E46]">
                    Solteiro(a) + 1 Acompanhante
                  </p>
                  <p className="mt-1 text-xs text-[#5B6B95]">
                    Direito a exatamente 1 acompanhante
                  </p>
                </button>
              </div>
            </div>

            {guestType === 'family' && (
              <div className="space-y-4 rounded-xl border border-[#E2ECFC] bg-[#F9FBFF] p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#141E46]">
                      Lista de familiares
                    </p>
                    <p className="text-xs text-[#5B6B95]">
                      Adicione seu cônjuge (máximo 1) e seus filhos com o grau de
                      parentesco.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={addSpouse}
                      disabled={hasSpouse}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#C8DAF5] bg-white px-3 py-2 text-xs font-semibold text-[#26328A] hover:bg-[#EEF6FF] disabled:opacity-45 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Heart className="h-3.5 w-3.5 text-[#B81D62]" />
                      <span>
                        {hasSpouse ? 'Cônjuge adicionado' : '+ Adicionar Cônjuge'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={addChild}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#2EA5DB] px-3 py-2 text-xs font-semibold text-white hover:bg-[#238FC1] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Baby className="h-3.5 w-3.5" />
                      <span>+ Adicionar Filho(a)</span>
                    </button>
                  </div>
                </div>

                {companions.length === 0 ? (
                  <p className="text-xs text-[#5B6B95] py-3">
                    Clique nos botões acima para adicionar seu cônjuge e/ou filhos.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {companions.map((comp, idx) => (
                      <div
                        key={comp.id}
                        className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end rounded-xl border border-[#DCE8FA] bg-white p-3.5"
                      >
                        <div className="sm:col-span-5">
                          <label className="block text-xs font-medium text-[#4D5E8C] mb-1">
                            Nome completo ({idx + 1}) *
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={100}
                            value={comp.name}
                            onChange={(e) =>
                              updateCompanion(comp.id, {name: e.target.value})
                            }
                            placeholder={
                              comp.relationship === 'Cônjuge'
                                ? 'Nome do(a) cônjuge'
                                : 'Nome do(a) filho(a)'
                            }
                            className="w-full rounded-lg border border-[#C8DAF5] px-3 py-2 text-sm text-[#141E46] focus:border-[#2EA5DB] focus:outline-none"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-xs font-medium text-[#4D5E8C] mb-1">
                            Grau de parentesco
                          </label>
                          <input
                            type="text"
                            readOnly
                            value={comp.relationship}
                            className="w-full rounded-lg border border-[#E6EFFC] bg-[#F5F9FF] px-3 py-2 text-sm font-medium text-[#26328A]"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          {comp.relationship === 'Filho(a)' ? (
                            <>
                              <label className="block text-xs font-medium text-[#4D5E8C] mb-1">
                                Idade (opcional)
                              </label>
                              <input
                                type="text"
                                maxLength={20}
                                value={comp.age || ''}
                                onChange={(e) =>
                                  updateCompanion(comp.id, {age: e.target.value})
                                }
                                placeholder="Ex.: 6 anos"
                                className="w-full rounded-lg border border-[#C8DAF5] px-3 py-2 text-sm text-[#141E46] focus:border-[#2EA5DB] focus:outline-none"
                              />
                            </>
                          ) : (
                            <div className="text-xs text-[#5B6B95] py-2">
                              Máximo de 1 cônjuge
                            </div>
                          )}
                        </div>

                        <div className="sm:col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => removeCompanion(comp.id)}
                            aria-label={`Remover ${comp.name || comp.relationship}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#F3D2DF] text-[#B81D62] hover:bg-[#FDF2F6] transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {guestType === 'single_plus_one' && (
              <div className="space-y-4 rounded-xl border border-[#E2ECFC] bg-[#F9FBFF] p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#141E46]">
                      Acompanhante do(a) funcionário(a) solteiro(a)
                    </p>
                    <p className="text-xs text-[#5B6B95]">
                      Regra da escola: direito a no máximo 1 acompanhante.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addSingleCompanion}
                    disabled={companions.length >= 1}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#2EA5DB] px-3 py-2 text-xs font-semibold text-white hover:bg-[#238FC1] disabled:opacity-45 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>
                      {companions.length >= 1
                        ? 'Limite de 1 atingido'
                        : '+ Adicionar Acompanhante'}
                    </span>
                  </button>
                </div>

                {companions.length === 0 ? (
                  <p className="text-xs text-[#5B6B95] py-3">
                    Clique em "+ Adicionar Acompanhante" para informar o nome e o
                    grau de parentesco ou vínculo.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {companions.map((comp) => (
                      <div
                        key={comp.id}
                        className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end rounded-xl border border-[#DCE8FA] bg-white p-3.5"
                      >
                        <div className="sm:col-span-6">
                          <label className="block text-xs font-medium text-[#4D5E8C] mb-1">
                            Nome completo do acompanhante *
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={100}
                            value={comp.name}
                            onChange={(e) =>
                              updateCompanion(comp.id, {name: e.target.value})
                            }
                            placeholder="Nome completo"
                            className="w-full rounded-lg border border-[#C8DAF5] px-3 py-2 text-sm text-[#141E46] focus:border-[#2EA5DB] focus:outline-none"
                          />
                        </div>

                        <div className="sm:col-span-5">
                          <label className="block text-xs font-medium text-[#4D5E8C] mb-1">
                            Grau de parentesco / vínculo *
                          </label>
                          <select
                            value={comp.relationship}
                            onChange={(e) =>
                              updateCompanion(comp.id, {
                                relationship: e.target.value as SingleCompanionRelationship,
                              })
                            }
                            className="w-full rounded-lg border border-[#C8DAF5] bg-white px-3 py-2 text-sm text-[#141E46] focus:border-[#2EA5DB] focus:outline-none"
                          >
                            {SINGLE_COMPANION_RELATIONSHIPS.map((rel) => (
                              <option key={rel} value={rel}>
                                {rel}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => removeCompanion(comp.id)}
                            aria-label="Remover acompanhante"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#F3D2DF] text-[#B81D62] hover:bg-[#FDF2F6] transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-[#F3C5D7] bg-[#FDF2F6] p-3.5 text-sm text-[#99154E]"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Submit Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#E6EFFC]">
        <div className="flex items-center gap-2.5 text-sm text-[#4D5E8C]">
          <Users className="h-4 w-4 text-[#26328A]" />
          {attendance === 'attending' ? (
            <span>
              Resumo:{' '}
              <strong className="font-mono-num text-[#141E46]">
                {totalPeople} {totalPeople === 1 ? 'pessoa' : 'pessoas'}
              </strong>{' '}
              (1 funcionário +{' '}
              <span className="font-mono-num">
                {guestType === 'alone' ? 0 : companions.length}
              </span>{' '}
              acompanhante{companions.length === 1 ? '' : 's'})
            </span>
          ) : (
            <span>Registrando impossibilidade de comparecimento</span>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#B81D62] px-6 py-3 text-sm font-semibold text-white hover:bg-[#9B1652] disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>{submitting ? 'Enviando confirmação...' : 'Confirmar presença'}</span>
        </button>
      </div>
    </form>
  );
}
