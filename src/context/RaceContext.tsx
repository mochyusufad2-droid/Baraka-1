import React, { createContext, useContext, useState, useEffect } from 'react';
import { EventItem, Checkpoint, Team, ChallengeSubmission, RaceControlStatus, RaceLog, RaceBroadcast, SosAlert } from '../types';
import { safeSetItem, safeGetItem, safeRemoveItem } from '../utils/storage';
import { compressImageDataUrl } from '../utils/imageCompressor';
import { saveParticipantRaceCache } from '../utils/participantOfflineManager';
import { 
  DEMO_EVENTS, 
  DEMO_CHECKPOINTS, 
  DEMO_TEAMS, 
  DEMO_SUBMISSIONS 
} from '../data/demoData';

interface RaceContextType {
  events: EventItem[];
  checkpoints: Checkpoint[];
  teams: Team[];
  submissions: ChallengeSubmission[];
  activeTeamId: string | null;
  selectedEventId: string;
  setSelectedEventId: (id: string) => void;
  
  // Race Control & Timer
  raceStatus: RaceControlStatus;
  raceElapsedSeconds: number;
  raceLogs: RaceLog[];
  broadcasts: RaceBroadcast[];
  sosAlerts: SosAlert[];
  startRace: () => void;
  pauseRace: () => void;
  endRace: () => void;
  resetRaceTimer: () => void;
  sendBroadcast: (title: string, message: string, type: 'urgent' | 'info' | 'weather' | 'clue') => void;
  deleteBroadcast: (id: string) => void;
  triggerSos: (teamId: string, coordinates: { lat: number; lng: number }) => void;
  resolveSos: (alertId: string) => void;

  // Registration & Teams
  registerTeam: (teamData: {
    eventId: string;
    name: string;
    category: string;
    leaderName: string;
    leaderPhone?: string;
    leaderEmail?: string;
    organization?: string;
    members: string[];
  }) => { team: Team; pinCode: string; bibNumber: string };
  updateTeam: (teamId: string, updatedData: Partial<Team>) => Team | undefined;
  deleteTeam: (teamId: string) => void;
  
  // Participant Session
  loginParticipant: (bibNumber: string, pinCode: string) => { success: boolean; team?: Team; message?: string };
  logoutParticipant: () => void;
  setActiveTeamId: (teamId: string | null) => void;
  
  // Checkpoint & Race Actions
  checkInCheckpoint: (teamId: string, checkpointId: string, bypassCooldown?: boolean) => { 
    success: boolean; 
    pointsAwarded: number; 
    checkpointName: string;
    isCooldown?: boolean;
    isLocked?: boolean;
    remainingSeconds?: number;
    message?: string;
  };
  checkInByQrCode: (teamId: string, qrCodeInput: string, bypassCooldown?: boolean) => { 
    success: boolean; 
    pointsAwarded: number; 
    checkpointName: string; 
    message: string;
    isCooldown?: boolean;
    isLocked?: boolean;
    remainingSeconds?: number;
  };
  getTeamRemainingCooldown: (teamId: string) => {
    inCooldown: boolean;
    remainingSeconds: number;
    minIntervalSeconds: number;
  };
  clearTeamCooldown: (teamId: string) => void;
  submitChallengeProof: (teamId: string, checkpointId: string, type: 'photo' | 'quiz_answer', content: string, contentUrl?: string) => void;
  
  // Judge Actions
  reviewSubmission: (submissionId: string, status: 'approved' | 'rejected', score: number, note: string) => void;
  submitJudgeManualScore: (
    teamIdOrBib: string,
    checkpointIdOrCode: string,
    score: number,
    note: string,
    markCheckpointCompleted?: boolean,
    photoUrl?: string,
    isPenalty?: boolean,
    penaltyMinutesToAdd?: number
  ) => {
    success: boolean;
    message: string;
    teamName?: string;
    checkpointName?: string;
    scoreAwarded?: number;
    penaltyDeducted?: number;
    penaltyMinutesAdded?: number;
  };
  
  // Organizer Actions
  createEvent: (eventData: Partial<EventItem>) => EventItem;
  updateEvent: (eventId: string, updatedData: Partial<EventItem>) => EventItem | undefined;
  deleteEvent: (eventId: string) => void;
  createCheckpoint: (checkpointData: Partial<Checkpoint>) => Checkpoint;
  updateCheckpoint: (checkpointId: string, updatedData: Partial<Checkpoint>) => Checkpoint | undefined;
  deleteCheckpoint: (checkpointId: string) => void;
  batchUpdateCheckpointPoints: (points: number) => void;
  resetToDemoData: () => void;
}

const RaceContext = createContext<RaceContextType | undefined>(undefined);

const STORAGE_KEYS = {
  EVENTS: 'racepoint_events_v2',
  CHECKPOINTS: 'racepoint_checkpoints_v2',
  TEAMS: 'racepoint_teams_v2',
  SUBMISSIONS: 'racepoint_submissions_v2',
  ACTIVE_TEAM: 'racepoint_active_team_v2',
  RACE_STATUS: 'racepoint_race_status_v3',
  RACE_SECONDS: 'racepoint_race_seconds_v3',
  RACE_LOGS: 'racepoint_race_logs_v3',
  BROADCASTS: 'racepoint_broadcasts_v4',
};

const DEFAULT_LOGS: RaceLog[] = [
  { id: 'log-1', time: '08:00 WIB', message: 'Sistem siap: Seluruh stiker QR pos kontrol telah diverifikasi panitia.', type: 'system' },
  { id: 'log-2', time: '08:15 WIB', message: 'Perlombaan dimulai! 16 tim serentak bergerak mencari Pos 1.', type: 'system' },
  { id: 'log-3', time: '08:45 WIB', message: 'Tim Garuda Merah berhasil melakukan scan barcode di Pos 1.', type: 'checkin' },
  { id: 'log-4', time: '09:12 WIB', message: 'Juri Pos 2 menyetujui foto formasi tim Garuda Merah (+150 Poin).', type: 'judge' },
];

const DEFAULT_BROADCASTS: RaceBroadcast[] = [
  {
    id: 'bc-1',
    time: '09:00 WIB',
    title: 'Waspada Jalur Licin di Sektor Hutan',
    message: 'Jalur antara Pos 2 dan Pos 3 sedikit licin karena embun pagi. Seluruh regu diimbau berhati-hati saat berlari.',
    type: 'weather',
    author: 'Direktur Perlombaan'
  },
  {
    id: 'bc-2',
    time: '09:35 WIB',
    title: 'Pengingat Waktu Lomba & Pos Wajib',
    message: 'Batas akhir lomba pukul 11:30 WIB. Pastikan seluruh tim menyelesaikan Pos Wajib sebelum menuju garis finis!',
    type: 'info',
    author: 'Panitia Waktu'
  }
];

export const RaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<EventItem[]>(() => {
    const saved = safeGetItem(STORAGE_KEYS.EVENTS);
    return saved ? JSON.parse(saved) : DEMO_EVENTS;
  });

  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>(() => {
    const saved = safeGetItem(STORAGE_KEYS.CHECKPOINTS);
    return saved ? JSON.parse(saved) : DEMO_CHECKPOINTS;
  });

  const [teams, setTeams] = useState<Team[]>(() => {
    const saved = safeGetItem(STORAGE_KEYS.TEAMS);
    return saved ? JSON.parse(saved) : DEMO_TEAMS;
  });

  const [submissions, setSubmissions] = useState<ChallengeSubmission[]>(() => {
    const saved = safeGetItem(STORAGE_KEYS.SUBMISSIONS);
    return saved ? JSON.parse(saved) : DEMO_SUBMISSIONS;
  });

  const [activeTeamId, setActiveTeamId] = useState<string | null>(() => {
    return safeGetItem(STORAGE_KEYS.ACTIVE_TEAM) || 'team-01';
  });

  const [selectedEventId, setSelectedEventId] = useState<string>('evt-01');

  // Race Control & Timer State
  const [raceStatus, setRaceStatus] = useState<RaceControlStatus>(() => {
    const saved = safeGetItem(STORAGE_KEYS.RACE_STATUS);
    return (saved as RaceControlStatus) || 'running';
  });

  const [raceElapsedSeconds, setRaceElapsedSeconds] = useState<number>(() => {
    const saved = safeGetItem(STORAGE_KEYS.RACE_SECONDS);
    return saved ? Number(saved) : 6120; // 1 hour 42 mins
  });

  const [raceLogs, setRaceLogs] = useState<RaceLog[]>(() => {
    const saved = safeGetItem(STORAGE_KEYS.RACE_LOGS);
    return saved ? JSON.parse(saved) : DEFAULT_LOGS;
  });

  const [sosAlerts, setSosAlerts] = useState<SosAlert[]>(() => {
    const saved = safeGetItem('racepoint_sos_alerts_v1');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    safeSetItem('racepoint_sos_alerts_v1', JSON.stringify(sosAlerts));
  }, [sosAlerts]);

  const triggerSos = (teamId: string, coordinates: { lat: number; lng: number }) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;
    const now = Date.now();
    const timeString = new Date(now).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';
    
    const newAlert: SosAlert = {
      id: `sos-${Date.now()}`,
      teamId: team.id,
      teamName: team.name,
      bibNumber: team.bibNumber,
      timestamp: now,
      timeString,
      coordinates,
      status: 'active'
    };

    setSosAlerts(prev => [newAlert, ...prev]);

    const newLog: RaceLog = {
      id: `log-sos-${Date.now()}`,
      time: timeString,
      message: `🚨 DARURAT (SOS): Tim ${team.name} (${team.bibNumber}) mengirim sinyal darurat dari koordinat [${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}]!`,
      type: 'system'
    };
    setRaceLogs(prev => [newLog, ...prev]);
  };

  const resolveSos = (alertId: string) => {
    setSosAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'resolved' } : a));
  };

  // Global Timer Ticker when status is running
  useEffect(() => {
    if (raceStatus !== 'running') return;
    const interval = setInterval(() => {
      setRaceElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [raceStatus]);

  // Sync to LocalStorage
  useEffect(() => {
    safeSetItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    safeSetItem(STORAGE_KEYS.CHECKPOINTS, JSON.stringify(checkpoints));
    saveParticipantRaceCache(checkpoints, teams);
  }, [checkpoints, teams]);

  useEffect(() => {
    safeSetItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams));
  }, [teams]);

  useEffect(() => {
    safeSetItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
  }, [submissions]);

  useEffect(() => {
    safeSetItem(STORAGE_KEYS.RACE_STATUS, raceStatus);
  }, [raceStatus]);

  useEffect(() => {
    safeSetItem(STORAGE_KEYS.RACE_SECONDS, String(raceElapsedSeconds));
  }, [raceElapsedSeconds]);

  useEffect(() => {
    safeSetItem(STORAGE_KEYS.RACE_LOGS, JSON.stringify(raceLogs));
  }, [raceLogs]);

  const [broadcasts, setBroadcasts] = useState<RaceBroadcast[]>(() => {
    const saved = safeGetItem(STORAGE_KEYS.BROADCASTS);
    return saved ? JSON.parse(saved) : DEFAULT_BROADCASTS;
  });

  useEffect(() => {
    safeSetItem(STORAGE_KEYS.BROADCASTS, JSON.stringify(broadcasts));
  }, [broadcasts]);

  const sendBroadcast = (title: string, message: string, type: 'urgent' | 'info' | 'weather' | 'clue') => {
    const newBc: RaceBroadcast = {
      id: `bc-${Date.now()}`,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      title,
      message,
      type,
      author: 'Direktur Perlombaan'
    };
    setBroadcasts((prev) => [newBc, ...prev]);
    addLog(`Pengumuman Siaran: "${title}" (${type.toUpperCase()})`, 'system');
  };

  const deleteBroadcast = (id: string) => {
    setBroadcasts((prev) => prev.filter((b) => b.id !== id));
  };

  useEffect(() => {
    if (activeTeamId) {
      safeSetItem(STORAGE_KEYS.ACTIVE_TEAM, activeTeamId);
    } else {
      safeRemoveItem(STORAGE_KEYS.ACTIVE_TEAM);
    }
  }, [activeTeamId]);

  // Helper to add log
  const addLog = (message: string, type: 'checkin' | 'judge' | 'system' | 'registration') => {
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    const newLog: RaceLog = {
      id: `log-${Date.now()}`,
      time: nowTime,
      message,
      type,
    };
    setRaceLogs((prev) => [newLog, ...prev.slice(0, 19)]); // keep recent 20 logs
  };

  const startRace = () => {
    setRaceStatus('running');
    addLog('Race Director: Balapan resmi DIMULAI!', 'system');
  };

  const pauseRace = () => {
    setRaceStatus('paused');
    addLog('Race Director: Balapan DIHENTIKAN SEMENTARA (PAUSED).', 'system');
  };

  const endRace = () => {
    setRaceStatus('ended');
    addLog('Race Director: Garis Finish DITUTUP. Perlombaan Selesai.', 'system');
  };

  const resetRaceTimer = () => {
    setRaceElapsedSeconds(0);
    setRaceStatus('not_started');
    addLog('Race Director: Timer balapan di-reset ke 00:00:00.', 'system');
  };

  // Register a new team dynamically from Landing Page
  const registerTeam = (teamData: {
    eventId: string;
    name: string;
    category: string;
    leaderName: string;
    leaderPhone?: string;
    leaderEmail?: string;
    organization?: string;
    members: string[];
  }) => {
    const teamNum = teams.length + 1;
    const bibLetter = String.fromCharCode(65 + (teamNum % 26));
    const bibNumber = `${bibLetter}-${String(teamNum).padStart(2, '0')}`;
    const pinCode = String(1000 + Math.floor(Math.random() * 9000));
    const newId = `team-${Date.now()}`;

    const memberList = [
      { name: teamData.leaderName, role: 'Ketua Tim' as const, phone: teamData.leaderPhone },
      ...teamData.members.map((m) => ({ name: m, role: 'Anggota' as const })),
    ];

    const colors = ['bg-orange-600', 'bg-blue-600', 'bg-emerald-600', 'bg-purple-600', 'bg-rose-600', 'bg-cyan-600'];
    const assignedColor = colors[teamNum % colors.length];

    const newTeam: Team = {
      id: newId,
      name: teamData.name,
      category: teamData.category,
      color: assignedColor,
      bibNumber,
      pinCode,
      members: memberList,
      checkpointsCompleted: 0,
      totalCheckpoints: checkpoints.length,
      currentCheckpointId: checkpoints[0]?.id || 'cp-01',
      points: 0,
      bonusPoints: 0,
      penaltyPoints: 0,
      totalScore: 0,
      startTime: '08:30 WIB',
      durationMinutes: 0,
      status: 'racing',
      lastPosName: 'Garis Start',
      lastUpdated: 'Baru saja terdaftar',
    };

    setTeams((prev) => [newTeam, ...prev]);
    setActiveTeamId(newId);
    addLog(`Tim Baru Terdaftar: "${teamData.name}" (BIB ${bibNumber}) oleh ${teamData.leaderName}.`, 'registration');

    return { team: newTeam, bibNumber, pinCode };
  };

  const updateTeam = (teamId: string, updatedData: Partial<Team>) => {
    let updated: Team | undefined;
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id === teamId) {
          const nextBonus = updatedData.bonusPoints !== undefined ? updatedData.bonusPoints : t.bonusPoints;
          const nextPenalty = updatedData.penaltyPoints !== undefined ? updatedData.penaltyPoints : t.penaltyPoints;
          const nextPoints = updatedData.points !== undefined ? updatedData.points : t.points;
          const nextTotal = nextPoints + nextBonus - nextPenalty;
          updated = {
            ...t,
            ...updatedData,
            totalScore: updatedData.totalScore !== undefined ? updatedData.totalScore : nextTotal,
          };
          return updated;
        }
        return t;
      })
    );
    if (updated) {
      addLog(`Tim Diperbarui: "${updated.name}" (BIB ${updated.bibNumber}).`, 'system');
    }
    return updated;
  };

  const deleteTeam = (teamId: string) => {
    const target = teams.find((t) => t.id === teamId);
    setTeams((prev) => prev.filter((t) => t.id !== teamId));
    if (activeTeamId === teamId) {
      setActiveTeamId(null);
    }
    addLog(`Tim Dihapus: "${target?.name || teamId}".`, 'system');
  };

  // Participant Login via BIB & PIN
  const loginParticipant = (bibNumber: string, pinCode: string) => {
    const cleanBib = bibNumber.trim().toUpperCase();
    const cleanPin = pinCode.trim();

    const matched = teams.find(
      (t) => t.bibNumber.toUpperCase() === cleanBib && t.pinCode === cleanPin
    );

    if (matched) {
      setActiveTeamId(matched.id);
      addLog(`Peserta Login: Tim "${matched.name}" masuk ke sistem HP di lintasan.`, 'system');
      return { success: true, team: matched };
    }

    return { 
      success: false, 
      message: 'Nomor BIB atau PIN tidak cocok. Silakan periksa kembali atau gunakan tombol Coba Tim Demo.' 
    };
  };

  const logoutParticipant = () => {
    setActiveTeamId(null);
  };

  // Minimum Interval Tracking (Anti-Speedrun) Helper
  const getTeamRemainingCooldown = (teamId: string) => {
    const currentEvent = events.find((e) => e.id === selectedEventId) || events[0];
    const isEnforced = currentEvent?.enforceMinInterval !== false;
    const minInterval = currentEvent?.minIntervalBetweenCheckpointsSeconds ?? currentEvent?.scoringRules?.minIntervalSeconds ?? 60;

    if (!isEnforced || minInterval <= 0) {
      return { inCooldown: false, remainingSeconds: 0, minIntervalSeconds: 0 };
    }

    const targetTeam = teams.find((t) => t.id === teamId);
    if (!targetTeam || !targetTeam.lastCheckinTimestamp) {
      return { inCooldown: false, remainingSeconds: 0, minIntervalSeconds: minInterval };
    }

    const elapsedSeconds = Math.floor((Date.now() - targetTeam.lastCheckinTimestamp) / 1000);
    const remainingSeconds = minInterval - elapsedSeconds;

    if (remainingSeconds > 0) {
      return { inCooldown: true, remainingSeconds, minIntervalSeconds: minInterval };
    }

    return { inCooldown: false, remainingSeconds: 0, minIntervalSeconds: minInterval };
  };

  const clearTeamCooldown = (teamId: string) => {
    const team = teams.find((t) => t.id === teamId);
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id === teamId) {
          return {
            ...t,
            lastCheckinTimestamp: undefined,
          };
        }
        return t;
      })
    );
    addLog(`Bypass Anti-Cheat: Panitia me-reset waktu jeda pos untuk Tim "${team?.name || teamId}".`, 'system');
  };

  // Team Check-in to a Checkpoint
  const checkInCheckpoint = (teamId: string, checkpointId: string, bypassCooldown = false) => {
    const cp = checkpoints.find((c) => c.id === checkpointId);
    const targetTeam = teams.find((t) => t.id === teamId);
    if (!cp) {
      return { success: false, pointsAwarded: 0, checkpointName: '', message: 'Pos checkpoint tidak ditemukan.' };
    }

    // Auto-Lock Checkpoint Validation
    const currentEvt = events.find((e) => e.id === selectedEventId) || events[0];
    const isAutoLockEnabled = currentEvt?.autoLockCheckpointsEnabled !== false;
    const effectiveLockMins = cp.autoLockMinutes && cp.autoLockMinutes > 0 
      ? cp.autoLockMinutes 
      : (currentEvt?.autoLockCheckpointsMinutes || 0);

    const elapsedMins = Math.floor(raceElapsedSeconds / 60);

    if (isAutoLockEnabled && effectiveLockMins > 0 && elapsedMins >= effectiveLockMins) {
      addLog(
        `🔒 Auto-Lock Checkpoint: Tim "${targetTeam?.name || 'Peserta'}" mencoba scan ${cp.name} yang telah tertutup otomatis setelah ${effectiveLockMins} menit lomba.`,
        'system'
      );
      return {
        success: false,
        pointsAwarded: 0,
        checkpointName: cp.name,
        isLocked: true,
        message: `🔒 Pos "${cp.name}" telah tertutup otomatis (Auto-Locked) karena batas waktu ${effectiveLockMins} menit dari awal lomba telah terlampaui.`
      };
    }

    // Anti-Speedrun check
    if (!bypassCooldown) {
      const cooldown = getTeamRemainingCooldown(teamId);
      if (cooldown.inCooldown) {
        addLog(
          `Peringatan Jeda: Tim "${targetTeam?.name || 'Peserta'}" terdeteksi scan ${cp.name} terlalu cepat (sisa jeda: ${cooldown.remainingSeconds}s). Sistem anti-speedrun memblokir check-in.`,
          'system'
        );
        return {
          success: false,
          pointsAwarded: 0,
          checkpointName: cp.name,
          isCooldown: true,
          remainingSeconds: cooldown.remainingSeconds,
          message: `Jeda minimum belum terpenuhi! Harap tunggu ${cooldown.remainingSeconds} detik lagi sebelum check-in pos berikutnya (Pencegahan speedrun).`
        };
      }
    }

    const now = Date.now();
    const timeString = new Date(now).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    setTeams((prev) => 
      prev.map((t) => {
        if (t.id === teamId) {
          const nextCompleted = Math.min(t.totalCheckpoints, t.checkpointsCompleted + 1);
          const newPoints = t.points + cp.points;
          const newTotal = newPoints + t.bonusPoints - t.penaltyPoints;
          const newVisit = {
            checkpointId: cp.id,
            checkpointName: cp.name,
            timestamp: now,
            timeString,
            points: cp.points,
            status: 'completed' as const,
            method: 'QR Scan' as const,
          };
          const existingHistory = t.visitHistory || [];
          const updatedHistory = [...existingHistory.filter(v => v.checkpointId !== cp.id), newVisit];

          return {
            ...t,
            points: newPoints,
            totalScore: newTotal,
            checkpointsCompleted: nextCompleted,
            lastPosName: cp.name,
            lastUpdated: 'Baru saja',
            lastCheckinTimestamp: now,
            visitHistory: updatedHistory,
          };
        }
        return t;
      })
    );

    addLog(`Check-in: Tim "${targetTeam?.name || 'Peserta'}" berhasil scan ${cp.name} (+${cp.points} Pts). Waktu jeda pos berikutnya diaktifkan.`, 'checkin');

    return { 
      success: true, 
      pointsAwarded: cp.points, 
      checkpointName: cp.name,
      message: `Berhasil check-in di ${cp.name}! +${cp.points} Poin berhasil ditambahkan.`
    };
  };

  // Check-in by typed / scanned barcode text
  const checkInByQrCode = (teamId: string, qrCodeInput: string, bypassCooldown = false) => {
    const cleanInput = qrCodeInput.trim().toUpperCase();
    if (!cleanInput) {
      return { 
        success: false, 
        pointsAwarded: 0, 
        checkpointName: '', 
        message: 'Harap masukkan atau pindai kode QR pos.' 
      };
    }

    const matchedCp = checkpoints.find((c) => {
      const targetVal = c.qrCodeValue.toUpperCase();
      return (
        targetVal === cleanInput || 
        targetVal.replace(/-/g, '') === cleanInput.replace(/-/g, '') ||
        targetVal.endsWith(cleanInput)
      );
    });

    if (!matchedCp) {
      return { 
        success: false, 
        pointsAwarded: 0, 
        checkpointName: '', 
        message: `Kode barcode "${qrCodeInput}" tidak valid atau tidak cocok dengan rute pos lomba ini.` 
      };
    }

    return checkInCheckpoint(teamId, matchedCp.id, bypassCooldown);
  };

  // Submit proof from Participant
  const submitChallengeProof = async (
    teamId: string,
    checkpointId: string,
    type: 'photo' | 'quiz_answer',
    content: string,
    contentUrl?: string
  ) => {
    const team = teams.find((t) => t.id === teamId);
    const cp = checkpoints.find((c) => c.id === checkpointId);

    let finalUrl = contentUrl;
    if (finalUrl && finalUrl.startsWith('data:image/')) {
      finalUrl = await compressImageDataUrl(finalUrl, 800, 800, 0.7);
    }

    const newSub: ChallengeSubmission = {
      id: `sub-${Date.now()}`,
      teamId,
      teamName: team?.name || 'Tim Peserta',
      checkpointId,
      checkpointName: cp?.name || 'Pos Checkpoint',
      submittedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      type,
      contentText: content,
      contentUrl: finalUrl || undefined,
      status: 'pending',
      scoreGiven: 0,
      judgeNote: 'Menunggu pemeriksaan fasilitator pos.',
    };

    setSubmissions((prev) => [newSub, ...prev]);
    addLog(`Misi Terkirim: Tim "${team?.name}" mengunggah bukti tugas untuk ${cp?.name}.`, 'judge');
  };

  // Judge review submission
  const reviewSubmission = (
    submissionId: string,
    status: 'approved' | 'rejected',
    score: number,
    note: string
  ) => {
    const sub = submissions.find((s) => s.id === submissionId);
    if (!sub) return;

    setSubmissions((prev) => 
      prev.map((s) => s.id === submissionId ? {
        ...s,
        status,
        scoreGiven: score,
        judgeNote: note,
      } : s)
    );

    if (status === 'approved' && score > 0) {
      setTeams((prev) => 
        prev.map((t) => {
          if (t.id === sub.teamId) {
            const newBonus = t.bonusPoints + score;
            return {
              ...t,
              bonusPoints: newBonus,
              totalScore: t.points + newBonus - t.penaltyPoints,
              lastUpdated: 'Dinilai oleh Juri',
            };
          }
          return t;
        })
      );
      addLog(`Penilaian Juri: Tim "${sub.teamName}" disetujui untuk ${sub.checkpointName} (+${score} Poin).`, 'judge');
    } else {
      addLog(`Penilaian Juri: Tugas tim "${sub.teamName}" di ${sub.checkpointName} ditolak.`, 'judge');
    }
  };

  // Manual score input & penalty submission by judge with team & checkpoint validation
  const submitJudgeManualScore = (
    teamIdOrBib: string,
    checkpointIdOrCode: string,
    score: number,
    note: string,
    markCheckpointCompleted?: boolean,
    photoUrl?: string,
    isPenalty = false,
    penaltyMinutesToAdd = 0
  ) => {
    const cleanTeamInput = (teamIdOrBib || '').trim().toLowerCase();
    const cleanCodeInput = (checkpointIdOrCode || '').trim().toUpperCase();

    if (!cleanTeamInput) {
      return {
        success: false,
        message: 'Harap masukkan ID Tim atau nomor BIB terlebih dahulu!',
      };
    }

    if (!cleanCodeInput) {
      return {
        success: false,
        message: 'Harap masukkan Kode Pos atau ID Checkpoint terlebih dahulu!',
      };
    }

    // Find team by ID or bibNumber or name
    const targetTeam = teams.find((t) => 
      t.id.toLowerCase() === cleanTeamInput ||
      t.bibNumber.toLowerCase() === cleanTeamInput ||
      t.name.toLowerCase() === cleanTeamInput
    );

    if (!targetTeam) {
      return {
        success: false,
        message: `ID Tim atau nomor BIB "${teamIdOrBib}" tidak ditemukan dalam daftar tim peserta lomba!`,
      };
    }

    // Find checkpoint by ID or qrCodeValue or name or code
    const targetCp = checkpoints.find((c) => {
      const cpId = c.id.toUpperCase();
      const qrVal = c.qrCodeValue.toUpperCase();
      const cpName = c.name.toUpperCase();
      const cpCode = (c as any).code ? String((c as any).code).toUpperCase() : '';
      return (
        cpId === cleanCodeInput ||
        qrVal === cleanCodeInput ||
        qrVal.replace(/-/g, '') === cleanCodeInput.replace(/-/g, '') ||
        cpName === cleanCodeInput ||
        (cpCode && cpCode === cleanCodeInput)
      );
    });

    if (!targetCp) {
      return {
        success: false,
        message: `Kode Pos atau ID Checkpoint "${checkpointIdOrCode}" tidak valid atau tidak terdaftar pada rute event ini!`,
      };
    }

    const numericScore = Number(score);
    if (isNaN(numericScore)) {
      return {
        success: false,
        message: 'Nilai skor juri harus berupa angka valid!',
      };
    }

    const isPenaltyAction = isPenalty || numericScore < 0 || penaltyMinutesToAdd > 0;
    const penaltyPointsDeducted = isPenaltyAction ? Math.abs(numericScore) : 0;
    const bonusPointsEarned = !isPenaltyAction ? Math.max(0, numericScore) : 0;
    const addedTime = Math.max(0, Number(penaltyMinutesToAdd) || 0);

    // Record an approved submission or penalty entry so it is logged in history
    const manualSub: ChallengeSubmission = {
      id: `manual-sub-${Date.now()}`,
      teamId: targetTeam.id,
      teamName: targetTeam.name,
      checkpointId: targetCp.id,
      checkpointName: targetCp.name,
      submittedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      type: isPenaltyAction ? 'penalty' : 'photo',
      contentText: isPenaltyAction
        ? `🚨 Penalti Juri: -${penaltyPointsDeducted} Pts / +${addedTime}m Waktu (${note || 'Pelanggaran Aturan Pos'})`
        : `Input Skor Manual Juri: ${note || 'Evaluasi Pos Lapangan'}`,
      contentUrl: photoUrl || undefined,
      status: 'approved',
      scoreGiven: isPenaltyAction ? -penaltyPointsDeducted : bonusPointsEarned,
      penaltyMinutesAdded: addedTime,
      judgeNote: note || (isPenaltyAction ? 'Penalti diterbitkan oleh Juri Pos.' : 'Skor disahkan oleh Juri Pos.'),
    };

    setSubmissions((prev) => [manualSub, ...prev]);

    // Update team score & checkpoints completed & penalty minutes
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id === targetTeam.id) {
          const newBonus = t.bonusPoints + bonusPointsEarned;
          const newPenaltyPoints = t.penaltyPoints + penaltyPointsDeducted;
          const newPenaltyMinutes = (t.penaltyMinutes || 0) + addedTime;
          const newDurationMinutes = Math.max(0, t.durationMinutes + addedTime);
          const newTotal = t.points + newBonus - newPenaltyPoints;

          let newCompleted = t.checkpointsCompleted;
          let newLastPos = t.lastPosName;

          if (markCheckpointCompleted) {
            if (newCompleted < t.totalCheckpoints) {
              newCompleted += 1;
            }
            newLastPos = targetCp.name;
          }

          return {
            ...t,
            bonusPoints: newBonus,
            penaltyPoints: newPenaltyPoints,
            penaltyMinutes: newPenaltyMinutes,
            durationMinutes: newDurationMinutes,
            totalScore: newTotal,
            checkpointsCompleted: newCompleted,
            lastPosName: newLastPos,
            lastUpdated: isPenaltyAction 
              ? `Penalti Juri (-${penaltyPointsDeducted} Pts, +${addedTime}m)` 
              : `Skor Manual (+${bonusPointsEarned} Pts)`,
          };
        }
        return t;
      })
    );

    if (isPenaltyAction) {
      addLog(
        `🚨 PENALTI JURI: Tim "${targetTeam.name}" (BIB ${targetTeam.bibNumber}) dikenakan sanksi di ${targetCp.name}: -${penaltyPointsDeducted} Poin${addedTime > 0 ? `, +${addedTime} Menit Penalti Waktu` : ''} (${note || 'Pelanggaran Aturan Pos'}).`,
        'judge'
      );

      return {
        success: true,
        message: `Penalti berhasil diterbitkan! Tim ${targetTeam.name} dikenakan -${penaltyPointsDeducted} Poin${addedTime > 0 ? ` & +${addedTime} Menit Waktu` : ''} di ${targetCp.name}.`,
        teamName: targetTeam.name,
        checkpointName: targetCp.name,
        penaltyDeducted: penaltyPointsDeducted,
        penaltyMinutesAdded: addedTime,
      };
    } else {
      addLog(
        `Input Skor Manual Juri: Tim "${targetTeam.name}" (BIB ${targetTeam.bibNumber}) di ${targetCp.name} diberi +${bonusPointsEarned} poin (${note || 'Penilaian Juri'}).`,
        'judge'
      );

      return {
        success: true,
        message: `Skor manual berhasil dicatat! +${bonusPointsEarned} poin diberikan ke Tim ${targetTeam.name} di ${targetCp.name}.`,
        teamName: targetTeam.name,
        checkpointName: targetCp.name,
        scoreAwarded: bonusPointsEarned,
      };
    }
  };

  // Create Event from Organizer
  const createEvent = (eventData: Partial<EventItem>) => {
    const newEvent: EventItem = {
      id: `evt-${Date.now()}`,
      title: eventData.title || 'Event Baru Tanpa Judul',
      subtitle: eventData.subtitle || 'Kategori Petualangan',
      eventType: eventData.eventType || 'amazing_race',
      status: 'active',
      date: eventData.date || 'Hari Ini',
      timeRange: eventData.timeRange || '08:00 - 12:00 WIB',
      location: eventData.location || 'Lokasi Terbuka',
      totalTeams: 0,
      totalCheckpoints: checkpoints.length,
      timeLimitMinutes: eventData.timeLimitMinutes || 180,
      organizerName: eventData.organizerName || 'Panitia Pelaksana',
      description: eventData.description || 'Deskripsi rute event.',
      bannerGradient: 'from-blue-900 via-slate-900 to-orange-950',
      rules: eventData.rules || [
        'Setiap tim wajib beranggotakan lengkap saat tiba dan memindai barcode di pos.',
        'Dilarang menggunakan kendaraan bermotor selama rute balapan.',
        'Pos bertanda "Wajib" harus diselesaikan sebelum tim menuju garis finish.',
        'Foto tantangan tim harus memuat wajah seluruh anggota dan petunjuk pos.',
        'Penalti 10 poin per menit jika melebihi batas waktu tempuh.'
      ],
      scoringRules: eventData.scoringRules || {
        penaltyPerLateMin: 10,
        maxLateMinutes: 30,
        mandatoryBonus: 100,
        judgeMaxScore: 150
      }
    };

    setEvents((prev) => [newEvent, ...prev]);
    addLog(`Event Baru Dibuat: "${newEvent.title}" di ${newEvent.location}.`, 'system');
    return newEvent;
  };

  // Update Event from Organizer
  const updateEvent = (eventId: string, updatedData: Partial<EventItem>) => {
    let updated: EventItem | undefined;
    setEvents((prev) =>
      prev.map((evt) => {
        if (evt.id === eventId) {
          updated = { ...evt, ...updatedData };
          return updated;
        }
        return evt;
      })
    );
    if (updated) {
      addLog(`Event Diperbarui: "${updated.title}" (${updated.location}).`, 'system');
    }
    return updated;
  };

  // Delete Event from Organizer
  const deleteEvent = (eventId: string) => {
    const target = events.find((e) => e.id === eventId);
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    if (selectedEventId === eventId) {
      const remaining = events.filter((e) => e.id !== eventId);
      if (remaining.length > 0) {
        setSelectedEventId(remaining[0].id);
      }
    }
    addLog(`Event Dihapus: "${target?.title || eventId}".`, 'system');
  };

  // Create Checkpoint from Organizer
  const createCheckpoint = (checkpointData: Partial<Checkpoint>) => {
    const nextNumber = checkpoints.length + 1;
    const uniqueId = checkpointData.id || `cp-${Date.now()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const newCp: Checkpoint = {
      id: uniqueId,
      number: nextNumber,
      name: checkpointData.name || `Pos ${nextNumber}: Checkpoint Baru`,
      locationName: checkpointData.locationName !== undefined ? checkpointData.locationName : '',
      coordinates: checkpointData.coordinates || { lat: -6.6350, lng: 106.8850 },
      qrCodeValue: checkpointData.qrCodeValue || `QR-POS0${nextNumber}-${Math.floor(100 + Math.random() * 900)}`,
      points: checkpointData.points !== undefined ? Number(checkpointData.points) : 150,
      clue: checkpointData.clue !== undefined ? checkpointData.clue : '',
      challengeType: checkpointData.challengeType || 'qr_only',
      challengeDescription: checkpointData.challengeDescription || 'Scan kode QR pos untuk konfirmasi kedatangan.',
      isMandatory: checkpointData.isMandatory ?? true,
      status: 'locked',
    };

    setCheckpoints((prev) => [...prev, newCp]);
    // Sync totalCheckpoints in events
    setEvents((prev) =>
      prev.map((evt) => ({
        ...evt,
        totalCheckpoints: checkpoints.length + 1,
      }))
    );
    addLog(`Pos Ditambahkan: "${newCp.name}"${newCp.locationName ? ` (${newCp.locationName})` : ''} dengan nilai ${newCp.points} Poin.`, 'system');
    return newCp;
  };

  // Update Checkpoint from Organizer
  const updateCheckpoint = (checkpointId: string, updatedData: Partial<Checkpoint>) => {
    let updated: Checkpoint | undefined;
    setCheckpoints((prev) =>
      prev.map((cp) => {
        if (cp.id === checkpointId) {
          updated = { 
            ...cp, 
            ...updatedData,
            points: updatedData.points !== undefined ? Number(updatedData.points) : cp.points 
          };
          return updated;
        }
        return cp;
      })
    );
    if (updated) {
      addLog(`Pos Diperbarui: "${updated.name}" - Nilai Pos: ${updated.points} Poin.`, 'system');
    }
    return updated;
  };

  // Delete Checkpoint from Organizer
  const deleteCheckpoint = (checkpointId: string) => {
    const target = checkpoints.find((c) => c.id === checkpointId);
    setCheckpoints((prev) => {
      const filtered = prev.filter((c) => c.id !== checkpointId);
      return filtered.map((cp, idx) => ({
        ...cp,
        number: idx + 1,
      }));
    });
    setEvents((prev) =>
      prev.map((evt) => ({
        ...evt,
        totalCheckpoints: Math.max(0, checkpoints.length - 1),
      }))
    );
    addLog(`Pos Dihapus: "${target?.name || checkpointId}". Sisa ${Math.max(0, checkpoints.length - 1)} pos kontrol.`, 'system');
  };

  // Batch update all checkpoint points
  const batchUpdateCheckpointPoints = (points: number) => {
    const numericPoints = Number(points);
    setCheckpoints((prev) => prev.map((cp) => ({ ...cp, points: numericPoints })));
    addLog(`Nilai Seluruh Pos Diperbarui: Menjadi ${numericPoints} Poin per pos.`, 'system');
  };

  // Reset to initial demo data
  const resetToDemoData = () => {
    localStorage.removeItem(STORAGE_KEYS.EVENTS);
    localStorage.removeItem(STORAGE_KEYS.CHECKPOINTS);
    localStorage.removeItem(STORAGE_KEYS.TEAMS);
    localStorage.removeItem(STORAGE_KEYS.SUBMISSIONS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_TEAM);
    localStorage.removeItem(STORAGE_KEYS.RACE_STATUS);
    localStorage.removeItem(STORAGE_KEYS.RACE_SECONDS);
    localStorage.removeItem(STORAGE_KEYS.RACE_LOGS);
    localStorage.removeItem(STORAGE_KEYS.BROADCASTS);
    setEvents(DEMO_EVENTS);
    setCheckpoints(DEMO_CHECKPOINTS);
    setTeams(DEMO_TEAMS);
    setSubmissions(DEMO_SUBMISSIONS);
    setActiveTeamId('team-01');
    setRaceStatus('running');
    setRaceElapsedSeconds(6120);
    setRaceLogs(DEFAULT_LOGS);
    setBroadcasts(DEFAULT_BROADCASTS);
  };

  return (
    <RaceContext.Provider
      value={{
        events,
        checkpoints,
        teams,
        submissions,
        activeTeamId,
        selectedEventId,
        setSelectedEventId,
        raceStatus,
        raceElapsedSeconds,
        raceLogs,
        broadcasts,
        sosAlerts,
        startRace,
        pauseRace,
        endRace,
        resetRaceTimer,
        sendBroadcast,
        deleteBroadcast,
        triggerSos,
        resolveSos,
        registerTeam,
        updateTeam,
        deleteTeam,
        loginParticipant,
        logoutParticipant,
        setActiveTeamId,
        checkInCheckpoint,
        checkInByQrCode,
        getTeamRemainingCooldown,
        clearTeamCooldown,
        submitChallengeProof,
        reviewSubmission,
        submitJudgeManualScore,
        createEvent,
        updateEvent,
        deleteEvent,
        createCheckpoint,
        updateCheckpoint,
        deleteCheckpoint,
        batchUpdateCheckpointPoints,
        resetToDemoData,
      }}
    >
      {children}
    </RaceContext.Provider>
  );
};

export const useRace = () => {
  const context = useContext(RaceContext);
  if (!context) {
    throw new Error('useRace must be used within a RaceProvider');
  }
  return context;
};
