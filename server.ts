import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createServer as createViteServer} from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '20122026';
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'rsvps.json');

type AttendanceStatus = 'attending' | 'not_attending';
type GuestType = 'alone' | 'family' | 'single_plus_one';

interface Companion {
  id: string;
  name: string;
  relationship: string;
  age?: string;
}

interface RsvpRecord {
  id: string;
  code: string;
  employeeName: string;
  employeeRole: string;
  phone: string;
  attendance: AttendanceStatus;
  guestType: GuestType;
  companions: Companion[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

const SINGLE_RELATIONSHIPS = new Set([
  'Namorado(a)',
  'Amigo(a)',
  'Mãe / Pai',
  'Irmão / Irmã',
  'Acompanhante',
]);

function ensureDataFile(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, {recursive: true});
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]', 'utf8');
  }
}

function readRsvps(): RsvpRecord[] {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRsvps(records: RsvpRecord[]): void {
  ensureDataFile();
  const tempFile = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(records, null, 2), 'utf8');
  fs.renameSync(tempFile, DATA_FILE);
}

function computeStats(records: RsvpRecord[]) {
  let attendingEmployees = 0;
  let notAttendingEmployees = 0;
  let totalSpouses = 0;
  let totalChildren = 0;
  let totalSingleCompanions = 0;

  for (const r of records) {
    if (r.attendance === 'attending') {
      attendingEmployees += 1;
      for (const c of r.companions) {
        if (c.relationship === 'Cônjuge') {
          totalSpouses += 1;
        } else if (c.relationship === 'Filho(a)') {
          totalChildren += 1;
        } else {
          totalSingleCompanions += 1;
        }
      }
    } else {
      notAttendingEmployees += 1;
    }
  }

  const totalPeople =
    attendingEmployees + totalSpouses + totalChildren + totalSingleCompanions;

  return {
    totalResponses: records.length,
    attendingEmployees,
    notAttendingEmployees,
    totalPeople,
    totalSpouses,
    totalChildren,
    totalSingleCompanions,
  };
}

function validateAndNormalizePayload(
  body: unknown,
): {ok: true; data: Omit<RsvpRecord, 'id' | 'code' | 'createdAt' | 'updatedAt'>} | {ok: false; error: string} {
  if (!body || typeof body !== 'object') {
    return {ok: false, error: 'Dados inválidos.'};
  }

  const input = body as Record<string, unknown>;
  const employeeName = typeof input.employeeName === 'string' ? input.employeeName.trim() : '';
  const employeeRole = typeof input.employeeRole === 'string' ? input.employeeRole.trim().slice(0, 80) : '';
  const phone = typeof input.phone === 'string' ? input.phone.trim().slice(0, 30) : '';
  const notes = typeof input.notes === 'string' ? input.notes.trim().slice(0, 300) : '';
  const attendance = input.attendance;
  const guestType = input.guestType;

  if (employeeName.length < 2 || employeeName.length > 100) {
    return {ok: false, error: 'Informe o nome completo do(a) funcionário(a) (entre 2 e 100 caracteres).'};
  }

  if (attendance !== 'attending' && attendance !== 'not_attending') {
    return {ok: false, error: 'Selecione se irá participar ou não do evento.'};
  }

  if (guestType !== 'alone' && guestType !== 'family' && guestType !== 'single_plus_one') {
    return {ok: false, error: 'Tipo de convite inválido.'};
  }

  const rawCompanions = Array.isArray(input.companions) ? input.companions : [];
  const companions: Companion[] = [];

  if (attendance === 'not_attending' || guestType === 'alone') {
    return {
      ok: true,
      data: {
        employeeName,
        employeeRole,
        phone,
        attendance,
        guestType: attendance === 'not_attending' ? 'alone' : guestType,
        companions: [],
        notes,
      },
    };
  }

  if (guestType === 'family') {
    let spouseCount = 0;
    for (const item of rawCompanions) {
      if (!item || typeof item !== 'object') continue;
      const c = item as Record<string, unknown>;
      const name = typeof c.name === 'string' ? c.name.trim() : '';
      const relationship = typeof c.relationship === 'string' ? c.relationship.trim() : '';
      const age = typeof c.age === 'string' ? c.age.trim().slice(0, 20) : '';

      if (name.length < 2 || name.length > 100) {
        return {ok: false, error: 'Todos os acompanhantes precisam ter nome completo válido.'};
      }
      if (relationship !== 'Cônjuge' && relationship !== 'Filho(a)') {
        return {
          ok: false,
          error: 'Na modalidade Família, apenas Cônjuge e Filho(a) podem ser adicionados.',
        };
      }
      if (relationship === 'Cônjuge') {
        spouseCount += 1;
        if (spouseCount > 1) {
          return {ok: false, error: 'É permitido adicionar no máximo 1 cônjuge.'};
        }
      }
      companions.push({
        id: typeof c.id === 'string' && c.id ? c.id.slice(0, 50) : crypto.randomUUID(),
        name,
        relationship,
        ...(relationship === 'Filho(a)' && age ? {age} : {}),
      });
    }
    if (companions.length > 16) {
      return {ok: false, error: 'Limite máximo de acompanhantes excedido.'};
    }
  }

  if (guestType === 'single_plus_one') {
    if (rawCompanions.length > 1) {
      return {
        ok: false,
        error: 'Funcionários solteiros têm direito a no máximo 1 acompanhante.',
      };
    }
    for (const item of rawCompanions) {
      if (!item || typeof item !== 'object') continue;
      const c = item as Record<string, unknown>;
      const name = typeof c.name === 'string' ? c.name.trim() : '';
      const relationship = typeof c.relationship === 'string' ? c.relationship.trim() : '';

      if (name.length < 2 || name.length > 100) {
        return {ok: false, error: 'Informe o nome completo do acompanhante.'};
      }
      if (!SINGLE_RELATIONSHIPS.has(relationship)) {
        return {ok: false, error: 'Selecione um grau de parentesco ou vínculo válido.'};
      }
      companions.push({
        id: typeof c.id === 'string' && c.id ? c.id.slice(0, 50) : crypto.randomUUID(),
        name,
        relationship,
      });
    }
  }

  return {
    ok: true,
    data: {
      employeeName,
      employeeRole,
      phone,
      attendance,
      guestType,
      companions,
      notes,
    },
  };
}

function generateConfirmationCode(): string {
  const randomDigits = crypto.randomInt(1000, 9999);
  return `CAL-${randomDigits}`;
}

function isAuthorizedAdmin(req: express.Request): boolean {
  const headerPassword = req.header('x-admin-password');
  return typeof headerPassword === 'string' && headerPassword === ADMIN_PASSWORD;
}

async function startServer() {
  ensureDataFile();
  const app = express();
  app.use(express.json({limit: '1mb'}));

  app.get('/api/health', (_req, res) => {
    res.json({status: 'ok'});
  });

  app.get('/api/stats', (_req, res) => {
    const records = readRsvps();
    res.json(computeStats(records));
  });

  app.post('/api/rsvps', (req, res) => {
    const validated = validateAndNormalizePayload(req.body);
    if (!validated.ok) {
      res.status(400).json({error: validated.error});
      return;
    }

    const records = readRsvps();
    const now = new Date().toISOString();
    const record: RsvpRecord = {
      id: crypto.randomUUID(),
      code: generateConfirmationCode(),
      ...validated.data,
      createdAt: now,
      updatedAt: now,
    };

    records.unshift(record);
    writeRsvps(records);

    res.status(201).json({rsvp: record, stats: computeStats(records)});
  });

  app.post('/api/admin/verify', (req, res) => {
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (password === ADMIN_PASSWORD) {
      res.json({valid: true});
      return;
    }
    res.status(401).json({valid: false, error: 'Senha incorreta.'});
  });

  app.get('/api/admin/rsvps', (req, res) => {
    if (!isAuthorizedAdmin(req)) {
      res.status(401).json({error: 'Acesso não autorizado. Senha inválida.'});
      return;
    }
    const records = readRsvps();
    res.json({rsvps: records, stats: computeStats(records)});
  });

  app.put('/api/admin/rsvps/:id', (req, res) => {
    if (!isAuthorizedAdmin(req)) {
      res.status(401).json({error: 'Senha de confirmação incorreta.'});
      return;
    }

    const {id} = req.params;
    const validated = validateAndNormalizePayload(req.body);
    if (!validated.ok) {
      res.status(400).json({error: validated.error});
      return;
    }

    const records = readRsvps();
    const index = records.findIndex((r) => r.id === id);
    if (index === -1) {
      res.status(404).json({error: 'Confirmação não encontrada.'});
      return;
    }

    const updated: RsvpRecord = {
      ...records[index],
      ...validated.data,
      updatedAt: new Date().toISOString(),
    };
    records[index] = updated;
    writeRsvps(records);

    res.json({rsvp: updated, stats: computeStats(records)});
  });

  app.delete('/api/admin/rsvps/:id', (req, res) => {
    if (!isAuthorizedAdmin(req)) {
      res.status(401).json({error: 'Senha de confirmação incorreta.'});
      return;
    }

    const {id} = req.params;
    const records = readRsvps();
    const nextRecords = records.filter((r) => r.id !== id);

    if (nextRecords.length === records.length) {
      res.status(404).json({error: 'Confirmação não encontrada.'});
      return;
    }

    writeRsvps(nextRecords);
    res.json({deleted: true, stats: computeStats(nextRecords)});
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {middlewareMode: true},
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Caleidoscópio server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
