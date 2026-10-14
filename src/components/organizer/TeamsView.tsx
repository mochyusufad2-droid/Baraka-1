import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Key, 
  Phone, 
  Award, 
  CheckCircle2, 
  ShieldAlert,
  ChevronRight,
  Sparkles,
  Copy,
  X,
  Mail,
  UserCheck,
  Printer,
  Pencil,
  Trash2,
  Filter
} from 'lucide-react';
import { useRace } from '../../context/RaceContext';
import { Team } from '../../types';
import { EditTeamModal } from './EditTeamModal';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import { BatchBibPrintModal } from './BatchBibPrintModal';

interface TeamsViewProps {
  onShowToast: (msg: string) => void;
  onSelectTeamForParticipantPreview: (teamId: string) => void;
}

export const TeamsView: React.FC<TeamsViewProps> = ({
  onShowToast,
  onSelectTeamForParticipantPreview,
}) => {
  const { teams, registerTeam, updateTeam, deleteTeam, events, selectedEventId } = useRace();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);
  const [batchBibModalOpen, setBatchBibModalOpen] = useState(false);

  // Form State for new team
  const [teamName, setTeamName] = useState('');
  const [category, setCategory] = useState('Korporat / Perusahaan');
  const [leaderName, setLeaderName] = useState('');
  const [leaderPhone, setLeaderPhone] = useState('');
  const [leaderEmail, setLeaderEmail] = useState('');
  const [member1, setMember1] = useState('');
  const [member2, setMember2] = useState('');
  const [member3, setMember3] = useState('');

  const currentEvent = events.find((e) => e.id === selectedEventId) || events[0];

  const handleCreateTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() || !leaderName.trim() || !leaderPhone.trim()) {
      onShowToast('Mohon lengkapi Nama Tim, Nama Ketua, dan No. WhatsApp.');
      return;
    }

    const membersList: string[] = [];
    if (member1.trim()) membersList.push(member1.trim());
    if (member2.trim()) membersList.push(member2.trim());
    if (member3.trim()) membersList.push(member3.trim());

    const result = registerTeam({
      eventId: selectedEventId || 'evt-01',
      name: teamName.trim(),
      category,
      leaderName: leaderName.trim(),
      leaderPhone: leaderPhone.trim() || undefined,
      leaderEmail: leaderEmail.trim() || undefined,
      members: membersList,
    });

    onShowToast(`Tim "${result.team.name}" berhasil ditambahkan! BIB: ${result.bibNumber}, PIN: ${result.pinCode}`);
    
    // Reset Form & Close Modal
    setTeamName('');
    setLeaderName('');
    setLeaderPhone('');
    setLeaderEmail('');
    setMember1('');
    setMember2('');
    setMember3('');
    setIsAddModalOpen(false);
  };

  const handleSaveEditTeam = (teamId: string, updatedData: Partial<Team>) => {
    updateTeam(teamId, updatedData);
    onShowToast(`Data Tim "${updatedData.name || 'Peserta'}" berhasil diperbarui!`);
  };

  const handleConfirmDeleteTeam = () => {
    if (deletingTeam) {
      const name = deletingTeam.name;
      deleteTeam(deletingTeam.id);
      onShowToast(`Tim "${name}" berhasil dihapus dari perlombaan.`);
      setDeletingTeam(null);
    }
  };

  const filteredTeams = teams.filter((t) => {
    const matchesSearch = 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.bibNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0b192c]">Tim & Peserta</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              {teams.length} TIM TERDAFTAR (LIVE)
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola regu, ubah data & poin tim, cetak nomor dada (BIB) massal, serta pantau progres perlombaan.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <button
            onClick={() => setBatchBibModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer transition-all"
            title="Buka panel cetak nomor dada BIB dan kartu peserta A4"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Semua Nomor BIB ({teams.length} Tim)</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-orange-500/20 flex items-center gap-2 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Daftarkan Tim Baru</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari tim, divisi, nomor BIB..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 shrink-0"
          >
            <option value="all">Semua Kategori</option>
            <option value="Korporat / Perusahaan">Korporat / Perusahaan</option>
            <option value="Divisi Komersial">Divisi Komersial</option>
            <option value="Divisi Operasional & IT">Divisi Operasional & IT</option>
            <option value="Divisi Keuangan & Risiko">Divisi Keuangan & Risiko</option>
            <option value="Umum & Komunitas">Umum & Komunitas</option>
            <option value="Pelajar & Mahasiswa">Pelajar & Mahasiswa</option>
          </select>
        </div>

        <span className="text-xs text-slate-500 hidden sm:block shrink-0">
          Menampilkan <strong>{filteredTeams.length}</strong> dari {teams.length} tim
        </span>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTeams.map((team) => (
          <div 
            key={team.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-orange-300 transition-all p-5 flex flex-col justify-between group"
          >
            <div>
              {/* Header card with action buttons */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-3.5 h-3.5 rounded-full shrink-0 ${team.color}`} />
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-slate-900 text-base truncate">{team.name}</h3>
                    <p className="text-xs text-slate-500 truncate">{team.category}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                    {team.bibNumber}
                  </span>
                  <button
                    onClick={() => setEditingTeam(team)}
                    className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                    title="Edit tim & sesuaikan nilai/personel"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingTeam(team)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Hapus tim dari perlombaan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Status and Points */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Total Skor:</span>
                  <span className="font-extrabold text-orange-600 text-sm font-mono">{team.totalScore} Poin</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Kemajuan Pos:</span>
                  <span className="font-bold text-slate-800">{team.checkpointsCompleted}/{team.totalCheckpoints} Selesai</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Pos Terakhir:</span>
                  <span className="text-slate-700 font-medium truncate max-w-[150px]">{team.lastPosName}</span>
                </div>
                {(team.bonusPoints > 0 || team.penaltyPoints > 0) && (
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 text-[11px]">
                    <span className="text-slate-500">Bonus/Penalti:</span>
                    <span className="font-mono font-semibold">
                      {team.bonusPoints > 0 && <span className="text-emerald-600">+{team.bonusPoints} </span>}
                      {team.penaltyPoints > 0 && <span className="text-red-600">-{team.penaltyPoints}</span>}
                    </span>
                  </div>
                )}
              </div>

              {/* Members */}
              <div className="space-y-1 mb-4">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Anggota Regu ({team.members.length}):
                </span>
                <div className="space-y-1 pt-1 max-h-24 overflow-y-auto pr-1">
                  {team.members.map((m, idx) => (
                    <div key={idx} className="text-xs text-slate-600 flex items-center justify-between">
                      <span className="font-medium text-slate-800 truncate">{m.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 shrink-0">{m.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions Toolbar */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono text-slate-500">
                  PIN: <strong className="text-slate-800">{team.pinCode}</strong>
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`BIB: ${team.bibNumber} | PIN: ${team.pinCode}`);
                    onShowToast(`Akses login Tim ${team.name} (BIB: ${team.bibNumber}, PIN: ${team.pinCode}) disalin!`);
                  }}
                  title="Salin nomor BIB dan PIN"
                  className="p-1 text-slate-400 hover:text-orange-500 rounded transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onSelectTeamForParticipantPreview(team.id)}
                  className="px-3 py-1.5 bg-[#0b192c] hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>Buka di HP</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Tambah Tim Baru (Panitia) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#0b192c] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Daftarkan Tim Baru (Panitia)</h3>
                  <p className="text-xs text-slate-300">Nomor BIB dan PIN masuk akan dibuat otomatis oleh sistem.</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTeamSubmit} className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Tim / Regu *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Tim Harimau Sumatra"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Kategori / Divisi</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="Korporat / Perusahaan">Korporat / Perusahaan</option>
                  <option value="Divisi Komersial">Divisi Komersial</option>
                  <option value="Divisi Operasional & IT">Divisi Operasional & IT</option>
                  <option value="Divisi Keuangan & Risiko">Divisi Keuangan & Risiko</option>
                  <option value="Umum & Komunitas">Umum & Komunitas</option>
                  <option value="Pelajar & Mahasiswa">Pelajar & Mahasiswa</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Ketua Tim *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama lengkap ketua"
                    value={leaderName}
                    onChange={(e) => setLeaderName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    No. WhatsApp / HP <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0812xxxxxxx"
                    value={leaderPhone}
                    onChange={(e) => setLeaderPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Email Penanggung Jawab <span className="text-slate-400 font-normal">(Opsional)</span>
                </label>
                <input
                  type="email"
                  placeholder="email@perusahaan.com (opsional)"
                  value={leaderEmail}
                  onChange={(e) => setLeaderEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="font-bold text-slate-700 block mb-1">Anggota Tim Tambahan (Opsional)</label>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Anggota 1"
                    value={member1}
                    onChange={(e) => setMember1(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Anggota 2"
                    value={member2}
                    onChange={(e) => setMember2(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Anggota 3"
                    value={member3}
                    onChange={(e) => setMember3(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 cursor-pointer"
                >
                  Simpan & Buat Akses Tim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Tim */}
      <EditTeamModal
        isOpen={!!editingTeam}
        team={editingTeam}
        onClose={() => setEditingTeam(null)}
        onSave={handleSaveEditTeam}
      />

      {/* Modal Konfirmasi Hapus Tim */}
      <ConfirmDeleteModal
        isOpen={!!deletingTeam}
        title="Hapus Tim Ini?"
        message={`Apakah Anda yakin ingin menghapus tim "${deletingTeam?.name}" (BIB ${deletingTeam?.bibNumber}) dari perlombaan? Sesi login tim ini akan ditutup.`}
        itemName={deletingTeam?.name}
        itemType="tim"
        confirmText="Ya, Hapus Tim"
        onConfirm={handleConfirmDeleteTeam}
        onCancel={() => setDeletingTeam(null)}
      />

      {/* Modal Cetak Semua Nomor BIB Massal */}
      <BatchBibPrintModal
        isOpen={batchBibModalOpen}
        onClose={() => setBatchBibModalOpen(false)}
        teams={teams}
        currentEvent={currentEvent}
        onShowToast={onShowToast}
      />
    </div>
  );
};
