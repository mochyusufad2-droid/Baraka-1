import React, { useState } from 'react';
import { Navbar, ActiveView } from './components/common/Navbar';
import { DemoNoticeBanner, RoadmapModal } from './components/common/DemoNoticeBanner';
import { DemoToast } from './components/common/DemoToast';
import { LandingPage } from './components/landing/LandingPage';
import { OrganizerLayout } from './components/organizer/OrganizerLayout';
import { EventListView } from './components/organizer/EventListView';
import { EventDetailView } from './components/organizer/EventDetailView';
import { ParticipantView } from './components/participant/ParticipantView';
import { JudgeDashboardView } from './components/judge/JudgeDashboardView';
import { LeaderboardView } from './components/leaderboard/LeaderboardView';
import { OrganizerMenu } from './types';
import { Compass, ShieldCheck, Smartphone, UserCheck, Trophy } from 'lucide-react';
import { RaceProvider, useRace } from './context/RaceContext';

function AppContent() {
  const [currentView, setCurrentView] = useState<ActiveView>('landing');
  const [organizerSubMenu, setOrganizerSubMenu] = useState<OrganizerMenu>('dashboard');
  const [selectedEventId, setSelectedEventId] = useState<string>('evt-01');
  const [isViewingEventDetail, setIsViewingEventDetail] = useState<boolean>(false);
  const { setActiveTeamId } = useRace();

  // Modal & Toast States
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [roadmapModalOpen, setRoadmapModalOpen] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  const handleOpenEventDetail = (eventId: string) => {
    setSelectedEventId(eventId);
    setCurrentView('event-detail');
  };

  const handleSelectTeamForParticipant = (teamId: string) => {
    setActiveTeamId(teamId);
    setCurrentView('participant');
    showToast(`Beralih ke mode HP untuk Tim terpilih.`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* 1. Notice Banner: Stage 2 Active State & Features */}
      <DemoNoticeBanner onOpenRoadmapModal={() => setRoadmapModalOpen(true)} />

      {/* 2. Top Navigation Bar */}
      <Navbar
        currentView={currentView}
        onSelectView={(view) => {
          if (view === 'event-detail') {
            setSelectedEventId('evt-01');
          }
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onShowToast={showToast}
        activeEventId={selectedEventId}
      />

      {/* 3. Main Body Views Routing */}
      <main className="flex-1">
        {/* VIEW 1: LANDING PAGE */}
        {currentView === 'landing' && (
          <LandingPage
            onSelectView={(view) => {
              setCurrentView(view);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onShowToast={showToast}
          />
        )}

        {/* VIEW 2: ORGANIZER DASHBOARD (Houses 8 submenus: Dashboard, Event, Checkpoint, Tim, Challenge, Penilaian, Hasil, Pengaturan) */}
        {currentView === 'organizer' && (
          <OrganizerLayout
            currentSubMenu={organizerSubMenu}
            onSelectSubMenu={(menu) => setOrganizerSubMenu(menu)}
            onOpenEventDetail={handleOpenEventDetail}
            selectedEventId={selectedEventId}
            onBackToEventList={() => setOrganizerSubMenu('events')}
            isViewingEventDetail={false}
            onShowToast={showToast}
            onSwitchToParticipant={() => setCurrentView('participant')}
            onOpenLeaderboard={() => setCurrentView('leaderboard')}
            onSelectTeamForParticipantPreview={handleSelectTeamForParticipant}
          />
        )}

        {/* VIEW 3: DAFTAR EVENT */}
        {currentView === 'event-list' && (
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <EventListView
              onOpenEventDetail={handleOpenEventDetail}
              onShowToast={showToast}
            />
          </div>
        )}

        {/* VIEW 4: DETAIL EVENT */}
        {currentView === 'event-detail' && (
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <EventDetailView
              eventId={selectedEventId}
              onBack={() => setCurrentView('event-list')}
              onShowToast={showToast}
              onSwitchToParticipant={() => setCurrentView('participant')}
            />
          </div>
        )}

        {/* VIEW 5: HALAMAN PESERTA (MOBILE-FIRST DENGAN LOGIN BIB & PIN) */}
        {currentView === 'participant' && (
          <ParticipantView
            onShowToast={showToast}
            onOpenLeaderboard={() => setCurrentView('leaderboard')}
          />
        )}

        {/* VIEW 6: DASHBOARD JURI / FASILITATOR DENGAN LIVE SCORING */}
        {currentView === 'judge' && (
          <JudgeDashboardView onShowToast={showToast} />
        )}

        {/* VIEW 7: HALAMAN LEADERBOARD (PAPAN SKOR LANGSUNG SINKRON) */}
        {currentView === 'leaderboard' && (
          <LeaderboardView onShowToast={showToast} />
        )}
      </main>

      {/* 4. Global Footer */}
      <footer className="bg-[#0b192c] text-slate-400 border-t border-slate-800 text-xs py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white font-bold shadow-sm">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-white text-sm">Orienteering & Amazing Race Platform</div>
              <div className="text-[11px] text-slate-400">Anti-Speedrun Jeda Antar-Pos, Cetak Massal BIB & QR Pos, Manajemen Tim Lengkap</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium">
            <button 
              onClick={() => setCurrentView('landing')} 
              className="text-slate-300 hover:text-white cursor-pointer"
            >
              Beranda
            </button>
            <button 
              onClick={() => { setCurrentView('organizer'); setOrganizerSubMenu('dashboard'); }} 
              className="text-slate-300 hover:text-white cursor-pointer"
            >
              Organizer Hub
            </button>
            <button 
              onClick={() => setCurrentView('participant')} 
              className="text-slate-300 hover:text-white cursor-pointer"
            >
              Mode Peserta (HP)
            </button>
            <button 
              onClick={() => setCurrentView('judge')} 
              className="text-slate-300 hover:text-white cursor-pointer"
            >
              Dashboard Juri
            </button>
            <button 
              onClick={() => setCurrentView('leaderboard')} 
              className="text-slate-300 hover:text-white cursor-pointer"
            >
              Leaderboard
            </button>
          </div>

          <div className="text-[11px] text-slate-500">
            Sistem interaktif terintegrasi. Data disimpan di LocalStorage peramban.
          </div>
        </div>
      </footer>

      {/* Toast Notification */}
      <DemoToast 
        message={toastMessage} 
        onClose={() => setToastMessage(null)} 
      />

      {/* Transparency & Roadmap Modal */}
      <RoadmapModal
        isOpen={roadmapModalOpen}
        onClose={() => setRoadmapModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <RaceProvider>
      <AppContent />
    </RaceProvider>
  );
}
