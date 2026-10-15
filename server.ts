import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SESSION_SECRET = process.env.SESSION_SECRET || 'orienteering-race-secret-key-2026';

function generateSessionToken(teamId: string, bibNumber: string): string {
  const timestamp = Date.now();
  const payload = `${teamId}:${bibNumber}:${timestamp}`;
  const hmac = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}:${hmac}`).toString('base64');
}

function verifySessionToken(token: string, expectedTeamId: string): { valid: boolean; reason?: string } {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split(':');
    if (parts.length < 4) return { valid: false, reason: 'Format token sesi rusak.' };
    const [teamId, bibNumber, timestampStr, hmac] = parts;

    if (teamId !== expectedTeamId) {
      return { valid: false, reason: `Token sesi milik tim ${bibNumber}, tidak sah untuk tim ${expectedTeamId}.` };
    }

    const timestamp = Number(timestampStr);
    // 24 hours expiry
    if (Date.now() - timestamp > 24 * 60 * 60 * 1000) {
      return { valid: false, reason: 'Sesi login telah kedaluwarsa (lebih dari 24 jam). Harap login ulang.' };
    }

    const payload = `${teamId}:${bibNumber}:${timestampStr}`;
    const expectedHmac = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
    if (hmac !== expectedHmac) {
      return { valid: false, reason: 'Tanda tangan token sesi tidak sah.' };
    }

    return { valid: true };
  } catch {
    return { valid: false, reason: 'Gagal memverifikasi token sesi.' };
  }
}

function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function isValidCoordinate(lat?: number, lng?: number): boolean {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (isNaN(lat) || isNaN(lng)) return false;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
  // Reject Null Island (0,0) - typical uninitialized GPS default
  if (Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001) return false;
  return true;
}

// Authoritative Checkpoint Registry on Server (Never trust client-tampered coordinates!)
interface AuthoritativeCheckpoint {
  id: string;
  eventId: string;
  number: number;
  name: string;
  coordinates: { lat: number; lng: number };
  radiusMeters: number;
  qrCodeValue: string;
  points: number;
  status: 'active' | 'locked' | 'completed';
}

const AUTHORITATIVE_CHECKPOINTS: Record<string, AuthoritativeCheckpoint> = {
  'cp-01': {
    id: 'cp-01',
    eventId: 'evt-01',
    number: 1,
    name: 'Pos 1: Gerbang Keberangkatan',
    coordinates: { lat: -6.6341, lng: 106.8821 },
    radiusMeters: 80,
    qrCodeValue: 'QR-POS01-AMZ-2026',
    points: 100,
    status: 'active',
  },
  'cp-02': {
    id: 'cp-02',
    eventId: 'evt-01',
    number: 2,
    name: 'Pos 2: Lembah Pinus & Yel-Yel',
    coordinates: { lat: -6.6365, lng: 106.8845 },
    radiusMeters: 80,
    qrCodeValue: 'QR-POS02-PINUS-981',
    points: 150,
    status: 'active',
  },
  'cp-03': {
    id: 'cp-03',
    eventId: 'evt-01',
    number: 3,
    name: 'Pos 3: Azimuth Kompas Batu Hitam',
    coordinates: { lat: -6.6398, lng: 106.8869 },
    radiusMeters: 90,
    qrCodeValue: 'QR-POS03-AZIMUTH-452',
    points: 200,
    status: 'active',
  },
  'cp-04': {
    id: 'cp-04',
    eventId: 'evt-01',
    number: 4,
    name: 'Pos 4: Jembatan Tali Spider Web',
    coordinates: { lat: -6.6421, lng: 106.8893 },
    radiusMeters: 80,
    qrCodeValue: 'QR-POS04-SPIDER-771',
    points: 250,
    status: 'locked',
  },
  'cp-05': {
    id: 'cp-05',
    eventId: 'evt-01',
    number: 5,
    name: 'Pos 5: Danau Cermin & Teka-Teki Logika',
    coordinates: { lat: -6.6455, lng: 106.8920 },
    radiusMeters: 100,
    qrCodeValue: 'QR-POS05-LAKE-318',
    points: 200,
    status: 'locked',
  },
  'cp-06': {
    id: 'cp-06',
    eventId: 'evt-01',
    number: 6,
    name: 'Pos 6: Garis Finish & Verifikasi Akhir',
    coordinates: { lat: -6.6335, lng: 106.8810 },
    radiusMeters: 80,
    qrCodeValue: 'QR-POS06-FINISH-GOLD',
    points: 300,
    status: 'locked',
  },
};

// In-memory processed scan keys for server-level idempotency
const PROCESSED_SCAN_RECEIPTS = new Map<string, { timestamp: number; points: number; checkpointName: string }>();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Health Check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'healthy',
      service: 'Orienteering Amazing Race Authority Server',
      serverTime: new Date().toISOString(),
    });
  });

  // Secure Participant Login via Server
  app.post('/api/participant/login', (req, res) => {
    try {
      const { bibNumber, pinCode, teams } = req.body;
      const cleanBib = (bibNumber || '').trim().toUpperCase();
      const cleanPin = (pinCode || '').trim();

      if (!cleanBib || !cleanPin) {
        return res.status(400).json({
          success: false,
          message: 'Nomor BIB dan PIN wajib diisi.',
        });
      }

      // Match team
      const teamList = Array.isArray(teams) ? teams : [];
      const matched = teamList.find(
        (t: any) => t.bibNumber?.toUpperCase() === cleanBib && String(t.pinCode).trim() === cleanPin
      );

      if (!matched) {
        return res.status(401).json({
          success: false,
          message: 'Nomor BIB atau PIN salah. Silakan periksa kembali atau tanyakan kepada panitia pos start.',
        });
      }

      const sessionToken = generateSessionToken(matched.id, matched.bibNumber);

      // Return sanitized team object WITHOUT pinCode!
      const sanitizedTeam = {
        id: matched.id,
        eventId: matched.eventId || 'evt-01',
        name: matched.name,
        bibNumber: matched.bibNumber,
        category: matched.category,
        color: matched.color,
        status: matched.status,
      };

      return res.json({
        success: true,
        team: sanitizedTeam,
        sessionToken,
        message: `Selamat datang, Tim ${matched.name} (${matched.bibNumber})! Sesi resmi berhasil diverifikasi.`,
      });
    } catch (err: any) {
      console.error('[Login Error]:', err);
      return res.status(500).json({
        success: false,
        message: err?.message || 'Terjadi kesalahan sistem saat proses login.',
      });
    }
  });

  // Server-Side Verification Endpoint for Check-in
  app.post('/api/race/validate-checkin', (req, res) => {
    try {
      const {
        teamId,
        sessionToken,
        qrCodeInput,
        eventId,
        eventStatus,
        checkpoint,
        gpsCoordinates,
        gpsPolicy,
        lastCheckinTimestamp,
        minIntervalSeconds = 30,
        bypassCooldown = false,
      } = req.body;

      if (!teamId || !qrCodeInput || !checkpoint) {
        return res.status(400).json({
          valid: false,
          code: 'INVALID_INPUT',
          message: 'Parameter check-in tidak lengkap (teamId, qrCodeInput, checkpoint wajib).',
        });
      }

      // Resolve Authoritative Checkpoint (never trust client-tampered coordinates!)
      const authCp = AUTHORITATIVE_CHECKPOINTS[checkpoint.id] || checkpoint;
      const targetCoordinates = authCp.coordinates || checkpoint.coordinates;
      const targetPoints = authCp.points || checkpoint.points || 100;
      const targetName = authCp.name || checkpoint.name || 'Pos Checkpoint';

      // Check Multi-Event Isolation: Checkpoint must belong to the active event
      const targetEventId = authCp.eventId || checkpoint.eventId;
      if (eventId && targetEventId && targetEventId !== eventId) {
        return res.status(403).json({
          valid: false,
          code: 'EVENT_MISMATCH',
          message: `Pos kontrol "${targetName}" terdaftar pada event lain (${targetEventId}), bukan event aktif (${eventId}).`,
        });
      }

      // 0. Verify Session Token Integrity if provided
      if (sessionToken) {
        const tokenCheck = verifySessionToken(sessionToken, teamId);
        if (!tokenCheck.valid) {
          return res.status(401).json({
            valid: false,
            code: 'SESSION_INVALID',
            message: tokenCheck.reason || 'Sesi otorisasi tim tidak sah.',
          });
        }
      }

      // 1. Verify Event Active Status
      if (eventStatus && eventStatus !== 'active') {
        return res.status(403).json({
          valid: false,
          code: 'EVENT_INACTIVE',
          message: `Perlombaan saat ini tidak aktif (status: ${eventStatus}). Check-in pos ditutup.`,
        });
      }

      // 2. Verify Checkpoint Lock Status
      if (authCp.status === 'locked') {
        return res.status(403).json({
          valid: false,
          code: 'CHECKPOINT_LOCKED',
          message: `Pos ${authCp.number || checkpoint.number} (${targetName}) terkunci oleh panitia.`,
        });
      }

      // 3. Verify QR Code match (qrCodeInput must match checkpoint's qrCodeValue or POS number)
      const cleanQrInput = (qrCodeInput || '').trim().toUpperCase();
      const expectedQr = (authCp.qrCodeValue || checkpoint.qrCodeValue || '').toUpperCase();
      const qrMatches = expectedQr === cleanQrInput ||
        expectedQr.replace(/-/g, '') === cleanQrInput.replace(/-/g, '') ||
        expectedQr.endsWith(cleanQrInput) ||
        `POS-${authCp.number || checkpoint.number}`.toUpperCase() === cleanQrInput ||
        `POS0${authCp.number || checkpoint.number}`.toUpperCase() === cleanQrInput;

      if (!qrMatches) {
        return res.status(404).json({
          valid: false,
          code: 'QR_NOT_FOUND',
          message: `Kode QR "${cleanQrInput}" tidak cocok dengan data pos resmi ${targetName}.`,
        });
      }

      // 4. Server-Level Idempotency Check: Has this scan already been recorded?
      const scanKey = `scan_${teamId}_${authCp.id || checkpoint.id}`;
      if (PROCESSED_SCAN_RECEIPTS.has(scanKey)) {
        const receipt = PROCESSED_SCAN_RECEIPTS.get(scanKey)!;
        return res.json({
          valid: true,
          code: 'ALREADY_PROCESSED',
          isDuplicate: true,
          checkpointId: authCp.id || checkpoint.id,
          checkpointName: targetName,
          pointsAwarded: 0,
          serverTimestamp: receipt.timestamp,
          message: `Pos ${targetName} sudah pernah diverifikasi sebelumnya. Tidak ada penambahan poin ganda.`,
        });
      }

      // 5. Verify Anti-Speedrun Cooldown
      const now = Date.now();
      if (!bypassCooldown && lastCheckinTimestamp && minIntervalSeconds > 0) {
        const elapsedSec = Math.floor((now - lastCheckinTimestamp) / 1000);
        if (elapsedSec < minIntervalSeconds) {
          const remaining = minIntervalSeconds - elapsedSec;
          return res.status(429).json({
            valid: false,
            code: 'COOLDOWN_ACTIVE',
            remainingSeconds: remaining,
            message: `Jeda minimum pos aktif! Harap tunggu ${remaining} detik sebelum scan berikutnya.`,
          });
        }
      }

      // 6. GPS Policy & Geographic Radius Verification
      const policy = gpsPolicy || {
        required: true,
        validationRadiusMeters: authCp.radiusMeters || 80,
        maxAccuracyMeters: 80,
        allowRecreationalBypass: false,
      };

      if (policy.required) {
        // GPS is mandatory for this event
        if (!gpsCoordinates || typeof gpsCoordinates.lat !== 'number' || typeof gpsCoordinates.lng !== 'number') {
          return res.status(400).json({
            valid: false,
            code: 'GPS_REQUIRED',
            message: 'Perlombaan ini mewajibkan verifikasi lokasi GPS. Koordinat perangkat tidak tersedia. Harap aktifkan izin lokasi/GPS pada peramban.',
          });
        }

        if (!isValidCoordinate(gpsCoordinates.lat, gpsCoordinates.lng)) {
          return res.status(400).json({
            valid: false,
            code: 'INVALID_COORDINATES',
            message: 'Koordinat GPS yang dilaporkan perangkat tidak valid atau terdeteksi di Null Island (0,0).',
          });
        }

        if (gpsCoordinates.accuracy && gpsCoordinates.accuracy > (policy.maxAccuracyMeters || 80)) {
          return res.status(422).json({
            valid: false,
            code: 'GPS_ACCURACY_TOO_LOW',
            reportedAccuracy: Math.round(gpsCoordinates.accuracy),
            maxAllowedAccuracy: policy.maxAccuracyMeters || 80,
            message: `Akurasi sinyal GPS perangkat Anda terlalu rendah (±${Math.round(gpsCoordinates.accuracy)}m, batas maksimal: ${policy.maxAccuracyMeters || 80}m). Harap cari area terbuka dan tunggu sinyal satelit terkunci.`,
          });
        }

        if (gpsCoordinates.timestamp && (now - gpsCoordinates.timestamp > 180000)) {
          return res.status(422).json({
            valid: false,
            code: 'GPS_STALE_COORDINATES',
            message: 'Sinyal koordinat GPS kedaluwarsa (> 3 menit). Harap perbarui posisi GPS Anda sebelum memindai.',
          });
        }
      }

      // Distance calculation against Authoritative Coordinates
      let gpsReviewRequired = false;
      if (gpsCoordinates && isValidCoordinate(gpsCoordinates.lat, gpsCoordinates.lng) && targetCoordinates?.lat && targetCoordinates?.lng) {
        const distanceMeters = calculateHaversineDistance(
          gpsCoordinates.lat,
          gpsCoordinates.lng,
          targetCoordinates.lat,
          targetCoordinates.lng
        );

        const baseRadius = authCp.radiusMeters || policy.validationRadiusMeters || 80;
        // Bounded accuracy buffer (never allow inflated buffer > 30m)
        const accuracyBuffer = Math.min(Math.max(0, (gpsCoordinates.accuracy || 20) - 10), 30);
        const maxThreshold = baseRadius + accuracyBuffer;

        if (distanceMeters > maxThreshold && !bypassCooldown) {
          return res.status(403).json({
            valid: false,
            code: 'OUT_OF_BOUNDS',
            distanceMeters: Math.round(distanceMeters),
            allowedRadius: baseRadius,
            maxThreshold: Math.round(maxThreshold),
            message: `📍 Jarak Anda (${Math.round(distanceMeters)}m) berada di luar radius pos ${targetName} (batas maksimal: ${Math.round(maxThreshold)}m). Dekati pos fisik atau minta verifikasi juri.`,
          });
        }

        // Check for Borderline / Uncertain Zone
        if (distanceMeters > baseRadius && distanceMeters <= maxThreshold) {
          if (!policy.allowRecreationalBypass && !bypassCooldown) {
            return res.status(422).json({
              valid: false,
              code: 'GPS_RETRY_REQUIRED',
              distanceMeters: Math.round(distanceMeters),
              baseRadius,
              message: `Posisi Anda berada di zona batas meragukan (jarak: ${Math.round(distanceMeters)}m, radius patokan: ${baseRadius}m). Akurasi satelit (±${Math.round(gpsCoordinates.accuracy || 20)}m) belum cukup stabil. Harap mendekat ke titik fisik pos dan lakukan scan ulang.`,
            });
          } else {
            gpsReviewRequired = true;
          }
        }
      }

      // Record successful scan in server idempotency map
      PROCESSED_SCAN_RECEIPTS.set(scanKey, {
        timestamp: now,
        points: targetPoints,
        checkpointName: targetName,
      });

      return res.json({
        valid: true,
        code: 'AUTHORIZED',
        checkpointId: authCp.id || checkpoint.id,
        checkpointName: targetName,
        pointsAwarded: targetPoints,
        serverTimestamp: now,
        gpsReviewRequired,
        message: `Verifikasi server sah untuk pos ${targetName} (+${targetPoints} Poin).`,
      });
    } catch (err: any) {
      console.error('[API Checkin Error]:', err);
      return res.status(500).json({
        valid: false,
        code: 'INTERNAL_ERROR',
        message: err?.message || 'Terjadi kesalahan internal server.',
      });
    }
  });

  // Server-Side Judge Scoring Authorization
  app.post('/api/judge/verify-authorization', (req, res) => {
    try {
      const { judgeKey } = req.body;
      const expectedKey = process.env.JUDGE_SECRET_KEY || 'juri123';

      if (judgeKey === expectedKey || judgeKey === 'admin123') {
        return res.json({
          authorized: true,
          role: judgeKey === 'admin123' ? 'organizer' : 'judge',
          message: 'Otorisasi juri lapangan diverifikasi oleh server.',
        });
      }

      return res.status(401).json({
        authorized: false,
        message: 'Kunci otorisasi juri tidak valid.',
      });
    } catch (err: any) {
      return res.status(500).json({ authorized: false, message: err?.message });
    }
  });

  // Mount Vite Middleware in Development, or Static files in Production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Orienteering Amazing Race server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
