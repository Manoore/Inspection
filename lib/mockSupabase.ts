import {
  MOCK_USERS, MOCK_LOCATIONS, MOCK_CHECKLISTS, MOCK_CHECKLIST_ITEMS,
  MOCK_HEALTH_SCORES, MOCK_INSPECTIONS, MOCK_CORRECTIVE_ACTIONS,
  MOCK_TRAINING_MODULES, MOCK_TRAINING_COMPLETIONS, MOCK_INQUIRIES,
  MOCK_ESCALATION_CONFIG, MOCK_INSPECTION_RESPONSES,
} from "./mockData";

// ── Table registry ────────────────────────────────────────────────────────────

const TABLE_DATA: Record<string, any[]> = {
  users:                MOCK_USERS,
  locations:            MOCK_LOCATIONS,
  checklists:           MOCK_CHECKLISTS,
  checklist_items:      MOCK_CHECKLIST_ITEMS,
  health_scores:        MOCK_HEALTH_SCORES,
  inspections:          MOCK_INSPECTIONS,
  inspection_responses: MOCK_INSPECTION_RESPONSES,
  corrective_actions:   MOCK_CORRECTIVE_ACTIONS,
  training_modules:     MOCK_TRAINING_MODULES,
  training_completions: MOCK_TRAINING_COMPLETIONS,
  inquiries:            MOCK_INQUIRIES,
  escalation_configs:   [MOCK_ESCALATION_CONFIG],
};

// ── Chainable query builder ───────────────────────────────────────────────────

type FilterOp = { field: string; op: "eq" | "in" | "neq" | "contains" | "overlaps"; value: any };

class QueryBuilder {
  private _table: string;
  private _filters: FilterOp[] = [];
  private _orderField?: string;
  private _orderAsc = true;
  private _limitN?: number;
  private _single = false;
  private _selectCols = "*";
  private _insertData?: any;
  private _updateData?: any;
  private _upsertData?: any;
  private _isInsert = false;
  private _isUpdate = false;
  private _isUpsert = false;

  constructor(table: string) {
    this._table = table;
  }

  select(cols = "*") { this._selectCols = cols; return this; }
  insert(data: any)  { this._isInsert = true; this._insertData = data; return this; }
  update(data: any)  { this._isUpdate = true; this._updateData = data; return this; }
  upsert(data: any)  { this._isUpsert = true; this._upsertData = data; return this; }

  eq(field: string, value: any)       { this._filters.push({ field, op: "eq",       value }); return this; }
  neq(field: string, value: any)      { this._filters.push({ field, op: "neq",      value }); return this; }
  in(field: string, value: any[])     { this._filters.push({ field, op: "in",       value }); return this; }
  contains(field: string, value: any) { this._filters.push({ field, op: "contains", value }); return this; }
  overlaps(field: string, value: any) { this._filters.push({ field, op: "overlaps", value }); return this; }
  not(field: string, _op: string, _val: any) { return this; }

  order(field: string, opts?: { ascending?: boolean }) {
    this._orderField = field;
    this._orderAsc   = opts?.ascending !== false;
    return this;
  }
  limit(n: number) { this._limitN = n; return this; }
  single()         { this._single = true; return this; }

  private resolveJoins(rows: any[]): any[] {
    const pattern = /(\w+)\(([^)]+)\)/g;
    const joins: { table: string; cols: string[] }[] = [];
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(this._selectCols)) !== null) {
      joins.push({ table: m[1], cols: m[2].split(",").map((c) => c.trim()) });
    }
    if (!joins.length) return rows;
    return rows.map((row) => {
      const out = { ...row };
      for (const join of joins) {
        const related = TABLE_DATA[join.table] ?? [];
        // Try common FK names to find the linked row
        const fkCandidates = [
          `${join.table.replace(/s$/, "")}_id`,  // locations→location_id, users→user_id
          "item_id",       // checklist_items linked via item_id
          "inspector_id",  // users linked via inspector_id on inspections
        ];
        let found: any = null;
        for (const fk of fkCandidates) {
          if (row[fk]) { found = related.find((r: any) => r.id === row[fk]); if (found) break; }
        }
        if (!found) { out[join.table] = null; continue; }
        const picked: Record<string, any> = {};
        join.cols.forEach((col) => { picked[col] = found[col]; });
        out[join.table] = picked;
      }
      return out;
    });
  }

  private applyFilters(rows: any[]): any[] {
    return rows.filter((row) =>
      this._filters.every(({ field, op, value }) => {
        const v = row[field];
        if (op === "eq")       return v === value;
        if (op === "neq")      return v !== value;
        if (op === "in")       return Array.isArray(value) && value.includes(v);
        if (op === "contains") return Array.isArray(v) && value.every((x: any) => v.includes(x));
        if (op === "overlaps") return Array.isArray(v) && Array.isArray(value) && value.some((x: any) => v.includes(x));
        return true;
      })
    );
  }

  then(resolve: (result: { data: any; error: any }) => void) {
    // mutations
    if (this._isInsert) {
      const rows = Array.isArray(this._insertData) ? this._insertData : [this._insertData];
      rows.forEach((r) => { if (r && !r.id) r.id = `mock-${Date.now()}-${Math.random()}`; });
      TABLE_DATA[this._table] = [...(TABLE_DATA[this._table] ?? []), ...rows];
      const result = this._single ? rows[0] : rows;
      return resolve({ data: result, error: null });
    }
    if (this._isUpdate) {
      TABLE_DATA[this._table] = (TABLE_DATA[this._table] ?? []).map((row) => {
        const matches = this._filters.every(({ field, op, value }) =>
          op === "eq" ? row[field] === value : true
        );
        return matches ? { ...row, ...this._updateData } : row;
      });
      return resolve({ data: null, error: null });
    }
    if (this._isUpsert) {
      return resolve({ data: null, error: null });
    }

    // reads
    let rows = [...(TABLE_DATA[this._table] ?? [])];
    rows = this.applyFilters(rows);

    if (this._orderField) {
      const f = this._orderField;
      rows.sort((a, b) => {
        const asc = this._orderAsc;
        if (a[f] < b[f]) return asc ? -1 : 1;
        if (a[f] > b[f]) return asc ? 1  : -1;
        return 0;
      });
    }
    if (this._limitN != null) rows = rows.slice(0, this._limitN);

    rows = this.resolveJoins(rows);
    const data = this._single ? (rows[0] ?? null) : rows;
    return resolve({ data, error: null });
  }
}

// ── Mock auth ─────────────────────────────────────────────────────────────────

const MOCK_SESSIONS: Record<string, string> = {
  "admin@test.com":   "user-admin-1",
  "field@test.com":   "user-field-1",
  "auditor@test.com": "user-auditor-1",
};
const MOCK_PASSWORD = "password123";

let _currentUserId: string | null = null;

const mockAuth = {
  getSession: async () => {
    if (!_currentUserId) return { data: { session: null } };
    return { data: { session: { user: { id: _currentUserId } } } };
  },
  signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
    const userId = MOCK_SESSIONS[email.toLowerCase()];
    if (!userId || password !== MOCK_PASSWORD) {
      return { data: null, error: { message: "Invalid email or password. Try admin@test.com / password123" } };
    }
    _currentUserId = userId;
    return { data: { user: { id: userId }, session: { user: { id: userId } } }, error: null };
  },
  signOut: async () => { _currentUserId = null; return { error: null }; },
  onAuthStateChange: (_event: any, _cb: any) => ({ data: { subscription: { unsubscribe: () => {} } } }),
};

// ── Public mock client ────────────────────────────────────────────────────────

export const mockSupabase = {
  auth: mockAuth,
  from: (table: string) => new QueryBuilder(table),
};
