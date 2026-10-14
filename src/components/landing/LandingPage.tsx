import React from 'react';
import { 
  Compass, 
  Flag, 
  Building2, 
  Users2, 
  GraduationCap, 
  QrCode, 
  Smartphone, 
  Trophy, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  MapPin, 
  Sparkles,
  Zap,
  UserPlus
} from 'lucide-react';
import { ActiveView } from '../common/Navbar';
import { RegistrationDemoForm } from './RegistrationDemoForm';

interface LandingPageProps {
  onSelectView: (view: ActiveView) => void;
  onShowToast: (msg: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSelectView,
  onShowToast,
}) => {
  const useCases = [
    {
      id: 'orienteering',
      title: 'Orienteering Berbasis Checkpoint',
      icon: <Compass className="w-6 h-6 text-orange-500" />,
      desc: 'Navigasi darat, pencarian titik kontrol rahasia dengan kompas dan azimuth, penghitungan waktu tempuh presisi di alam terbuka.',
      highlight: 'Titik Pos & Kompas',
      tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      id: 'amazing_race',
      title: 'Amazing Race Event Korporat',
      icon: <Building2 className="w-6 h-6 text-orange-500" />,
      desc: 'Simulasi tantangan multi-pos bertema strategi bisnis, pembagian rute estafet dinamis, serta perlombaan kecepatan dan kecerdikan tim.',
      highlight: 'Sinergi Perusahaan',
      tagColor: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      id: 'outbound',
      title: 'Outbound & Team Building',
      icon: <Users2 className="w-6 h-6 text-orange-500" />,
      desc: 'Mendukung permainan kekompakan kelompok, tantangan fisik terukur, verifikasi fasilitator lapangan, dan pengumpulan poin kolektif.',
      highlight: 'Kekompakan Kelompok',
      tagColor: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      id: 'school',
      title: 'Permainan Sekolah, Kampus & Komunitas',
      icon: <GraduationCap className="w-6 h-6 text-orange-500" />,
      desc: 'Aktivitas orientasi masa bimbingan, petualangan edukasi sains & sejarah, reli kota santai, hingga jambore kepanduan.',
      highlight: 'Edukasi & Eksplorasi',
      tagColor: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      id: 'indoor_qr',
      title: 'Permainan Indoor Menggunakan QR Code',
      icon: <QrCode className="w-6 h-6 text-orange-500" />,
      desc: 'Perburuan harta karun di dalam gedung mall, museum, pameran expo, atau ruang kelas dengan scan barcode tanpa membutuhkan sinyal GPS.',
      highlight: 'Bebas Kendala Sinyal GPS',
      tagColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    },
  ];

  const roles = [
    {
      title: 'Organizer / Admin',
      subtitle: 'Pengelola Acara',
      desc: 'Membuat event, menyusun rute dan pos checkpoint, mengatur challenge, memantau pergerakan tim secara terpusat di laptop.',
      actionLabel: 'Buka Dashboard Organizer',
      onClick: () => onSelectView('organizer'),
      icon: <ShieldCheck className="w-6 h-6 text-blue-600" />,
      bg: 'bg-blue-50/70 border-blue-200',
    },
    {
      title: 'Peserta & Tim',
      subtitle: 'Pemain di Lapangan (Mobile HP)',
      desc: 'Melihat petunjuk pos berikutnya, scan QR pos, mengunggah foto tantangan tim, dan memantau peringkat secara langsung dari HP.',
      actionLabel: 'Coba Tampilan Peserta (HP)',
      onClick: () => onSelectView('participant'),
      icon: <Smartphone className="w-6 h-6 text-orange-600" />,
      bg: 'bg-orange-50/70 border-orange-200',
    },
    {
      title: 'Juri & Fasilitator Pos',
      subtitle: 'Petugas Validasi Pos',
      desc: 'Menjaga pos checkpoint, memvalidasi kedatangan tim, memeriksa tugas fisik atau foto, dan memberikan nilai penilaian resmi.',
      actionLabel: 'Buka Dashboard Juri',
      onClick: () => onSelectView('judge'),
      icon: <CheckCircle2 className="w-6 h-6 text-emerald-600" />,
      bg: 'bg-emerald-50/70 border-emerald-200',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0b192c] via-[#0f233d] to-slate-900 text-white pt-14 pb-20 px-4 sm:px-6 lg:px-8">
        {/* Subtle geometric grid background pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"></div>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-orange-400 text-xs font-semibold shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            <span>Fondasi & Tampilan Awal (Tahap 1 Siap Direview)</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Orienteering & <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">Amazing Race</span> Platform
          </h1>

          <p className="max-w-3xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            Satu sistem terpadu untuk merancang, mengelola, dan memainkan petualangan checkpoint, tantangan outbound, dan perlombaan QR code luar ruang maupun dalam gedung.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <button
              onClick={() => {
                const el = document.getElementById('registration-section');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="px-6 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-500/30 flex items-center gap-2 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Daftar Tim (Demo)</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </button>

            <button
              onClick={() => onSelectView('organizer')}
              className="px-5 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-bold text-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <Building2 className="w-4 h-4" />
              <span>Dashboard Organizer</span>
            </button>

            <button
              onClick={() => onSelectView('participant')}
              className="px-5 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-bold text-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <Smartphone className="w-4 h-4 text-orange-400" />
              <span>Mode HP Peserta</span>
            </button>

            <button
              onClick={() => onSelectView('leaderboard')}
              className="px-5 py-3.5 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-200 border border-slate-700/80 font-semibold text-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Papan Skor</span>
            </button>
          </div>

          {/* Quick Stats Pill */}
          <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/60 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-orange-400">5 Ragam</div>
              <div className="text-xs text-slate-300 mt-0.5">Format Acara</div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/60 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-white">3 Peran</div>
              <div className="text-xs text-slate-300 mt-0.5">Admin, Peserta, Juri</div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/60 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-emerald-400">100% Mobile</div>
              <div className="text-xs text-slate-300 mt-0.5">Ramah HP Peserta</div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/60 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-amber-300">Live Sync</div>
              <div className="text-xs text-slate-300 mt-0.5">Papan Peringkat</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {/* Banner Penanda Pemula */}
        <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm sm:text-base">
                Tahap 1 Selesai: Struktur Antarmuka & Alur Utama Siap Diuji
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Silakan coba berpindah peran menggunakan kartu di bawah atau menu navigasi di atas.
              </p>
            </div>
          </div>
          <button
            onClick={() => onShowToast('Catatan: Tahap 1 berfokus pada desain dan layout. Tombol form atau simpan data akan diprogram di Tahap 2 saat backend diintegrasikan.')}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
          >
            Info Alur Bertahap
          </button>
        </div>

        {/* Section 1: Tiga Peran Pengguna (Role Switcher Quick Access) */}
        <section className="mt-12">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-2xl font-bold text-[#0b192c]">
              Dirancang Khusus untuk Tiga Jenis Pengguna
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Setiap pihak memiliki antarmuka yang disesuaikan dengan kebutuhan praktisnya di lokasi kegiatan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {roles.map((r, idx) => (
              <div 
                key={idx}
                className={`rounded-2xl border p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all bg-white hover:-translate-y-1 ${r.bg}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center border border-slate-200">
                      {r.icon}
                    </div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {r.subtitle}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{r.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                    {r.desc}
                  </p>
                </div>
                <button
                  onClick={r.onClick}
                  className="w-full py-2.5 px-4 bg-[#0b192c] hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <span>{r.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: 5 Tujuan Aplikasi (Use Cases) */}
        <section className="mt-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                Fleksibilitas Penggunaan
              </span>
              <h2 className="text-2xl font-bold text-[#0b192c] mt-1">
                Mendukung 5 Ragam Permainan & Kegiatan
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md">
              Mulai dari orientasi kompas di hutan, games kekompakan kantor, hingga penjelajahan perpustakaan kampus.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {useCases.map((uc) => (
              <div 
                key={uc.id} 
                className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:border-orange-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
                      {uc.icon}
                    </div>
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${uc.tagColor}`}>
                      {uc.highlight}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-2">{uc.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {uc.desc}
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Status Demo:</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Tersedia di Contoh Event
                  </span>
                </div>
              </div>
            ))}

            {/* Showcase Quick Card */}
            <div className="bg-gradient-to-br from-[#0b192c] to-slate-900 rounded-2xl p-6 text-white shadow-md flex flex-col justify-between border border-slate-800">
              <div>
                <div className="w-12 h-12 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center mb-4 border border-orange-500/30">
                  <MapPin className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-white text-base mb-2">Lihat Contoh Event Langsung</h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  Buka data contoh Amazing Race Bank Mandiri atau Kejuaraan Orienteering Tahura untuk melihat pos dan tim.
                </p>
              </div>
              <button
                onClick={() => onSelectView('event-list')}
                className="w-full py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-orange-500/20"
              >
                <span>Buka Daftar Event</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>

        {/* Section 3: Cara Kerja Sederhana untuk Pemula */}
        <section className="mt-16 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
              Kemudahan Penggunaan
            </span>
            <h2 className="text-2xl font-bold text-[#0b192c] mt-1">
              3 Langkah Sederhana Menjalankan Acara
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="w-8 h-8 rounded-full bg-[#0b192c] text-white font-bold text-xs flex items-center justify-center mb-3">
                1
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1.5">Organizer Atur Rute & Pos</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tentukan nama checkpoint, koordinat lokasi, teka-teki petunjuk, atau cetak kode QR pos langsung dari dashboard.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="w-8 h-8 rounded-full bg-orange-500 text-white font-bold text-xs flex items-center justify-center mb-3">
                2
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1.5">Peserta Bertualang via HP</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tim memecahkan teka-teki, mencari pos fisik, scan QR code pos dengan kamera HP, dan mengunggah foto tugas regu.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center mb-3">
                3
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1.5">Juri Validasi & Leaderboard</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Fasilitator pos memberikan penilaian secara instan, dan papan skor leaderboard terupdate otomatis di layar utama panggung.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Formulir Pendaftaran Peserta (Demo Input) */}
        <div className="mt-16">
          <RegistrationDemoForm 
            onShowToast={onShowToast}
            onRegisteredSuccess={(_teamData) => {
              onSelectView('participant');
            }}
          />
        </div>
      </div>
    </div>
  );
};
