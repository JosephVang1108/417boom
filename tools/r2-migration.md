# R2 media migration — EXECUTED Oct 15, 2026 (kept as the playbook for new uploads)

Status: all three streamed videos live in the bucket and serve from
`https://media.jirehbible.com/<name>` (custom domain, Range verified);
`MEDIA_BASE` in app/src/lib/media.ts points there. Remaining: remove
the server /media proxy once every device is on the R2 build; optional
archive-media.yml R2 upload step. NOTE: the real `R2_ENDPOINT` is
`https://<account-id>.r2.cloudflarestorage.com` — if the stored env var
still says LONGCODE, uploads via env var fail (Joseph was asked to fix
the saved value; the account-id form is in the bucket's Settings page).

Goal: phones stream videos from Cloudflare R2 (free egress) instead of
through the Render server's /media proxy. Server exits the video path.

Credentials: the Claude cloud environment carries `R2_ACCESS_KEY_ID`,
`R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT` (token is scoped to the
`jireh-media` bucket only). Check with `env | grep R2_`. If absent,
they load on next session start — do not ask Joseph to re-add.

## Steps

1. **Upload** every asset from the GitHub `media` release to the
   bucket, keeping the same filenames (streamable encodes only, not
   the `original-*` masters):
   `sermon-come-back-home.mp4`, `story-david-goliath-adult.mp4`,
   `story-david-goliath-kids.mp4` (+ any added since — list the
   release first). Use the aws CLI (S3-compatible):
   `aws s3 cp file.mp4 s3://jireh-media/ --endpoint-url $R2_ENDPOINT`
   with `AWS_ACCESS_KEY_ID=$R2_ACCESS_KEY_ID` and
   `AWS_SECRET_ACCESS_KEY=$R2_SECRET_ACCESS_KEY`. Set
   `--content-type video/mp4` explicitly.
2. **Public access**: Joseph clicks, we guide — bucket → Settings →
   either enable the r2.dev public URL (fastest), or Custom Domains →
   connect `media.jirehbible.com` (prettier; his zone is already on
   Cloudflare so it's one click + auto-DNS).
3. **Verify** from this container: `curl -sI <public>/story-...mp4`
   returns 200/206 with `content-type: video/mp4` and honors Range.
4. **Repoint the app**: in `app/src/lib/media.ts`, change `MEDIA_BASE`
   from `${BACKEND_URL}/media` to the public base URL. Ship in the
   next build.
5. **Keep** the GitHub release as the master archive and the server
   /media proxy as a fallback (older builds still use it) — remove the
   proxy only after every TestFlight device is on the R2 build.
6. Update PLAN.md §4.5 item 2 to DONE.

Joseph approved this migration (2026-10-15). The archive-media
workflow continues to publish new renders to the GitHub release;
step 1 repeats (one `aws s3 cp`) for each new video until the workflow
is taught to upload to R2 directly — optional follow-up: add R2
upload to `.github/workflows/archive-media.yml` using repo secrets.
