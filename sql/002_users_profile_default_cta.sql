-- Adds an optional user-level default CTA URL. Used to pre-fill the
-- IdeaPicker's CTA field when generating a new tool, so each user only
-- has to type their booking/contact URL once instead of per-run.
alter table users_profile
  add column if not exists default_cta_url text;
