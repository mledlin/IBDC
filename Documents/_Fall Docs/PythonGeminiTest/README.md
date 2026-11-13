# Gemini license plate review demo

A Python desktop app that shows the original image beside Gemini's suggested plate, two-letter US state, and car color. Grade each result manually with **Pass**, **Fail**, or **Close** (near match). Multiple vehicles are listed separately, but grading is once per image result.

## Start on Windows

1. Install Python 3.11+ from https://www.python.org/downloads/windows/ with Tcl/Tk and the Python launcher enabled.
2. Extract the entire ZIP to a folder. Close the older app before using this updated version.
3. Double-click `start_windows.bat` to create a virtual environment, install Pillow, and launch.
4. Open **API and pricing settings**. Paste your key from https://aistudio.google.com/apikey and click **Save settings**. The key stays in memory; it is not written to files or exports.

Manual launch from this project folder:

```powershell
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe app.py
```

On macOS/Linux use `python3 -m venv .venv`, then `.venv/bin/python -m pip install -r requirements.txt` and `.venv/bin/python app.py`. Linux needs its distribution's Tkinter package.

## Individual images

Click **Choose image**, then **Analyze image**. Compare the original image with the suggestions and choose a grade at the bottom right:

- **Pass**: correct by your manual evaluation criteria.
- **Fail**: incorrect.
- **Close**: near match. This is a grade, not an exit button.

Use consistent criteria across the session; the app does not automatically judge plate, state, or color. There is one grade per result, including images with multiple vehicles. Grade buttons are disabled after use so repeated clicks do not count twice. You can choose another image without grading after a confirmation; it remains in the ungraded count.

## Folder mode

1. Enter your key in settings first.
2. Click **Choose folder and start**. Selecting the folder starts the first request automatically.
3. The app finds JPEG, PNG and WebP files directly in that folder (not subfolders), ordered by filename without case sensitivity.
4. During each request the display reads **Analyzing image X of Y**.
5. When a result arrives, processing pauses until you click **Pass**, **Fail**, or **Close**.
6. After a grade, the next image starts automatically following a brief 0.7-second visual acknowledgment. The final result stays visible when the folder is complete.

Errors pause the run. Click **Analyze image** to retry a request, **Skip error** to continue, or **Cancel** to stop. An unreadable/corrupt file can be skipped or cancelled. Errors are separate from manual Fail grades.

**Cancel** immediately stops all future submissions, including a scheduled next image. It does not revoke an HTTP request already sent to Google: the app waits for that response (up to the network timeout), records any reported usage, and lets you grade the completed result. No next image is sent. This avoids dropping known cost information. Existing totals and grades remain. Starting another folder begins that folder from its first image; there is no resume function.

## Screenshot-friendly view and session totals

The main window keeps the image, large plate/state/color text, filename, image dimensions, processing time, folder progress and session totals together. Grade controls sit at the bottom right. The API key is only in the separate settings dialog. Use a maximized window and Windows Snipping Tool (Win+Shift+S) to capture the main view while waiting for a grade. Use **Full resolution** to inspect small text in a separate scrollable image view. Many detected vehicles may require scrolling the results panel.

The fixed bottom summary combines individual and folder runs in the current app session:

- **Analyzed**: successful, valid analysis results, including no-vehicle results. Each successful retry/re-analysis counts as another analysis, even if the file was used before.
- **Pass / Fail / Close**: your grades, one per completed result.
- **Ungraded**: valid results without a grade. Pass + Fail + Close + Ungraded = Analyzed.
- **Errors**: failed API attempts or images that could not be opened; these do not count as analyzed or Fail.
- **Estimated API cost**: sum of known request-cost estimates, with a separate unknown-cost request count. Failed parsing still contributes if usage was returned. A timeout or failure without usage is marked unknown, not free. Local image-loading errors cost $0.

Totals are in memory for this session. **Reset session** clears totals after confirmation; it is disabled during folder runs/requests. Closing the app loses unexported results. There is no automatic persistence or billing-account synchronization.

## Cost estimates

The estimate uses returned Gemini token counts: uncached prompt tokens × input rate + cached prompt tokens × cached-input rate + (answer tokens + thinking tokens) × output rate. Rates are USD per million tokens, captured separately for each request. Changes to settings do not reprice previous requests. Images are included in prompt-token usage.

Built-in standard paid rates for `gemini-3.8-flash` are $0.75 input, $3.75 output, $0.075 cached input per million through December 31, 2026; from January 1, 2027 the defaults are $1.50, $7.50, $0.15. These follow the official pricing page retrieved for this update. Check current pricing before use; enter custom rates in settings if needed. Changing the model clears rates so another model's prices are never silently applied. Blank rates mean unknown cost; set all three to zero if you deliberately want free-tier estimates.

This is not an invoice: it excludes taxes, credits, account-specific discounts, and charges Google does not report in the response. No web grounding, explicit cache storage, or additional paid tools are enabled. Folder mode uses sequential standard API requests, not Google's discounted Batch API. The settings and exports never include your API key.

## Export

- **Export session** saves all grades, errors and requests as JSON, including totals, raw token usage, model, prompt, per-request pricing and timing. CSV is also available with one row per request/image-loading error; multiple vehicle fields are joined with ` | ` so costs are not duplicated across rows.
- **Save current result** saves the current record with its grade and cost estimate. Saving before grading leaves that exported copy ungraded; save again after grading if needed.
- No image bytes or API keys are included. Exports do contain filenames and vehicle data.

## Image handling and limitations

Supported input: JPEG, PNG, WebP up to 15 MB and 40 megapixels. Export HEIC to JPEG first. Source files are never modified. The full image is sent at its pixel dimensions with EXIF orientation corrected and metadata removed. PNG is used normally; large uploads use quality-95 JPEG. Oversize prepared images are rejected rather than silently downsampled.

Gemini runs on Google's servers and needs internet access and valid API quota/billing. It can misread characters, associate the wrong vehicle, guess a state, or misjudge color. All suggestions remain unverified. The prompt requests Unknown for unreadable fields. Only the 50 US states and DC are supported for state output.

No automatic retries are performed. Each retry may incur another charge. HTTP 402 now explicitly directs you to check prepaid billing. If your account cannot use the default model, enter an image-capable Gemini model supporting structured output and its pricing in settings. You may prefill the key/model with `GEMINI_API_KEY` / `GEMINI_MODEL` environment variables.

## Tests and files

Run `.venv\Scripts\python.exe -m unittest discover -v` on Windows or `.venv/bin/python -m unittest discover -v` on macOS/Linux.

- `app.py`: Tkinter UI, background requests and review workflow.
- `recognition.py`: image preparation, prompt, HTTP API call, validation and error handling.
- `session.py`: folder queue, grades, totals and cost calculation.
- `test_recognition.py`, `test_session.py`, `test_workflow.py`: mocked/local tests; no paid API calls.

The tests cover cancellation, grading once, waiting between submissions, shared totals, error handling, usage accounting, rates, image orientation, and request construction. They do not establish model accuracy or verify a live Google API account.

## Primary sources

- https://ai.google.dev/gemini-api/docs/image-understanding
- https://ai.google.dev/gemini-api/docs/generate-content/structured-output
- https://ai.google.dev/gemini-api/docs/pricing
- https://ai.google.dev/gemini-api/docs/generate-content/api-errors
- https://ai.google.dev/gemini-api/docs/models
