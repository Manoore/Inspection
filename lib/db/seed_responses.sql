-- ============================================================
-- Complete inspection + response seed
-- Run in Supabase SQL Editor. Re-runnable.
-- Creates inspections if they don't exist, then seeds
-- all inspection_responses linked to them.
-- ============================================================

DO $$
DECLARE
  -- Users
  field_uid  text;
  admin_uid  text;
  -- Locations
  loc_wm     text;   -- West Market
  loc_fl     text;   -- Fairlawn
  loc_bw     text;   -- Beachwood
  -- Checklists
  cl_uc      text;   -- Urgent Care Daily
  cl_oh      text;   -- Occ Health
  -- Checklist items
  item_med_fridge    text;
  item_vac_fridge    text;
  item_ppe           text;
  item_exam_rooms    text;
  item_sharps        text;
  item_autoclave     text;
  item_lab_cal       text;
  item_ekg           text;
  item_dot_kits      text;
  item_breathalyzer  text;
  item_coc_forms     text;
  item_bwc_logs      text;
  -- Inspections
  ins_88  text;
  ins_75  text;
  ins_62  text;
  ins_50  text;
BEGIN

  -- ── Users ───────────────────────────────────────────────────
  SELECT id::text INTO field_uid FROM public.users WHERE email ILIKE '%field%' LIMIT 1;
  SELECT id::text INTO admin_uid FROM public.users WHERE email ILIKE '%admin%' LIMIT 1;
  RAISE NOTICE 'Users — field: %, admin: %', field_uid, admin_uid;

  -- ── Locations ───────────────────────────────────────────────
  SELECT id::text INTO loc_wm FROM public.locations WHERE name ILIKE '%West Market%'  LIMIT 1;
  SELECT id::text INTO loc_fl FROM public.locations WHERE name ILIKE '%Fairlawn%'      LIMIT 1;
  SELECT id::text INTO loc_bw FROM public.locations WHERE name ILIKE '%Beachwood%'     LIMIT 1;
  RAISE NOTICE 'Locations — wm: %, fl: %, bw: %', loc_wm, loc_fl, loc_bw;

  -- ── Checklists ──────────────────────────────────────────────
  SELECT id::text INTO cl_uc FROM public.checklists WHERE name ILIKE '%Urgent Care%'      LIMIT 1;
  SELECT id::text INTO cl_oh FROM public.checklists WHERE name ILIKE '%Occupational%'     LIMIT 1;
  RAISE NOTICE 'Checklists — uc: %, oh: %', cl_uc, cl_oh;

  -- ── Checklist Items ─────────────────────────────────────────
  SELECT id::text INTO item_med_fridge   FROM public.checklist_items WHERE label ILIKE '%Medication fridge temp%'  LIMIT 1;
  SELECT id::text INTO item_vac_fridge   FROM public.checklist_items WHERE label ILIKE '%Vaccine fridge temp%'     LIMIT 1;
  SELECT id::text INTO item_ppe          FROM public.checklist_items WHERE label ILIKE '%PPE stock%'               LIMIT 1;
  SELECT id::text INTO item_exam_rooms   FROM public.checklist_items WHERE label ILIKE '%Exam rooms%'              LIMIT 1;
  SELECT id::text INTO item_sharps       FROM public.checklist_items WHERE label ILIKE '%Sharps container%'        LIMIT 1;
  SELECT id::text INTO item_autoclave    FROM public.checklist_items WHERE label ILIKE '%Autoclave%'               LIMIT 1;
  SELECT id::text INTO item_lab_cal      FROM public.checklist_items WHERE label ILIKE '%calibration stickers%'    LIMIT 1;
  SELECT id::text INTO item_ekg          FROM public.checklist_items WHERE label ILIKE '%EKG%'                     LIMIT 1;
  SELECT id::text INTO item_dot_kits     FROM public.checklist_items WHERE label ILIKE '%DOT drug test kits%'      LIMIT 1;
  SELECT id::text INTO item_breathalyzer FROM public.checklist_items WHERE label ILIKE '%Breathalyzer%'            LIMIT 1;
  SELECT id::text INTO item_coc_forms    FROM public.checklist_items WHERE label ILIKE '%Chain-of-custody%'        LIMIT 1;
  SELECT id::text INTO item_bwc_logs     FROM public.checklist_items WHERE label ILIKE '%BWC%'                     LIMIT 1;
  RAISE NOTICE 'Items — med: %, ppe: %, sharps: %, dot: %', item_med_fridge, item_ppe, item_sharps, item_dot_kits;

  -- ── Inspections — create if missing ─────────────────────────
  -- ins-1: West Market Jun 9, score 88
  SELECT id::text INTO ins_88 FROM public.inspections WHERE score = 88 LIMIT 1;
  IF ins_88 IS NULL AND loc_wm IS NOT NULL AND field_uid IS NOT NULL THEN
    INSERT INTO public.inspections
      (location_id, checklist_id, inspector_id, status, started_at, completed_at, score)
    VALUES
      (loc_wm, cl_uc, field_uid, 'completed', '2026-06-09T09:00:00Z', '2026-06-09T09:45:00Z', 88)
    RETURNING id::text INTO ins_88;
    RAISE NOTICE 'Created inspection score=88: %', ins_88;
  ELSE
    RAISE NOTICE 'Found inspection score=88: %', ins_88;
  END IF;

  -- ins-2: West Market Jun 5, score 75
  SELECT id::text INTO ins_75 FROM public.inspections WHERE score = 75 LIMIT 1;
  IF ins_75 IS NULL AND loc_wm IS NOT NULL AND field_uid IS NOT NULL THEN
    INSERT INTO public.inspections
      (location_id, checklist_id, inspector_id, status, started_at, completed_at, score)
    VALUES
      (loc_wm, cl_uc, field_uid, 'completed', '2026-06-05T08:30:00Z', '2026-06-05T09:10:00Z', 75)
    RETURNING id::text INTO ins_75;
    RAISE NOTICE 'Created inspection score=75: %', ins_75;
  ELSE
    RAISE NOTICE 'Found inspection score=75: %', ins_75;
  END IF;

  -- ins-3: Fairlawn Jun 8, score 62
  SELECT id::text INTO ins_62 FROM public.inspections WHERE score = 62 LIMIT 1;
  IF ins_62 IS NULL AND loc_fl IS NOT NULL AND field_uid IS NOT NULL THEN
    INSERT INTO public.inspections
      (location_id, checklist_id, inspector_id, status, started_at, completed_at, score)
    VALUES
      (loc_fl, cl_uc, field_uid, 'completed', '2026-06-08T10:00:00Z', '2026-06-08T10:50:00Z', 62)
    RETURNING id::text INTO ins_62;
    RAISE NOTICE 'Created inspection score=62: %', ins_62;
  ELSE
    RAISE NOTICE 'Found inspection score=62: %', ins_62;
  END IF;

  -- ins-4: Beachwood Jun 7, score 50
  SELECT id::text INTO ins_50 FROM public.inspections WHERE score = 50 LIMIT 1;
  IF ins_50 IS NULL AND loc_bw IS NOT NULL AND field_uid IS NOT NULL THEN
    INSERT INTO public.inspections
      (location_id, checklist_id, inspector_id, status, started_at, completed_at, score)
    VALUES
      (loc_bw, cl_oh, field_uid, 'completed', '2026-06-07T14:00:00Z', '2026-06-07T14:40:00Z', 50)
    RETURNING id::text INTO ins_50;
    RAISE NOTICE 'Created inspection score=50: %', ins_50;
  ELSE
    RAISE NOTICE 'Found inspection score=50: %', ins_50;
  END IF;

  RAISE NOTICE 'Inspections — 88: %, 75: %, 62: %, 50: %', ins_88, ins_75, ins_62, ins_50;

  -- ── Responses ───────────────────────────────────────────────
  DELETE FROM public.inspection_responses;

  IF ins_88 IS NOT NULL THEN
    INSERT INTO public.inspection_responses (inspection_id, item_id, value, passed, notes) VALUES
      (ins_88, item_med_fridge,   '41°F', true,  null),
      (ins_88, item_vac_fridge,   '48°F', false, 'Slightly above range — reported to facility manager'),
      (ins_88, item_ppe,          'Pass', true,  null),
      (ins_88, item_exam_rooms,   'Pass', true,  null),
      (ins_88, item_sharps,       'Pass', true,  null),
      (ins_88, item_autoclave,    'Yes',  true,  null),
      (ins_88, item_lab_cal,      'Pass', true,  null),
      (ins_88, item_ekg,          'Pass', true,  null);
  END IF;

  IF ins_75 IS NOT NULL THEN
    INSERT INTO public.inspection_responses (inspection_id, item_id, value, passed, notes) VALUES
      (ins_75, item_med_fridge,   '50°F', false, 'Door seal may be failing — corrective action raised'),
      (ins_75, item_vac_fridge,   '38°F', true,  null),
      (ins_75, item_ppe,          'Pass', true,  null),
      (ins_75, item_exam_rooms,   'Pass', true,  null),
      (ins_75, item_sharps,       'Pass', true,  null),
      (ins_75, item_autoclave,    'Yes',  true,  null),
      (ins_75, item_lab_cal,      'Fail', false, 'Centrifuge calibration sticker expired 2026-05-20'),
      (ins_75, item_ekg,          'Pass', true,  null);
  END IF;

  IF ins_62 IS NOT NULL THEN
    INSERT INTO public.inspection_responses (inspection_id, item_id, value, passed, notes) VALUES
      (ins_62, item_med_fridge,   '43°F', true,  null),
      (ins_62, item_vac_fridge,   '40°F', true,  null),
      (ins_62, item_ppe,          'Fail', false, 'Gloves (S) and N95 masks below reorder threshold'),
      (ins_62, item_exam_rooms,   'Pass', true,  null),
      (ins_62, item_sharps,       'Fail', false, 'Container in Exam Room 3 over ¾ full'),
      (ins_62, item_autoclave,    'Yes',  true,  null),
      (ins_62, item_lab_cal,      'Fail', false, 'Centrifuge sticker expired 2026-05-15'),
      (ins_62, item_ekg,          'Pass', true,  null);
  END IF;

  IF ins_50 IS NOT NULL THEN
    INSERT INTO public.inspection_responses (inspection_id, item_id, value, passed, notes) VALUES
      (ins_50, item_dot_kits,     'Fail', false, 'DOT kits expired 2026-06-01 — emergency replacement ordered'),
      (ins_50, item_breathalyzer, 'No',   false, 'Last calibrated 2025-05-10, overdue by 1 month'),
      (ins_50, item_coc_forms,    'Pass', true,  null),
      (ins_50, item_bwc_logs,     'Yes',  true,  null);
  END IF;

  RAISE NOTICE 'Done. Total inspection_responses: %', (SELECT count(*) FROM public.inspection_responses);
END $$;
