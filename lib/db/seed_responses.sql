-- ============================================================
-- Seed inspection_responses + inspection logs
-- Run this in Supabase SQL Editor AFTER schema.sql and your
-- existing location/checklist/inspection seed data.
-- Safe to re-run (clears and re-inserts).
-- ============================================================

DO $$
DECLARE
  -- Checklist items resolved by label
  item_med_fridge    uuid;
  item_vac_fridge    uuid;
  item_ppe           uuid;
  item_exam_rooms    uuid;
  item_sharps        uuid;
  item_autoclave     uuid;
  item_lab_cal       uuid;
  item_ekg           uuid;
  item_dot_kits      uuid;
  item_breathalyzer  uuid;
  item_coc_forms     uuid;
  item_bwc_logs      uuid;
  -- Inspections resolved by score (assumes unique scores per seed)
  ins_88  uuid;
  ins_75  uuid;
  ins_62  uuid;
  ins_50  uuid;
BEGIN

  -- ── Resolve checklist item IDs ─────────────────────────────
  SELECT id INTO item_med_fridge   FROM public.checklist_items WHERE label ILIKE '%Medication fridge temp%'       LIMIT 1;
  SELECT id INTO item_vac_fridge   FROM public.checklist_items WHERE label ILIKE '%Vaccine fridge temp%'          LIMIT 1;
  SELECT id INTO item_ppe          FROM public.checklist_items WHERE label ILIKE '%PPE stock%'                    LIMIT 1;
  SELECT id INTO item_exam_rooms   FROM public.checklist_items WHERE label ILIKE '%Exam rooms%'                   LIMIT 1;
  SELECT id INTO item_sharps       FROM public.checklist_items WHERE label ILIKE '%Sharps container%'             LIMIT 1;
  SELECT id INTO item_autoclave    FROM public.checklist_items WHERE label ILIKE '%Autoclave%'                    LIMIT 1;
  SELECT id INTO item_lab_cal      FROM public.checklist_items WHERE label ILIKE '%calibration stickers%'         LIMIT 1;
  SELECT id INTO item_ekg          FROM public.checklist_items WHERE label ILIKE '%EKG%'                          LIMIT 1;
  SELECT id INTO item_dot_kits     FROM public.checklist_items WHERE label ILIKE '%DOT drug test kits%'           LIMIT 1;
  SELECT id INTO item_breathalyzer FROM public.checklist_items WHERE label ILIKE '%Breathalyzer%'                 LIMIT 1;
  SELECT id INTO item_coc_forms    FROM public.checklist_items WHERE label ILIKE '%Chain-of-custody%'             LIMIT 1;
  SELECT id INTO item_bwc_logs     FROM public.checklist_items WHERE label ILIKE '%BWC%'                          LIMIT 1;

  -- ── Resolve inspection IDs by score ────────────────────────
  SELECT id INTO ins_88 FROM public.inspections WHERE score = 88 LIMIT 1;
  SELECT id INTO ins_75 FROM public.inspections WHERE score = 75 LIMIT 1;
  SELECT id INTO ins_62 FROM public.inspections WHERE score = 62 LIMIT 1;
  SELECT id INTO ins_50 FROM public.inspections WHERE score = 50 LIMIT 1;

  RAISE NOTICE 'Found inspections: 88%%=%, 75%%=%, 62%%=%, 50%%=%', ins_88, ins_75, ins_62, ins_50;
  RAISE NOTICE 'Found items: med_fridge=%, vac_fridge=%, ppe=%, sharps=%', item_med_fridge, item_vac_fridge, item_ppe, item_sharps;

  -- Clear existing responses (makes this re-runnable)
  DELETE FROM public.inspection_responses;

  -- ── ins 88%: West Market Jun 9 · 7 pass, 1 fail ───────────
  IF ins_88 IS NOT NULL THEN
    INSERT INTO public.inspection_responses (inspection_id, item_id, value, passed, notes) VALUES
      (ins_88, item_med_fridge,   '41°F', true,  null),
      (ins_88, item_vac_fridge,   '48°F', false, 'Slightly above range — reported to facility manager, corrective steps initiated'),
      (ins_88, item_ppe,          'Pass', true,  null),
      (ins_88, item_exam_rooms,   'Pass', true,  null),
      (ins_88, item_sharps,       'Pass', true,  null),
      (ins_88, item_autoclave,    'Yes',  true,  null),
      (ins_88, item_lab_cal,      'Pass', true,  null),
      (ins_88, item_ekg,          'Pass', true,  null);
    RAISE NOTICE 'Inserted 8 responses for inspection score=88';
  ELSE
    RAISE NOTICE 'No inspection with score=88 found — skipping';
  END IF;

  -- ── ins 75%: West Market Jun 5 · 6 pass, 2 fail ───────────
  IF ins_75 IS NOT NULL THEN
    INSERT INTO public.inspection_responses (inspection_id, item_id, value, passed, notes) VALUES
      (ins_75, item_med_fridge,   '50°F', false, 'Door seal may be failing — corrective action raised'),
      (ins_75, item_vac_fridge,   '38°F', true,  null),
      (ins_75, item_ppe,          'Pass', true,  null),
      (ins_75, item_exam_rooms,   'Pass', true,  null),
      (ins_75, item_sharps,       'Pass', true,  null),
      (ins_75, item_autoclave,    'Yes',  true,  null),
      (ins_75, item_lab_cal,      'Fail', false, 'Centrifuge calibration sticker expired 2026-05-20 — schedule recalibration'),
      (ins_75, item_ekg,          'Pass', true,  null);
    RAISE NOTICE 'Inserted 8 responses for inspection score=75';
  ELSE
    RAISE NOTICE 'No inspection with score=75 found — skipping';
  END IF;

  -- ── ins 62%: Fairlawn Jun 8 · 5 pass, 3 fail ──────────────
  IF ins_62 IS NOT NULL THEN
    INSERT INTO public.inspection_responses (inspection_id, item_id, value, passed, notes) VALUES
      (ins_62, item_med_fridge,   '43°F', true,  null),
      (ins_62, item_vac_fridge,   '40°F', true,  null),
      (ins_62, item_ppe,          'Fail', false, 'Gloves (S) and N95 masks below reorder threshold — order placed'),
      (ins_62, item_exam_rooms,   'Pass', true,  null),
      (ins_62, item_sharps,       'Fail', false, 'Container in Exam Room 3 is over ¾ full — needs immediate swap'),
      (ins_62, item_autoclave,    'Yes',  true,  null),
      (ins_62, item_lab_cal,      'Fail', false, 'Centrifuge sticker expired 2026-05-15, blood analyzer due 2026-06-01'),
      (ins_62, item_ekg,          'Pass', true,  null);
    RAISE NOTICE 'Inserted 8 responses for inspection score=62';
  ELSE
    RAISE NOTICE 'No inspection with score=62 found — skipping';
  END IF;

  -- ── ins 50%: Beachwood Occ Health Jun 7 · 2 pass, 2 fail ──
  IF ins_50 IS NOT NULL THEN
    INSERT INTO public.inspection_responses (inspection_id, item_id, value, passed, notes) VALUES
      (ins_50, item_dot_kits,     'Fail', false, 'DOT kits expired 2026-06-01 — emergency replacement ordered'),
      (ins_50, item_breathalyzer, 'No',   false, 'Last calibrated 2025-05-10, now 13 months — overdue by 1 month'),
      (ins_50, item_coc_forms,    'Pass', true,  null),
      (ins_50, item_bwc_logs,     'Yes',  true,  null);
    RAISE NOTICE 'Inserted 4 responses for inspection score=50';
  ELSE
    RAISE NOTICE 'No inspection with score=50 found — skipping';
  END IF;

  RAISE NOTICE 'Done. Total rows: %', (SELECT count(*) FROM public.inspection_responses);
END $$;
