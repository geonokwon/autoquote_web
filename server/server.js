import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

const DB_DIR = join(__dirname, '..', 'DB');
// Ensure DB directory exists
if (!existsSync(DB_DIR)) {
  mkdirSync(DB_DIR, { recursive: true });
}
const DB_FILE = join(DB_DIR, 'db.json');
const USERS_FILE = join(DB_DIR, 'users.json');
const SESSIONS_FILE = join(DB_DIR, 'sessions.json');

function loadDB() {
  const raw = readFileSync(DB_FILE, 'utf-8');
  return JSON.parse(raw);
}
function saveDB(db) {
  writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// ---------- util ----------
function ensureArray(db, arrayKey, objectSourceKey, converter) {
  if (Array.isArray(db[arrayKey])) return;

  // if array missing but source object exists
  if (objectSourceKey && typeof db[objectSourceKey] === 'object' && db[objectSourceKey] !== null) {
    db[arrayKey] = converter ? converter(db[objectSourceKey]) : Object.values(db[objectSourceKey]);
    return;
  }

  if (typeof db[arrayKey] === 'object' && db[arrayKey] !== null) {
    db[arrayKey] = converter ? converter(db[arrayKey]) : Object.values(db[arrayKey]);
  } else {
    db[arrayKey] = [];
  }
}

function nextId(list) {
  return list.length ? Math.max(...list.map((r) => r.id)) + 1 : 1;
}

function createCrud(pathBase, arrayKey, objectSourceKey = null, converter = null) {
  // READ ALL
  app.get(`/api/${pathBase}`, (_req, res) => {
    const db = loadDB();
    ensureArray(db, arrayKey, objectSourceKey, converter);
    res.json(db[arrayKey]);
  });

  // CREATE
  app.post(`/api/${pathBase}`, (req, res) => {
    const db = loadDB();
    ensureArray(db, arrayKey, objectSourceKey, converter);
    const list = db[arrayKey];
    const item = { id: nextId(list), ...req.body };
    list.push(item);
    saveDB(db);
    res.status(201).json(item);
  });

  // UPDATE
  app.put(`/api/${pathBase}/:id`, (req, res) => {
    const db = loadDB();
    ensureArray(db, arrayKey, objectSourceKey, converter);
    const id = req.params.id;
    db[arrayKey] = db[arrayKey].map((r) => (r.id == id ? { ...r, ...req.body } : r));
    saveDB(db);
    res.json({});
  });

  // DELETE
  app.delete(`/api/${pathBase}/:id`, (req, res) => {
    const db = loadDB();
    ensureArray(db, arrayKey, objectSourceKey, converter);
    const id = req.params.id;
    db[arrayKey] = db[arrayKey].filter((r) => r.id != id);
    saveDB(db);
    res.json({});
  });
}

// ——— define arrays conversion helpers
const productObjToRows = (obj) => {
  const rows = [];
  let id = 1;
  Object.entries(obj).forEach(([svc, detail]) => {
    Object.entries(detail).forEach(([opt, val]) => {
      if (opt === 'title') return;
      const { giftCard = 0, cash = 0, perQuantity } = val || {};
      rows.push({
        id: id++,
        serviceKey: svc,
        option: opt,
        giftCard,
        cash,
        ...(perQuantity ? { perQuantity } : {})
      });
    });
  });
  return rows;
};

const benefitObjToRows = (obj) => Object.entries(obj).map(([key, rule], idx) => ({ id: idx + 1, key, ...rule }));

// rows (array) -> object converter for benefit rules
const rowsToBenefitObj = (rows) => {
  const obj = {};
  rows.forEach((r) => {
    const { key, title, giftCard = 0, cash = 0, conditions = {} } = r;
    if (!key) return;
    obj[key] = { title, giftCard, cash, ...(conditions ? { conditions } : {}) };
  });
  return obj;
};

// CRUD routes
createCrud('services', 'services');
createCrud('combo-rules', 'comboRules');
createCrud('benefits', 'benefits');
createCrud('groups', 'groups');

// --------------------------
// Product Benefits (custom) : keep object form in db.json
// --------------------------

const rowsToProductObj = (rows, prevObj = {}) => {
  const obj = {};
  rows.forEach(({ serviceKey, option, giftCard = 0, cash = 0, perQuantity }) => {
    if (!obj[serviceKey]) {
      obj[serviceKey] = { title: prevObj[serviceKey]?.title || '' };
    }
    obj[serviceKey][option] = { giftCard, cash, ...(perQuantity ? { perQuantity } : {}) };
  });
  return obj;
};

// Prefer array-based storage if present, else fallback to legacy object structure

const readProductRows = (db) => {
  if (Array.isArray(db['product-benefits'])) return db['product-benefits'];
  return productObjToRows(db.productBenefits || {});
};

const writeProductRows = (db, rows) => {
  // If array collection already present, keep using it
  if (Array.isArray(db['product-benefits'])) {
    db['product-benefits'] = rows;
  } else {
    // legacy object form
    db.productBenefits = rowsToProductObj(rows, db.productBenefits || {});
  }
};

// READ ALL
app.get('/api/product-benefits', (_req, res) => {
  const db = loadDB();
  res.json(readProductRows(db));
});

// CREATE
app.post('/api/product-benefits', (req, res) => {
  const db = loadDB();
  const rows = readProductRows(db);
  const item = { id: nextId(rows), ...req.body };
  const newRows = [...rows, item];
  writeProductRows(db, newRows);
  saveDB(db);
  res.status(201).json(item);
});

// UPDATE
app.put('/api/product-benefits/:id', (req, res) => {
  const db = loadDB();
  const rows = readProductRows(db);
  const id = parseInt(req.params.id, 10);
  const newRows = rows.map((r) => (r.id === id ? { ...r, ...req.body } : r));
  writeProductRows(db, newRows);
  saveDB(db);
  res.json({});
});

// DELETE
app.delete('/api/product-benefits/:id', (req, res) => {
  const db = loadDB();
  const rows = readProductRows(db);
  const id = parseInt(req.params.id, 10);
  const newRows = rows.filter((r) => r.id !== id);
  writeProductRows(db, newRows);
  saveDB(db);
  res.json({});
});

// --------------------------
// Benefit Rules (keep rows array)
// --------------------------
createCrud('benefit-rules', 'benefitRuleRows', 'benefitRules', rowsToBenefitObj);

// --------------------------
// Bundle Benefits  (array only)  id|title|serviceKeys[]|ruleKeys[]
// --------------------------
createCrud('bundle-benefits', 'bundleBenefits');

// --------------------------
// Update Service Option Name (cascade update)
// --------------------------
app.put('/api/services/:id/update-option-name', (req, res) => {
  const { oldLabel, newLabel } = req.body;
  const serviceId = parseInt(req.params.id, 10);
  
  if (!oldLabel || !newLabel) {
    return res.status(400).json({ error: 'oldLabel and newLabel are required' });
  }
  
  const db = loadDB();
  
  // 1. Find the service and get its key
  const service = db.services?.find(s => s.id === serviceId);
  if (!service) {
    return res.status(404).json({ error: 'Service not found' });
  }
  
  const serviceKey = service.key;
  
  // 2. Update service options
  if (service.options) {
    service.options = service.options.map(opt => 
      opt.label === oldLabel ? { ...opt, label: newLabel } : opt
    );
  }
  
  // Helper function to update options array in conditions
  const updateConditionsOptions = (conditions) => {
    if (!conditions || !conditions.options) return conditions;
    
    if (conditions.options[serviceKey]) {
      conditions.options[serviceKey] = conditions.options[serviceKey].map(label =>
        label === oldLabel ? newLabel : label
      );
    }
    
    return conditions;
  };
  
  // 3. Update comboRules
  if (Array.isArray(db.comboRules)) {
    db.comboRules = db.comboRules.map(rule => ({
      ...rule,
      conditions: updateConditionsOptions(rule.conditions)
    }));
  }
  
  // 4. Update benefitRules (object form)
  if (db.benefitRules && typeof db.benefitRules === 'object') {
    Object.keys(db.benefitRules).forEach(ruleKey => {
      const rule = db.benefitRules[ruleKey];
      if (rule.conditions) {
        rule.conditions = updateConditionsOptions(rule.conditions);
      }
    });
  }
  
  // 5. Update benefitRuleRows (array form)
  if (Array.isArray(db.benefitRuleRows)) {
    db.benefitRuleRows = db.benefitRuleRows.map(rule => ({
      ...rule,
      conditions: updateConditionsOptions(rule.conditions)
    }));
  }
  
  // 6. Update product-benefits (array form)
  if (Array.isArray(db['product-benefits'])) {
    db['product-benefits'] = db['product-benefits'].map(benefit =>
      benefit.serviceKey === serviceKey && benefit.option === oldLabel
        ? { ...benefit, option: newLabel }
        : benefit
    );
  }
  
  // 7. Update productBenefits (object form) - legacy support
  if (db.productBenefits && db.productBenefits[serviceKey]) {
    const serviceBenefits = db.productBenefits[serviceKey];
    if (serviceBenefits[oldLabel]) {
      serviceBenefits[newLabel] = serviceBenefits[oldLabel];
      delete serviceBenefits[oldLabel];
    }
  }
  
  // Save updated database
  saveDB(db);
  
  res.json({ 
    success: true, 
    message: `Updated all references from "${oldLabel}" to "${newLabel}" for service "${service.name}"` 
  });
});

// ---------------- Memo (single object) ----------------
const MEMO_FILE = join(DB_DIR, 'memo.json');
function loadMemo() {
  try {
    return JSON.parse(readFileSync(MEMO_FILE, 'utf-8'));
  } catch (_) {
    return { defaultMemo: '' };
  }
}
function saveMemo(obj) {
  writeFileSync(MEMO_FILE, JSON.stringify(obj, null, 2));
}

// GET memo
app.get('/api/memo', (_req, res) => {
  res.json(loadMemo());
});

// PUT memo (replace)
app.put('/api/memo', (req, res) => {
  const obj = typeof req.body === 'object' && req.body ? req.body : {};
  saveMemo(obj);
  res.json({});
});

// --------------------------
// Quotes (estimates) JSON files
// --------------------------
const QUOTE_DIR = join(__dirname, 'quotes');
await fs.mkdir(QUOTE_DIR, { recursive: true });

// List all quote files
app.get('/api/quotes', async (_req, res) => {
  const files = await fs.readdir(QUOTE_DIR);
  const list = await Promise.all(
    files
      .filter((f) => f.endsWith('.json'))
      .map(async (f) => {
        const data = JSON.parse(await fs.readFile(join(QUOTE_DIR, f), 'utf8'));
        const stat = await fs.stat(join(QUOTE_DIR, f));
        return {
          fileName: f,
          modifiedAt: stat.mtime,
          title: data.title || '',
          finalTotal: data.finalTotal || 0
        };
      })
  );
  res.json(list.sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt)));
});

// Save (new or overwrite)
app.post('/api/quotes', async (req, res) => {
  const title = (req.body?.title || req.body?.estimateTitle || 'untitled').toString().replace(/\s+/g, '');
  let fileName = `${title}.json`;
  // If file exists, overwrite; user is okay with replacing.
  await fs.writeFile(join(QUOTE_DIR, fileName), JSON.stringify(req.body, null, 2));
  res.status(201).json({ file: fileName });
});

// Get single
app.get('/api/quotes/:file', async (req, res) => {
  try {
    const data = await fs.readFile(join(QUOTE_DIR, req.params.file), 'utf8');
    res.json(JSON.parse(data));
  } catch {
    res.status(404).json({ msg: 'not found' });
  }
});

// Delete
app.delete('/api/quotes/:file', async (req, res) => {
  try {
    await fs.rm(join(QUOTE_DIR, req.params.file));
    res.json({ ok: true });
  } catch {
    res.status(404).json({ msg: 'not found' });
  }
});

// -------------------- users & sessions helpers --------------------
function ensureUsersFile() {
  try {
    readFileSync(USERS_FILE);
  } catch {
    // Initial credentials as requested
    const userPw = bcrypt.hashSync('Rhcdlek0907!@', 10);
    const adminPw = bcrypt.hashSync('Rhcdlek0907!@', 10);
    const users = [
      { id: 1, username: 'genieone', passwordHash: userPw, role: 'user' },
      { id: 2, username: 'genieone_admin', passwordHash: adminPw, role: 'admin' }
    ];
    writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  }
}

function loadUsers() {
  ensureUsersFile();
  return JSON.parse(readFileSync(USERS_FILE, 'utf-8'));
}

function saveUsers(list) {
  writeFileSync(USERS_FILE, JSON.stringify(list, null, 2));
}

function ensureSessionsFile() {
  try {
    readFileSync(SESSIONS_FILE);
  } catch {
    writeFileSync(SESSIONS_FILE, '[]');
  }
}

function loadSessions() {
  ensureSessionsFile();
  return JSON.parse(readFileSync(SESSIONS_FILE, 'utf-8'));
}

function saveSessions(list) {
  writeFileSync(SESSIONS_FILE, JSON.stringify(list, null, 2));
}

function cleanupSessions() {
  const sessions = loadSessions();
  const now = Date.now();
  const filtered = sessions.filter((s) => s.expiresAt > now);
  if (filtered.length !== sessions.length) {
    saveSessions(filtered);
  }
  return filtered;
}

// After helper functions
cleanupSessions();

// Ensure files exist at server start
ensureUsersFile();
ensureSessionsFile();

// -------------------- auth middleware --------------------
function auth(req, res, next) {
  const token = req.cookies?.session;
  if (!token) return res.status(401).json({ msg: 'unauthenticated' });

  const sessions = cleanupSessions();
  const sess = sessions.find((s) => s.token === token);
  if (!sess) {
    res.clearCookie('session');
    return res.status(401).json({ msg: 'unauthenticated' });
  }
  const users = loadUsers();
  const user = users.find((u) => u.id === sess.userId);
  if (!user) {
    res.clearCookie('session');
    return res.status(401).json({ msg: 'unauthenticated' });
  }
  req.user = { id: user.id, username: user.username, role: user.role };
  next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ msg: 'unauthenticated' });
    if (req.user.role !== role) return res.status(403).json({ msg: 'forbidden' });
    next();
  };
}

// Apply auth to all /api routes except /api/login
app.use('/api', (req, res, next) => {
  if (req.path === '/login') return next();
  return auth(req, res, next);
});

// -------------------- auth routes --------------------
app.post('/api/login', async (req, res) => {
  const { username, password, autoLogin } = req.body || {};
  const users = loadUsers();
  const user = users.find((u) => u.username === username);
  if (!user) return res.status(401).json({ msg: 'invalid credentials' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ msg: 'invalid credentials' });

  const token = randomUUID();
  const expiresAt = Date.now() + (autoLogin ? 10 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000);
  let sessions = cleanupSessions();
  // remove existing sessions for same user (optional: keep multiple if needed)
  sessions = sessions.filter(s => s.userId !== user.id);
  sessions.push({ token, userId: user.id, expiresAt });
  saveSessions(sessions);

  res.cookie('session', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: expiresAt - Date.now()
    // secure: true  // enable in production with https
  });

  res.json({ id: user.id, username: user.username, role: user.role });
});

app.post('/api/logout', auth, (req, res) => {
  const token = req.cookies?.session;
  const sessions = loadSessions().filter((s) => s.token !== token);
  saveSessions(sessions);
  res.clearCookie('session');
  res.json({});
});

app.get('/api/me', auth, (req, res) => {
  res.json(req.user);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API server listening on ${PORT}`));