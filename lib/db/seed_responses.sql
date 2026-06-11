-- ============================================================
-- Seed inspection_responses
-- Run in Supabase SQL Editor. Safe to re-run.
-- Works with both TEXT and UUID id columns.
-- ============================================================

DO $$
DECLARE
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
  ins_88  text;
  ins_75  text;
  ins_62  text;
  ins_50  text;
BEGIN

  -- Resolve checklist item IDs
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

  -- Resolve inspection IDs by score
  SELECT id::text INTO ins_88 FROM public.inspections WHERE score = 88 LIMIT 1;
  SELECT id::text INTO ins_75 FROM public.inspections WHERE score = 75 LIMIT 1;
  SELECT id::text INTO ins_62 FROM public.inspections WHERE score = 62 LIMIT 1;
  SELECT id::text INTO ins_50 FROM public.inspections WHERE score = 50 LIMIT 1;

  RAISE NOTICE 'Inspections — 88%%: %, 75%%: %, 62%%: %, 50%%: %', ins_88, ins_75, ins_62, ins_50;
  RAISE NOTICE 'Items — med_fridge: %, ppe: %, sharps: %, dot_kits: %', item_med_fridge, item_ppe, item_sharps, item_dot_kits;

  -- Clear existing (re-runnable)
  DELETE FROM public.inspection_responses;

  -- ins 88%: 7 pass, 1 fail
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
    RAISE NOTICE 'Inserted 8 responses for score=88';
  ELSE
    RAISE NOTICE 'No inspection with score=88 — skipping';
  END IF;

  -- ins 75%: 6 pass, 2 fail
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
    RAISE NOTICE 'Inserted 8 responses for score=75';
  ELSE
    RAISE NOTICE 'No inspection with score=75 — skipping';
  END IF;

  -- ins 62%: 5 pass, 3 fail
  IF ins_62 IS NOT NULL THEN
    INSERT INTO public.inspection_responses (inspection_id, item_id, value, passed, notes) VALUES
      (ins_62, item_med_fridge,   '43°F', true,  null),
      (ins_62, item_vac_fridge,   '40°F', true,  null),
      (ins_62, item_ppe,          'Fail', false, 'Gloves (S) and N95 masks below reorder threshold'),
      (ins_62, item_exam_rooms,   'Pass', true,  null),
      (ins_62, item_sharps,       'Fail', false, 'Container in Exam Room 3 over ¾ full — needs immediate swap'),
      (ins_62, item_autoclave,    'Yes',  true,  null),
      (ins_62, item_lab_cal,      'Fail', false, 'Centrifuge sticker expired 2026-05-15, blood analyzer due 2026-06-01'),
      (ins_62, item_ekg,          'Pass', true,  null);
    RAISE NOTICE 'Inserted 8 responses for score=62';
  ELSE
    RAISE NOTICE 'No inspection with score=62 — skipping';
  END IF;

  -- ins 50%: 2 pass, 2 fail
  IF ins_50 IS NOT NULL THEN
    INSERT INTO public.inspection_responses (inspection_id, item_id, value, passed, notes) VALUES
      (ins_50, item_dot_kits,     'Fail', false, 'DOT kits expired 2026-06-01 — emergency replacement ordered'),
      (ins_50, item_breathalyzer, 'No',   false, 'Last calibrated 2025-05-10, overdue by 1 month'),
      (ins_50, item_coc_forms,    'Pass', true,  null),
      (ins_50, item_bwc_logs,     'Yes',  true,  null);
    RAISE NOTICE 'Inserted 4 responses for score=50';
  ELSE
    RAISE NOTICE 'No inspection with score=50 — skipping';
  END IF;

  RAISE NOTICE 'Done. Total rows in inspection_responses: %', (SELECT count(*) FROM public.inspection_responses);
END $$;
