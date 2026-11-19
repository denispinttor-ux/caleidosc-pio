import {useEffect, useMemo, useState, type FormEvent} from 'react';
import {
  AlertCircle,
  Download,
  Edit3,
  Heart,
  Baby,
  Lock,
  LogOut,
  MessageSquareText,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import {
  SINGLE_COMPANION_RELATIONSHIPS,
  type AttendanceStatus,
  type Companion,
  type GuestType,
  type RsvpRecord,
  type RsvpStats,
  type SingleCompanionRelationship,
} from '../types/rsvp';

interface AdminPanelProps {
  onClose?: () => void;
  onStatsChange?: () => void;
}

type FilterTab =
  | 'all'
  | 'attending'
  | 'family'
  | 'single_plus_one'
  | 'alone'
  | 'not_attending';

function createId(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const GUEST_TYPE_LABELS: Record<GuestType, string> = {
  alone: 'Individual',
  family: 'Família',
  single_plus_one: 'Solteiro +1',
};

export function AdminPanel({onClose, onStatsChange}: AdminPanelProps) {
  const [adminPassword, setAdminPassword] = useState<string | null>(null);
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const [rsvps, setRsvps] = useState<RsvpRecord[]>([]);
  const [stats, setStats] = useState<RsvpStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('all');

  // Edit modal state
  const [editingRecord, setEditingRecord] = useState<RsvpRecord | null>(null);
  const [editEmployeeName, setEditEmployeeName] = useState('');
  const [editEmployeeRole, setEditEmployeeRole] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAttendance, setEditAttendance] = useState<AttendanceStatus>('attending');
  const [editGuestType, setEditGuestType] = useState<GuestType>('family');
  const [editCompanions, setEditCompanions] = useState<Companion[]>([]);
  const [editNotes, setEditNotes] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  // Password confirmation modal for Edit or Delete
  const [pendingAction, setPendingAction] = useState<
    | {type: 'edit'; recordId: string}
    | {type: 'delete'; record: RsvpRecord}
    | null
  >(null);
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [confirmSubmitting, setConfirmSubmitting] = useState(false);

  // Quick observation modal state
  const [noteModalRecord, setNoteModalRecord] = useState<RsvpRecord | null>(null);
  const [quickNoteText, setQuickNoteText] = useState('');
  const [quickNoteError, setQuickNoteError] = useState<string | null>(null);
  const [quickNoteSaving, setQuickNoteSaving] = useState(false);

  const openQuickNoteModal = (record: RsvpRecord) => {
    setNoteModalRecord(record);
    setQuickNoteText(record.notes || '');
    setQuickNoteError(null);
  };

  const handleSaveQuickNote = async (e: FormEvent) => {
    e.preventDefault();
    if (!noteModalRecord || !adminPassword) return;
    setQuickNoteError(null);
    setQuickNoteSaving(true);
    try {
      const res = await fetch(`/api/admin/rsvps/${noteModalRecord.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword,
        },
        body: JSON.stringify({
          employeeName: noteModalRecord.employeeName,
          employeeRole: noteModalRecord.employeeRole,
          phone: noteModalRecord.phone,
          attendance: noteModalRecord.attendance,
          guestType: noteModalRecord.guestType,
          companions: noteModalRecord.companions,
          notes: quickNoteText.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setQuickNoteError(data?.error || 'Não foi possível salvar a observação.');
        return;
      }
      setRsvps((prev) =>
        prev.map((item) => (item.id === data.rsvp.id ? data.rsvp : item)),
      );
      setStats(data.stats);
      setNoteModalRecord(null);
      onStatsChange?.();
    } catch {
      setQuickNoteError('Erro de conexão ao salvar observação.');
    } finally {
      setQuickNoteSaving(false);
    }
  };

  const loadRsvps = async (pwd: string) => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/admin/rsvps', {
        headers: {'x-admin-password': pwd},
      });
      if (!res.ok) {
        if (res.status === 401) {
          setAdminPassword(null);
          setLoginError('Sessão expirada ou senha inválida.');
          return;
        }
        throw new Error('Erro ao carregar lista.');
      }
      const data = await res.json();
      setRsvps(data.rsvps || []);
      setStats(data.stats || null);
    } catch {
      setFetchError('Não foi possível carregar a lista de confirmações.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminPassword) {
      loadRsvps(adminPassword);
    }
  }, [adminPassword]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setVerifying(true);
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({password: loginPassword}),
      });
      if (!res.ok) {
        setLoginError('Senha incorreta. Verifique e tente novamente.');
        return;
      }
      setAdminPassword(loginPassword);
      setLoginPassword('');
    } catch {
      setLoginError('Erro ao verificar senha.');
    } finally {
      setVerifying(false);
    }
  };

  const openEditModal = (record: RsvpRecord) => {
    setEditingRecord(record);
    setEditEmployeeName(record.employeeName);
    setEditEmployeeRole(record.employeeRole);
    setEditPhone(record.phone);
    setEditAttendance(record.attendance);
    setEditGuestType(record.guestType);
    setEditCompanions(record.companions.map((c) => ({...c})));
    setEditNotes(record.notes);
    setEditError(null);
  };

  const handleEditGuestTypeChange = (nextType: GuestType) => {
    setEditGuestType(nextType);
    setEditError(null);
    if (nextType === 'alone') {
      setEditCompanions([]);
    } else if (nextType === 'family') {
      setEditCompanions((prev) =>
        prev.filter((c) => c.relationship === 'Cônjuge' || c.relationship === 'Filho(a)'),
      );
    } else if (nextType === 'single_plus_one') {
      setEditCompanions((prev) => {
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

  const validateEditForm = (): boolean => {
    setEditError(null);
    if (editEmployeeName.trim().length < 2) {
      setEditError('Informe o nome completo do(a) funcionário(a).');
      return false;
    }
    if (editAttendance === 'attending' && editGuestType !== 'alone') {
      for (const comp of editCompanions) {
        if (comp.name.trim().length < 2) {
          setEditError('Todos os acompanhantes precisam ter nome completo.');
          return false;
        }
      }
      if (editGuestType === 'single_plus_one' && editCompanions.length > 1) {
        setEditError('Funcionários solteiros podem levar no máximo 1 acompanhante.');
        return false;
      }
      const spouseCount = editCompanions.filter(
        (c) => c.relationship === 'Cônjuge',
      ).length;
      if (editGuestType === 'family' && spouseCount > 1) {
        setEditError('Máximo de 1 cônjuge permitido.');
        return false;
      }
    }
    return true;
  };

  const requestEditPasswordConfirmation = (e: FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    if (!validateEditForm()) return;
    setConfirmPasswordInput('');
    setConfirmPasswordError(null);
    setPendingAction({type: 'edit', recordId: editingRecord.id});
  };

  const requestDeletePasswordConfirmation = (record: RsvpRecord) => {
    setConfirmPasswordInput('');
    setConfirmPasswordError(null);
    setPendingAction({type: 'delete', record});
  };

  const executeConfirmedAction = async (e: FormEvent) => {
    e.preventDefault();
    if (!pendingAction) return;
    setConfirmPasswordError(null);
    setConfirmSubmitting(true);

    try {
      if (pendingAction.type === 'edit') {
        const res = await fetch(`/api/admin/rsvps/${pendingAction.recordId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-password': confirmPasswordInput,
          },
          body: JSON.stringify({
            employeeName: editEmployeeName.trim(),
            employeeRole: editEmployeeRole.trim(),
            phone: editPhone.trim(),
            attendance: editAttendance,
            guestType: editAttendance === 'not_attending' ? 'alone' : editGuestType,
            companions:
              editAttendance === 'not_attending' || editGuestType === 'alone'
                ? []
                : editCompanions,
            notes: editNotes.trim(),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setConfirmPasswordError(data?.error || 'Não foi possível salvar.');
          return;
        }
        setRsvps((prev) =>
          prev.map((r) => (r.id === data.rsvp.id ? data.rsvp : r)),
        );
        setStats(data.stats);
        setPendingAction(null);
        setEditingRecord(null);
        onStatsChange?.();
      } else if (pendingAction.type === 'delete') {
        const res = await fetch(`/api/admin/rsvps/${pendingAction.record.id}`, {
          method: 'DELETE',
          headers: {
            'x-admin-password': confirmPasswordInput,
          },
        });
        const data = await res.json();
        if (!res.ok) {
          setConfirmPasswordError(data?.error || 'Senha incorreta.');
          return;
        }
        setRsvps((prev) => prev.filter((r) => r.id !== pendingAction.record.id));
        setStats(data.stats);
        setPendingAction(null);
        onStatsChange?.();
      }
    } catch {
      setConfirmPasswordError('Erro de rede ao processar confirmação.');
    } finally {
      setConfirmSubmitting(false);
    }
  };

  const filteredRsvps = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rsvps.filter((r) => {
      if (filterTab === 'attending' && r.attendance !== 'attending') return false;
      if (filterTab === 'not_attending' && r.attendance !== 'not_attending') return false;
      if (
        filterTab === 'family' &&
        (r.attendance !== 'attending' || r.guestType !== 'family')
      ) {
        return false;
      }
      if (
        filterTab === 'single_plus_one' &&
        (r.attendance !== 'attending' || r.guestType !== 'single_plus_one')
      ) {
        return false;
      }
      if (
        filterTab === 'alone' &&
        (r.attendance !== 'attending' || r.guestType !== 'alone')
      ) {
        return false;
      }

      if (!q) return true;
      const inEmployee =
        r.employeeName.toLowerCase().includes(q) ||
        r.employeeRole.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q);
      const inCompanions = r.companions.some(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.relationship.toLowerCase().includes(q),
      );
      return inEmployee || inCompanions;
    });
  }, [rsvps, filterTab, search]);

  const handleExportCsv = () => {
    const headers = [
      'Código',
      'Funcionário(a)',
      'Cargo/Turma',
      'Telefone',
      'Presença',
      'Modalidade',
      'Qtd Acompanhantes',
      'Total Pessoas',
      'Acompanhantes e Parentesco',
      'Observações',
      'Data Registro',
    ];

    const escapeCsv = (val: string | number) => {
      const s = String(val ?? '');
      return `"${s.replace(/"/g, '""')}"`;
    };

    const rows = rsvps.map((r) => {
      const compStr = r.companions
        .map((c) => `${c.name} (${c.relationship}${c.age ? `, ${c.age}` : ''})`)
        .join('; ');
      const total = r.attendance === 'attending' ? 1 + r.companions.length : 0;
      return [
        r.code,
        r.employeeName,
        r.employeeRole,
        r.phone,
        r.attendance === 'attending' ? 'Confirmado' : 'Não comparecerá',
        GUEST_TYPE_LABELS[r.guestType],
        r.companions.length,
        total,
        compStr,
        r.notes,
        new Date(r.createdAt).toLocaleString('pt-BR'),
      ]
        .map(escapeCsv)
        .join(',');
    });

    const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Lista-Convidados-Caleidoscopio-2026.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!adminPassword) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-[#D8E5F8] bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 pb-5 border-b border-[#E6EFFC]">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EEF6FF] text-[#26328A]">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-[#141E46]">
              Área Administrativa
            </h2>
            <p className="text-xs text-[#5B6B95]">
              Controle oficial de lista de convidados
            </p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="admin-password-input"
              className="block text-xs font-medium text-[#4D5E8C] mb-1.5"
            >
              Senha de acesso
            </label>
            <input
              id="admin-password-input"
              type="password"
              required
              autoFocus
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="Digite a senha de administrador"
              className="w-full rounded-xl border border-[#C8DAF5] bg-[#FAFBFD] px-3.5 py-2.5 text-sm text-[#141E46] focus:border-[#2EA5DB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2EA5DB]/20"
            />
          </div>

          {loginError && (
            <div className="flex items-center gap-2 rounded-xl border border-[#F3C5D7] bg-[#FDF2F6] p-3 text-xs text-[#99154E]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-[#C8DAF5] px-4 py-2.5 text-sm font-medium text-[#4D5E8C] hover:bg-[#F3F8FF] transition-colors cursor-pointer"
              >
                Voltar ao convite
              </button>
            )}
            <button
              type="submit"
              disabled={verifying}
              className="flex-1 rounded-xl bg-[#26328A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1D2770] disabled:opacity-60 transition-colors cursor-pointer"
            >
              {verifying ? 'Verificando...' : 'Acessar painel'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#D8E5F8] bg-white p-5 sm:p-6 shadow-sm">
        <div>
          <p className="text-xs font-medium text-[#5B6B95]">
            Escola Infantil Caleidoscópio · Confraternização 20/12/2026
          </p>
          <h2 className="mt-1 font-display text-2xl font-bold text-[#141E46]">
            Painel de Controle de Convidados
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => loadRsvps(adminPassword)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#C8DAF5] bg-white px-3.5 py-2 text-xs font-semibold text-[#26328A] hover:bg-[#F3F8FF] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={rsvps.length === 0}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#2EA5DB] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#238FC1] disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Exportar CSV</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#C8DAF5] bg-white px-3.5 py-2 text-xs font-semibold text-[#26328A] hover:bg-[#F3F8FF] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Imprimir</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAdminPassword(null);
              onClose?.();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#F3D2DF] bg-[#FDF2F6] px-3.5 py-2 text-xs font-semibold text-[#B81D62] hover:bg-[#FBE6EE] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sair</span>
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 border border-[#D8E5F8] bg-white rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 sm:p-5 border-b lg:border-b-0 border-r border-[#E6EFFC]">
            <span className="text-xs text-[#5B6B95]">Total de Pessoas</span>
            <p className="mt-1 font-mono-num text-2xl font-bold text-[#26328A]">
              {stats.totalPeople}
            </p>
            <span className="text-[11px] text-[#5B6B95]">Confirmadas no evento</span>
          </div>
          <div className="p-4 sm:p-5 border-b lg:border-b-0 lg:border-r border-[#E6EFFC]">
            <span className="text-xs text-[#5B6B95]">Funcionários</span>
            <p className="mt-1 font-mono-num text-2xl font-bold text-[#141E46]">
              {stats.attendingEmployees}
            </p>
            <span className="text-[11px] text-[#5B6B95]">Presenças confirmadas</span>
          </div>
          <div className="p-4 sm:p-5 border-r border-[#E6EFFC]">
            <span className="text-xs text-[#5B6B95]">Cônjuges / Acomp.</span>
            <p className="mt-1 font-mono-num text-2xl font-bold text-[#B81D62]">
              {stats.totalSpouses + stats.totalSingleCompanions}
            </p>
            <span className="text-[11px] text-[#5B6B95]">
              {stats.totalSpouses} cônjuges · {stats.totalSingleCompanions} solt.
            </span>
          </div>
          <div className="p-4 sm:p-5 border-r border-[#E6EFFC]">
            <span className="text-xs text-[#5B6B95]">Filhos / Crianças</span>
            <p className="mt-1 font-mono-num text-2xl font-bold text-[#2EA5DB]">
              {stats.totalChildren}
            </p>
            <span className="text-[11px] text-[#5B6B95]">Informados na lista</span>
          </div>
          <div className="col-span-2 lg:col-span-1 p-4 sm:p-5 bg-[#F8FBFF]">
            <span className="text-xs text-[#5B6B95]">Não comparecerão</span>
            <p className="mt-1 font-mono-num text-2xl font-bold text-[#4D5E8C]">
              {stats.notAttendingEmployees}
            </p>
            <span className="text-[11px] text-[#5B6B95]">
              De {stats.totalResponses} respostas
            </span>
          </div>
        </div>
      )}

      {/* Search and Filter Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-[#EEF4FD] rounded-xl border border-[#DCE8FA]">
          {(
            [
              ['all', 'Todos'],
              ['attending', 'Confirmados'],
              ['family', 'Família'],
              ['single_plus_one', 'Solteiro +1'],
              ['alone', 'Individual'],
              ['not_attending', 'Ausentes'],
            ] as [FilterTab, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilterTab(key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                filterTab === key
                  ? 'bg-white text-[#26328A] shadow-sm'
                  : 'text-[#4D5E8C] hover:text-[#141E46]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7DA8]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar funcionário, acompanhante ou código..."
            className="w-full rounded-xl border border-[#C8DAF5] bg-white pl-9 pr-3.5 py-2 text-sm text-[#141E46] placeholder:text-[#8E9EC4] focus:border-[#2EA5DB] focus:outline-none"
          />
        </div>
      </div>

      {fetchError && (
        <div className="rounded-xl border border-[#F3C5D7] bg-[#FDF2F6] p-4 text-sm text-[#99154E]">
          {fetchError}
        </div>
      )}

      {/* Guest List Table */}
      <div className="overflow-hidden rounded-2xl border border-[#D8E5F8] bg-white shadow-sm">
        {loading && rsvps.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#5B6B95]">
            Carregando confirmações...
          </div>
        ) : filteredRsvps.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <p className="text-sm font-semibold text-[#141E46]">
              Nenhuma confirmação encontrada
            </p>
            <p className="text-xs text-[#5B6B95]">
              {rsvps.length === 0
                ? 'Assim que os funcionários confirmarem presença no convite, os nomes aparecerão aqui.'
                : 'Tente alterar o filtro ou os termos da busca.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E6EFFC] bg-[#F7FAFF] text-xs font-semibold text-[#4D5E8C]">
                  <th className="py-3.5 px-4">Código</th>
                  <th className="py-3.5 px-4">Funcionário(a)</th>
                  <th className="py-3.5 px-4">Situação</th>
                  <th className="py-3.5 px-4">Acompanhantes e Grau de Parentesco</th>
                  <th className="py-3.5 px-4 text-right">Pessoas</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF4FD] text-sm">
                {filteredRsvps.map((r) => {
                  const total =
                    r.attendance === 'attending' ? 1 + r.companions.length : 0;
                  return (
                    <tr key={r.id} className="hover:bg-[#FAFBFD] align-top">
                      <td className="py-4 px-4 font-mono-num text-xs font-semibold text-[#26328A] whitespace-nowrap">
                        {r.code}
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-semibold text-[#141E46]">
                          {r.employeeName}
                        </p>
                        {(r.employeeRole || r.phone) && (
                          <p className="mt-0.5 text-xs text-[#5B6B95]">
                            {[r.employeeRole, r.phone].filter(Boolean).join(' · ')}
                          </p>
                        )}
                        {r.notes && (
                          <p className="mt-1 text-xs text-[#8E5B15]">
                            Obs.: {r.notes}
                          </p>
                        )}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <p
                          className={`text-xs font-semibold ${
                            r.attendance === 'attending'
                              ? 'text-[#3F7A14]'
                              : 'text-[#B81D62]'
                          }`}
                        >
                          {r.attendance === 'attending'
                            ? 'Confirmado'
                            : 'Não comparecerá'}
                        </p>
                        <p className="mt-0.5 text-xs text-[#5B6B95]">
                          {r.attendance === 'attending'
                            ? GUEST_TYPE_LABELS[r.guestType]
                            : 'Ausência'}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        {r.attendance === 'not_attending' ? (
                          <span className="text-xs text-[#8E9EC4]">—</span>
                        ) : r.companions.length === 0 ? (
                          <span className="text-xs text-[#5B6B95]">
                            Sem acompanhantes
                          </span>
                        ) : (
                          <ul className="space-y-1">
                            {r.companions.map((c) => (
                              <li key={c.id} className="text-xs text-[#141E46]">
                                <span className="font-medium">{c.name}</span>{' '}
                                <span className="text-[#5B6B95]">
                                  · {c.relationship}
                                  {c.age ? ` (${c.age})` : ''}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right font-mono-num font-semibold text-[#141E46] whitespace-nowrap">
                        {total}
                      </td>
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openQuickNoteModal(r)}
                            title="Adicionar ou editar observação"
                            className="inline-flex items-center gap-1 rounded-lg border border-[#C8DAF5] bg-white px-2.5 py-1.5 text-xs font-medium text-[#2EA5DB] hover:bg-[#F3F8FF] transition-colors cursor-pointer"
                          >
                            <MessageSquareText className="h-3.5 w-3.5" />
                            <span>Observação</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(r)}
                            title="Editar confirmação"
                            className="inline-flex items-center gap-1 rounded-lg border border-[#C8DAF5] bg-white px-2.5 py-1.5 text-xs font-medium text-[#26328A] hover:bg-[#F3F8FF] transition-colors cursor-pointer"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            <span>Editar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => requestDeletePasswordConfirmation(r)}
                            title="Excluir confirmação"
                            className="inline-flex items-center gap-1 rounded-lg border border-[#F3D2DF] bg-white px-2.5 py-1.5 text-xs font-medium text-[#B81D62] hover:bg-[#FDF2F6] transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Excluir</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingRecord && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-[#0F172A]/50 p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-modal-title"
        >
          <div className="w-full max-w-2xl rounded-2xl border border-[#D8E5F8] bg-white p-6 shadow-xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#E6EFFC]">
              <div>
                <p className="text-xs font-mono-num text-[#5B6B95]">
                  {editingRecord.code}
                </p>
                <h3
                  id="edit-modal-title"
                  className="font-display text-xl font-bold text-[#141E46]"
                >
                  Editar confirmação de convidado
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="rounded-lg p-1.5 text-[#5B6B95] hover:bg-[#F3F8FF] cursor-pointer"
                aria-label="Fechar edição"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={requestEditPasswordConfirmation}
              className="mt-5 space-y-5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-[#4D5E8C] mb-1">
                    Nome do(a) funcionário(a) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editEmployeeName}
                    onChange={(e) => setEditEmployeeName(e.target.value)}
                    className="w-full rounded-xl border border-[#C8DAF5] px-3.5 py-2 text-sm text-[#141E46]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4D5E8C] mb-1">
                    Cargo / Turma
                  </label>
                  <input
                    type="text"
                    value={editEmployeeRole}
                    onChange={(e) => setEditEmployeeRole(e.target.value)}
                    className="w-full rounded-xl border border-[#C8DAF5] px-3.5 py-2 text-sm text-[#141E46]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4D5E8C] mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full rounded-xl border border-[#C8DAF5] px-3.5 py-2 text-sm text-[#141E46]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#4D5E8C] mb-1">
                    Presença
                  </label>
                  <select
                    value={editAttendance}
                    onChange={(e) =>
                      setEditAttendance(e.target.value as AttendanceStatus)
                    }
                    className="w-full rounded-xl border border-[#C8DAF5] bg-white px-3.5 py-2 text-sm text-[#141E46]"
                  >
                    <option value="attending">Confirmado (vai participar)</option>
                    <option value="not_attending">Não comparecerá</option>
                  </select>
                </div>

                {editAttendance === 'attending' && (
                  <div>
                    <label className="block text-xs font-medium text-[#4D5E8C] mb-1">
                      Modalidade de convite
                    </label>
                    <select
                      value={editGuestType}
                      onChange={(e) =>
                        handleEditGuestTypeChange(e.target.value as GuestType)
                      }
                      className="w-full rounded-xl border border-[#C8DAF5] bg-white px-3.5 py-2 text-sm text-[#141E46]"
                    >
                      <option value="alone">Vai sozinho(a)</option>
                      <option value="family">Família (Cônjuge e Filhos)</option>
                      <option value="single_plus_one">
                        Solteiro(a) + 1 Acompanhante
                      </option>
                    </select>
                  </div>
                )}
              </div>

              {editAttendance === 'attending' && editGuestType !== 'alone' && (
                <div className="space-y-3 rounded-xl border border-[#E2ECFC] bg-[#F9FBFF] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#141E46]">
                      Acompanhantes ({editCompanions.length})
                    </span>
                    {editGuestType === 'family' ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={editCompanions.some(
                            (c) => c.relationship === 'Cônjuge',
                          )}
                          onClick={() =>
                            setEditCompanions((prev) => [
                              {id: createId(), name: '', relationship: 'Cônjuge'},
                              ...prev,
                            ])
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-[#C8DAF5] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#26328A] disabled:opacity-45 cursor-pointer"
                        >
                          <Heart className="h-3 w-3 text-[#B81D62]" />
                          <span>+ Cônjuge</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setEditCompanions((prev) => [
                              ...prev,
                              {
                                id: createId(),
                                name: '',
                                relationship: 'Filho(a)',
                                age: '',
                              },
                            ])
                          }
                          className="inline-flex items-center gap-1 rounded-lg bg-[#2EA5DB] px-2.5 py-1.5 text-xs font-semibold text-white cursor-pointer"
                        >
                          <Baby className="h-3 w-3" />
                          <span>+ Filho(a)</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={editCompanions.length >= 1}
                        onClick={() =>
                          setEditCompanions([
                            {
                              id: createId(),
                              name: '',
                              relationship: 'Acompanhante',
                            },
                          ])
                        }
                        className="inline-flex items-center gap-1 rounded-lg bg-[#2EA5DB] px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-45 cursor-pointer"
                      >
                        <UserPlus className="h-3 w-3" />
                        <span>+ Acompanhante</span>
                      </button>
                    )}
                  </div>

                  {editCompanions.map((comp) => (
                    <div
                      key={comp.id}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center rounded-lg border border-[#DCE8FA] bg-white p-2.5"
                    >
                      <input
                        type="text"
                        required
                        value={comp.name}
                        onChange={(e) =>
                          setEditCompanions((prev) =>
                            prev.map((item) =>
                              item.id === comp.id
                                ? {...item, name: e.target.value}
                                : item,
                            ),
                          )
                        }
                        placeholder="Nome do acompanhante"
                        className="sm:col-span-5 rounded-lg border border-[#C8DAF5] px-2.5 py-1.5 text-xs text-[#141E46]"
                      />
                      {editGuestType === 'family' ? (
                        <input
                          type="text"
                          readOnly
                          value={comp.relationship}
                          className="sm:col-span-3 rounded-lg border border-[#E6EFFC] bg-[#F5F9FF] px-2.5 py-1.5 text-xs font-medium text-[#26328A]"
                        />
                      ) : (
                        <select
                          value={comp.relationship}
                          onChange={(e) =>
                            setEditCompanions((prev) =>
                              prev.map((item) =>
                                item.id === comp.id
                                  ? {
                                      ...item,
                                      relationship:
                                        e.target.value as SingleCompanionRelationship,
                                    }
                                  : item,
                              ),
                            )
                          }
                          className="sm:col-span-4 rounded-lg border border-[#C8DAF5] bg-white px-2.5 py-1.5 text-xs text-[#141E46]"
                        >
                          {SINGLE_COMPANION_RELATIONSHIPS.map((rel) => (
                            <option key={rel} value={rel}>
                              {rel}
                            </option>
                          ))}
                        </select>
                      )}
                      {comp.relationship === 'Filho(a)' ? (
                        <input
                          type="text"
                          value={comp.age || ''}
                          onChange={(e) =>
                            setEditCompanions((prev) =>
                              prev.map((item) =>
                                item.id === comp.id
                                  ? {...item, age: e.target.value}
                                  : item,
                              ),
                            )
                          }
                          placeholder="Idade"
                          className="sm:col-span-3 rounded-lg border border-[#C8DAF5] px-2.5 py-1.5 text-xs text-[#141E46]"
                        />
                      ) : (
                        <div className="hidden sm:block sm:col-span-3" />
                      )}
                      <div className="sm:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            setEditCompanions((prev) =>
                              prev.filter((item) => item.id !== comp.id),
                            )
                          }
                          className="rounded-lg p-1.5 text-[#B81D62] hover:bg-[#FDF2F6] cursor-pointer"
                          aria-label="Remover"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {editCompanions.length === 0 && (
                    <p className="text-xs text-[#5B6B95]">
                      Nenhum acompanhante adicionado.
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#4D5E8C] mb-1">
                  Observações
                </label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full rounded-xl border border-[#C8DAF5] px-3.5 py-2 text-sm text-[#141E46]"
                />
              </div>

              {editError && (
                <div className="flex items-center gap-2 rounded-xl border border-[#F3C5D7] bg-[#FDF2F6] p-3 text-xs text-[#99154E]">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E6EFFC]">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="rounded-xl border border-[#C8DAF5] px-4 py-2 text-sm font-medium text-[#4D5E8C] hover:bg-[#F3F8FF] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#26328A] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1D2770] cursor-pointer"
                >
                  <Plus className="h-4 w-4 rotate-45 hidden" />
                  <span>Salvar alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Security Password Confirmation Modal for Edit/Delete */}
      {pendingAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-pwd-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-[#D8E5F8] bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FDF2F6] text-[#B81D62]">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h3
                  id="confirm-pwd-title"
                  className="font-display text-lg font-bold text-[#141E46]"
                >
                  {pendingAction.type === 'delete'
                    ? 'Confirmar exclusão com senha'
                    : 'Confirmar edição com senha'}
                </h3>
                <p className="mt-1 text-xs text-[#4D5E8C] leading-relaxed">
                  {pendingAction.type === 'delete'
                    ? `Tem certeza que deseja excluir o registro de "${pendingAction.record.employeeName}" (${pendingAction.record.code})? Esta ação não pode ser desfeita.`
                    : 'Para aplicar as alterações nesta confirmação, digite novamente a senha de administrador.'}
                </p>
              </div>
            </div>

            <form onSubmit={executeConfirmedAction} className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="confirm-action-password"
                  className="block text-xs font-medium text-[#4D5E8C] mb-1.5"
                >
                  Senha de confirmação *
                </label>
                <input
                  id="confirm-action-password"
                  type="password"
                  required
                  autoFocus
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  placeholder="Digite a senha de administrador"
                  className="w-full rounded-xl border border-[#C8DAF5] bg-[#FAFBFD] px-3.5 py-2.5 text-sm text-[#141E46] focus:border-[#2EA5DB] focus:bg-white focus:outline-none"
                />
              </div>

              {confirmPasswordError && (
                <div className="flex items-center gap-2 rounded-xl border border-[#F3C5D7] bg-[#FDF2F6] p-3 text-xs text-[#99154E]">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{confirmPasswordError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setPendingAction(null)}
                  className="rounded-xl border border-[#C8DAF5] px-4 py-2 text-sm font-medium text-[#4D5E8C] hover:bg-[#F3F8FF] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={confirmSubmitting}
                  className={`rounded-xl px-5 py-2 text-sm font-semibold text-white disabled:opacity-60 transition-colors cursor-pointer ${
                    pendingAction.type === 'delete'
                      ? 'bg-[#B81D62] hover:bg-[#9B1652]'
                      : 'bg-[#26328A] hover:bg-[#1D2770]'
                  }`}
                >
                  {confirmSubmitting
                    ? 'Confirmando...'
                    : pendingAction.type === 'delete'
                    ? 'Confirmar exclusão'
                    : 'Confirmar e salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Quick Observation Modal */}
      {noteModalRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-note-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-[#D8E5F8] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#E6EFFC]">
              <div>
                <p className="text-xs font-mono-num text-[#5B6B95]">
                  {noteModalRecord.code} · {noteModalRecord.employeeName}
                </p>
                <h3
                  id="quick-note-title"
                  className="mt-0.5 font-display text-lg font-bold text-[#141E46]"
                >
                  Observação do(a) funcionário(a)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setNoteModalRecord(null)}
                className="rounded-lg p-1.5 text-[#5B6B95] hover:bg-[#F3F8FF] cursor-pointer"
                aria-label="Fechar observação"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickNote} className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="admin-quick-note"
                  className="block text-xs font-medium text-[#4D5E8C] mb-1.5"
                >
                  Observação ou anotação interna
                </label>
                <textarea
                  id="admin-quick-note"
                  rows={3}
                  maxLength={300}
                  autoFocus
                  value={quickNoteText}
                  onChange={(e) => setQuickNoteText(e.target.value)}
                  placeholder="Digite uma observação para este(a) funcionário(a)..."
                  className="w-full rounded-xl border border-[#C8DAF5] bg-[#FAFBFD] px-3.5 py-2.5 text-sm text-[#141E46] focus:border-[#2EA5DB] focus:bg-white focus:outline-none"
                />
              </div>

              {quickNoteError && (
                <div className="flex items-center gap-2 rounded-xl border border-[#F3C5D7] bg-[#FDF2F6] p-3 text-xs text-[#99154E]">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{quickNoteError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setNoteModalRecord(null)}
                  className="rounded-xl border border-[#C8DAF5] px-4 py-2 text-sm font-medium text-[#4D5E8C] hover:bg-[#F3F8FF] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={quickNoteSaving}
                  className="rounded-xl bg-[#26328A] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1D2770] disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {quickNoteSaving ? 'Salvando...' : 'Salvar observação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
