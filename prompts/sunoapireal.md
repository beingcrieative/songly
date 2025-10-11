# Suno API – Volledige, Gedetailleerde Tabelreferentie per Endpoint (inclusief parameters, validaties, statuscodes en callbacks)

Belangrijkste takeaway: Onderstaande naslag zet alle Suno API endpoints volledig uiteen met alle parameters, validaties, statuscodes, callbackfasen en voorbeeld-inhoud per endpoint. Dit kan direct gebruikt worden om een interne developer reference/MD handboek te genereren voor jouw applicatie, inclusief alle “Generate/Extend/Upload/Add/Details/WAV/Video/Cover/Lyrics/Separation/Boost/Uploads/Credits” onderdelen.

Opmerking: Alle endpoints vereisen Bearer authenticatie en respecteren limieten per model; callbacks leveren doorgaans fases text, first, complete; assets worden typisch 14–15 dagen bewaard. Waar “Details” endpoints beschikbaar zijn, kunnen die gebruikt worden voor polling in plaats van webhooks[1][2][3][4][5][6][7][8][9].

***

## Generate Suno AI Music

- Method: POST
- Path: /api/v1/generate
- Doel: Muziek genereren met of zonder lyrics op basis van prompt en stijl
- Callbackfasen: text, first, complete[1]

Parameters (Body):
- customMode: boolean
  - true: geavanceerde instellingen; verplichtingen afhankelijk van instrumental
  - false: alleen prompt verplicht; overige velden leeg laten[1]
- instrumental: boolean
  - customMode=true:
    - true: style en title verplicht
    - false: style, prompt en title verplicht; prompt wordt gebruikt als lyrics
  - customMode=false: geen invloed op verplichtingen (alleen prompt)[1]
- prompt: string
  - customMode=true en instrumental=false: verplicht
  - customMode=false: verplicht
  - limieten: V3_5/V4 ≤ 3000; V4_5/V4_5PLUS/V5 ≤ 5000; non-custom ≤ 500[1]
- style: string
  - customMode=true: verplicht
  - limieten: V3_5/V4 ≤ 200; V4_5/V4_5PLUS/V5 ≤ 1000[1]
- title: string
  - customMode=true: verplicht
  - limiet: ≤ 80 tekens[1]
- negativeTags: string (optioneel)[1]
- vocalGender: 'm' | 'f' (optioneel)[1]
- styleWeight: number 0.00–1.00, stap 0.01[1]
- weirdnessConstraint: number 0.00–1.00, stap 0.01[1]
- audioWeight: number 0.00–1.00, stap 0.01[1]
- model: 'V3_5' | 'V4' | 'V4_5' | 'V4_5PLUS' | 'V5'[1]
- callBackUrl: string (optioneel, sterk aanbevolen)[1]

Developer notes:
- Stream URL in 30–40s; download URL binnen ~2–3 min[1]
- Retentie: ~15 dagen[1]
- Gebruik Get Music Generation Details voor polling[1]

Response/Statuscodes:
- code: 200|400|401|404|405|413|429|430|455|500; msg; data[1]

***

## Music Generation Callbacks

- Method: POST (door Suno naar jouw callBackUrl)
- Doel: Resultaat pushen zonder polling[10]

Formaat:
- code: 200|400|451|500
- data.callbackType: 'text' | 'first' | 'complete' | 'error'
- data.task_id: string
- data. array met per track:
  - id, audio_url, source_audio_url
  - stream_audio_url, source_stream_audio_url
  - image_url, source_image_url
  - prompt, model_name, title, tags, createTime, duration[10]

Best practices:
- HTTPS, idempotent verwerken, binnen 15s 200 OK teruggeven, async afhandelen, retries; download URLs tijdsgebonden → snel archiveren[10]

***

## Extend Music

- Method: POST
- Path: /api/v1/generate/extend
- Doel: Bestaande track verlengen vanaf een tijdstip[11]
- Callbackfasen: text, first, complete[12]

Parameters (Body):
- defaultParamFlag: boolean
  - true: custom parameters vereist
    - prompt: string (≤ 3000)
    - style: string (≤ 200)
    - title: string (≤ 80)
    - continueAt: number (s) >0 en < totale duur van bron
  - false: alleen audioId verplicht; rest geërfd[11]
- audioId: string (brontrack)[11]
- model: 'V3_5'|'V4'|'V4_5'|'V4_5PLUS'|'V5' (consistent met bron)[11]
- callBackUrl: string[11]
- negativeTags, vocalGender, styleWeight, weirdnessConstraint, audioWeight: optioneel[11]

Developer notes:
- Retentie: ~15 dagen[11]

Response/Statuscodes:
- code: 200|400|401|404|405|413|429|430|455|500; msg; data[11]

***

## Music Extension Callbacks

- Method: POST
- Doel: Resultaat pushen voor extend-taken[12]

Formaat en best practices identiek aan generation callbacks; statuscodes: 200,400,451,500; callbackType: text/first/complete/error; fields per track incl. audio_url/image_url/tags/duration enz.[12]

***

## Upload And Cover Audio

- Method: POST
- Path: /api/v1/upload-cover
- Doel: Geüploade audio coveren naar nieuwe stijl, behoud melodie[13]
- Callbackfasen: text, first, complete

Parameters (Body):
- customMode: boolean
  - true:
    - instrumental=true: style, title, uploadUrl verplicht
    - instrumental=false: style, prompt, title, uploadUrl verplicht; prompt als lyrics
    - limieten prompt/style/title per model zoals bij generate
    - uploadUrl ≤ 8 min (sommige secties noemen 2 min: hanteer strengste beperking per account/omgeving)[13]
  - false:
    - prompt en uploadUrl verplicht
    - prompt ≤ 500
    - overige velden leeg[13]
- instrumental: boolean (zie boven)[13]
- uploadUrl: string (vereist)[13]
- model: 'V3_5'|'V4'|'V4_5'|'V4_5PLUS'|'V5'[13]
- callBackUrl: string[13]
- prompt/style/title/negativeTags/vocalGender/styleWeight/weirdnessConstraint/audioWeight: conform generate[13]

Developer notes:
- Retentie: 15 dagen[13]

Response/Statuscodes:
- code: 200|400|401|404|405|413|429|430|455|500; msg; data[13]

***

## Upload and Cover Audio Callbacks

- Method: POST
- Identiek patroon (code, callbackType, data array met audio_url/image_url etc.), statuscodes 200,400,451,500; best practices zoals bij generation

***

## Upload And Extend Audio

- Method: POST
- Path: /api/v1/upload-extend
- Doel: Audio uploaden en verlengen met behoud van originele stijl
- Callbackfasen: text, first, complete

Parameters (Body):
- defaultParamFlag: boolean
  - true:
    - instrumental=true: style, title, uploadUrl verplicht
    - instrumental=false: style, prompt, title, uploadUrl verplicht; prompt als lyrics
    - continueAt: number (s) >0 en < duur upload
    - prompt/style/title limieten per model zoals bij generate
  - false:
    - uploadUrl en prompt vereist (ongeacht instrumental); overige parameters erven
- uploadUrl: string (vereist)
- model: 'V3_5'|'V4'|'V4_5'|'V4_5PLUS'|'V5'
- callBackUrl: string
- instrumental, prompt, style, title, continueAt, negativeTags, vocalGender, styleWeight, weirdnessConstraint, audioWeight: conform extend/generate

Developer notes:
- Retentie: 14 dagen (in deze pagina expliciet genoemd)

Response/Statuscodes:
- code: 200|400|401|404|405|413|429|430|455|500; msg; data

***

## Upload and Extend Audio Callbacks

- Method: POST
- Identiek patroon (code, callbackType, data array), statuscodes 200,400,451,500; aandacht voor supported audio format; best practices zoals elders

***

## Add Instrumental

- Method: POST
- Path: /api/v1/add-instrumental
- Doel: Instrumentale begeleiding genereren rond geüploade stem/melodie[8]
- Callbackfasen: text, first, complete

Parameters (Body):
- uploadUrl: string (vereist)[8]
- title: string (vereist; ≤ 80)[8]
- tags: string (vereist; gewenste instrumentatie/feel)[8]
- negativeTags: string (vereist; uitsluitingen)[8]
- callBackUrl: string (vereist)[8]
- vocalGender: 'm'|'f' (optioneel)[8]
- styleWeight, weirdnessConstraint, audioWeight: 0.00–1.00, stap 0.01[8]
- model: 'V4_5PLUS' (default) | 'V5'[8]

Developer notes:
- Retentie: ~15 dagen; URLs publiek toegankelijk; duidelijke tags leveren beste resultaten[8]

Response/Statuscodes:
- code: 200|400|401|404|405|413|429|430|455|500; msg; data[8]

***

## Add Instrumental Callbacks

- Method: POST
- Identiek patroon (code, callbackType, data array met audio_url, image_url, tags enz.) en best practices; statuscodes 200,400,451,500

***

## Add Vocals

- Method: POST
- Path: /api/v1/add-vocals
- Doel: Vocals genereren bovenop aangeleverde instrumental[9]
- Callbackfasen: text, first, complete

Parameters (Body):
- uploadUrl: string (vereist; instrumental)[9]
- prompt: string (vereist; vocaal concept/lyrics/sfeer)[9]
- title: string (vereist; ≤ 80/100 per modelpagina)[9]
- style: string (vereist)[9]
- negativeTags: string (vereist)[9]
- callBackUrl: string (vereist)[9]
- vocalGender: 'm'|'f' (optioneel)[9]
- styleWeight, weirdnessConstraint, audioWeight: 0.00–1.00, stap 0.01[9]
- model: 'V4_5PLUS' (default) | 'V5'[9]

Developer notes:
- Retentie ~15 dagen; duidelijke prompt en heldere instrumental verbeteren resultaat[9]

Response/Statuscodes:
- code: 200|400|401|404|405|413|429|430|455|500; msg; data[9]

***

## Add Vocals Callbacks

- Method: POST
- Identiek patroon (code, callbackType, data array met audio_url/image_url/tags/lyrics-achtige prompt), statuscodes 200,400,451,500; best practices zoals elders

***

## Get Music Generation Details

- Method: GET
- Path: /api/v1/generate/record-info
- Doel: Status/parameters/resultaten van muziekgeneratie opvragen (polling)[2]

Query parameters:
- taskId: string (vereist)[2]

Status Descriptions:
- PENDING
- TEXT_SUCCESS
- FIRST_SUCCESS
- SUCCESS
- CREATE_TASK_FAILED
- GENERATE_AUDIO_FAILED
- CALLBACK_EXCEPTION
- SENSITIVE_WORD_ERROR[2]

Developer notes:
- Instrumental=true → geen lyrics in response; handig alternatief voor callbacks[2]

Response/Statuscodes:
- code: 200|400|401|404|405|413|429|430|455|500; msg; data[2]

***

## Get Timestamped Lyrics

- Method: POST
- Path: /api/v1/lyrics/timestamped
- Doel: Gesynchroniseerde lyrics (karaoke), inclusief timestamps (seconden)[3]

Parameters (Body):
- taskId: string (vereist)
- audioId: string (prioriteit boven musicIndex)
- musicIndex: 0|1 (fallback bij ontbreken audioId)[3]

Developer notes:
- Geen lyrics voor puur instrumentale tracks; waveform data kan voor visualisatie gebruikt worden[3]

Response/Statuscodes:
- code: 200|400|401|404|405|413|429|430|455|500; msg; data[3]

***

## Boost Music Style

- Method: POST
- Path: /api/v1/boost-music-style
- Doel: Stijlomschrijving boosten/verfijnen (model 4.5 en hoger benutten gedetailleerde stijlinstructies)

Parameters (Body):
- content: string (vereist; stijlomschrijving; bv. "Pop, Mysterious")

Response/Statuscodes:
- code: 200|400|401|404|405|413|429|430|455|500; msg; data

***

## Generate Music Cover

- Method: POST
- Path: /api/v1/cover
- Doel: Cover art genereren voor muziektask[6]
- Callbackfasen: complete[14]

Parameters (Body):
- taskId: string (vereist; verwijzing naar oorspronkelijke muziektaak)
- callBackUrl: string (optioneel/aanbevolen)[6]

Developer notes:
- Meestal 1–2 covers; cover kan maar 1x per muziektask; duplicaten → fout (bv. 400)[6]

Response/Statuscodes:
- code: 200|400|401|404|405|413|429|430|455|500; msg; data[6]

***

## Music Cover Generation Callbacks

- Method: POST
- Identiek patroon (code, callbackType=complete, data array), best practices; melding bij duplicate/onjuiste status[14]

***

## Get Music Cover Details

- Method: GET
- Path: /api/v1/get-cover-suno-details
- Doel: Status/resultaten voor cover-taken ophalen (structuur vergelijkbaar met andere “get details” endpoints)[6]

Response/Statuscodes:
- code: 200|400|401|404|405|413|429|430|455|500; msg; data[6]

***

## Generate Lyrics

- Method: POST
- Path: /api/v1/lyrics
- Doel: Alleen lyrics genereren, geen audio
- Callbackfasen: complete[14]

Parameters (Body):
- prompt: string (vereist; modelpagina noemt karakterlimieten tot ±200 woorden voor snelle resultaten)[14]
- callBackUrl: string (optioneel)[14]

Response/Statuscodes:
- code: 200|400|401|404|405|413|429|430|455|500; msg; data[14]

***

## Lyrics Generation Callbacks

- Method: POST
- CallbackType: complete; payload vergelijkbaar met overige callbacks met tekstuele data; best practices gelden hier ook[14]

***

## Get Lyrics Generation Details

- Method: GET
- Path: /api/v1/get-lyrics-generation-details
- Doel: Status/parameters/resultaten van lyrics-taken (vergelijkbare structuur en statuscodes als andere details endpoints)[14]

***

## Convert to WAV Format

- Method: POST
- Path: /api/v1/convert/wav
- Doel: WAV genereren van bestaande track[15]
- Callbackfasen: complete[15]

Parameters (Body):
- taskId of audioId: minstens één verplicht
- callBackUrl: string[15]

Developer notes:
- 409 als WAV al bestaat[15]

Response/Statuscodes:
- code: 200|400|401|404|405|413|429|430|455|500|409; msg; data[15]

***

## WAV Format Conversion Callbacks

- Method: POST
- Identieke callbackstructuur met complete; eventuele 409/400/500 foutscenario’s; best practices zoals elders[15]

***

## Get WAV Conversion Details

- Method: GET
- Path: /api/v1/get-wav-conversion-details
- Doel: Status/resultaten ophalen van WAV conversie (download URL)[15]

***

## Vocal & Instrument Stem Separation

- Method: POST
- Path: /api/v1/vocal-removal/generate
- Doel: Vocals en accompaniment (of per-instrument stems) scheiden[7]
- Callbackfasen: complete[16]

Parameters (Body):
- taskId: string
- audioId: string
- callBackUrl: string
- type: 'separate_vocal' | 'split_stem'
  - separate_vocal: 2 stems (vocals+instrumental)
  - split_stem: tot 12 stems, 5x credits per call[7]

Developer notes:
- Retentie: ~14 dagen voor output; zorg voor toegankelijke URLs[7]

Response/Statuscodes:
- code: 200|400|401|404|405|413|429|430|455|500; msg; data[7]

***

## Audio Separation Callbacks

- Method: POST
- Identieke callbackstructuur met complete en fouten; best practices; statuscodes 200,400,451,500; bevat downloadlinks naar afzonderlijke stems[16]

***

## Get Audio Separation Details

- Method: GET
- Path: /api/v1/get-vocal-separation-details
- Doel: Status/resultaten van stem/instrument separatie (downloadlinks)[7]

***

## Create Music Video

- Method: POST
- Path: /api/v1/video/create
- Doel: MP4 visualizer/video voor track genereren[5]
- Callbackfasen: complete[17]

Parameters (Body):
- taskId: string (vereist)
- audioId: string (vereist)
- callBackUrl: string (optioneel/aanbevolen)
- author: string (optioneel; branding; ≤ 50)
- domainName: string (optioneel; branding; ≤ 50)[5]

Developer notes:
- 409 als video al bestaat; retentie ~15 dagen[5]

Response/Statuscodes:
- code: 200|400|401|404|405|413|429|430|455|500|409; msg; data[5]

***

## Music Video Generation Callbacks

- Method: POST
- Identiek patroon met complete; statuscodes 200,400,451,500; best practices[17]

***

## Get Music Video Details

- Method: GET
- Path: /api/v1/get-music-video-details
- Doel: Status/resultaten (incl. downloadlink) voor video-taken[5]

***

## Get Remaining Credits

- Method: GET
- Path: /api/v1/get-credits
- Doel: Huidige credits ophalen[4]

Parameters:
- Geen (alleen Authorization header)[4]

Response:
- code/msg/data met credits waarde[4]

***

## File Upload API

Doel: Tijdelijke uploads (vervalt na 3 dagen), te gebruiken om uploadUrl/asset referenties te verkrijgen voor andere endpoints.

### Base64 File Upload

- Method: POST
- Path: /file-upload-api/upload-file-base-64
- Body:
  -  Base64 data (data URL of pure base64)
  - uploadPath: string
  - fileName: string (optioneel)
- Notities: Base64 is ~33% groter; aanbevolen voor kleine bestanden (<10MB)

### File Stream Upload

- Method: POST
- Path: /file-upload-api/upload-file-stream
- Body:
  - multipart/form-data met file, uploadPath, fileName (optioneel)
- Notities: Efficiënt voor grotere bestanden; mime-detectie; custom bestandsnaam mogelijk

### URL File Upload

- Method: POST
- Path: /file-upload-api/upload-file-url
- Body:
  - url: publiek toegankelijke HTTP(S) URL
  - uploadPath: string
  - fileName: string (optioneel)
- Notities: Max aangeraden ~100MB; 30s timeout; file moet publiek bereikbaar zijn

***

## Callback- en Pollingpraktijken (algemeen)

- Callback-method: POST application/json; response binnen 15 seconden, anders timeout; meerdere retries; verwerk idempotent; download assets z.s.m. (tijdslimieten)[10][12][17][16]
- Polling alternatief: gebruik “Get Music Generation Details” en analoge “Get … Details” endpoints met interval ~30s wanneer callbacks niet mogelijk zijn[10][12]

***

## Samenvattende integratietips

- Valideer fields en length-limits vóór requests om 400/413 te vermijden[1][13][11]
- Respecteer modelkeuze en consistente parameters bij extend/convert[11][15]
- Kies juiste identificatie bij “timestamped lyrics” (audioId heeft prioriteit)[3]
- Houd retentie in de gaten: 14–15 dagen (download & archiveer direct)[1][11]
- Upload assets zijn slechts 3 dagen geldig: zet pipeline op voor snelle vervolgcalls

***

Bronverwijzingen inline:
- Generate Music en callbacks[1][10]
- Extend Music en callbacks[11][12]
- Upload & Cover Audio en callbacks[13]
- Upload & Extend Audio en callbacks
- Add Instrumental en callbacks[8]
- Add Vocals en callbacks[9]
- Get Music Generation Details[2]
- Get Timestamped Lyrics[3]
- Boost Music Style
- Generate Music Cover, callbacks en details[6][14]
- Generate Lyrics en details[14]
- Convert to WAV, callbacks en details[15]
- Vocal Separation, callbacks en details[7][16]
- Create Music Video, callbacks en details[5][17]
- Get Credits[4]
- File uploads (Base64/Stream/URL)

Sources
[1] Generate Suno AI Music https://docs.sunoapi.org/suno-api/generate-music
[2] Get Music Generation Details https://docs.sunoapi.org/suno-api/get-music-generation-details
[3] Get Timestamped Lyrics https://docs.sunoapi.org/suno-api/get-timestamped-lyrics
[4] Get Remaining Credits https://docs.sunoapi.org/suno-api/get-remaining-credits
[5] Create Music Video https://docs.sunoapi.org/suno-api/create-music-video
[6] Generate Music Cover https://docs.sunoapi.org/suno-api/cover-suno
[7] Vocal & Instrument Stem Separation https://docs.sunoapi.org/suno-api/separate-vocals-from-music
[8] Add Instrumental https://docs.sunoapi.org/suno-api/add-instrumental
[9] Add Vocals https://docs.sunoapi.org/suno-api/add-vocals
[10] Music Generation Callbacks https://docs.sunoapi.org/suno-api/generate-music-callbacks
[11] Extend Music https://docs.sunoapi.org/suno-api/extend-music
[12] Add Vocals Callbacks https://docs.sunoapi.org/suno-api/add-vocals-callbacks
[13] Upload And Cover Audio https://docs.sunoapi.org/suno-api/upload-and-cover-audio
[14] Generate Lyrics https://docs.sunoapi.org/suno-api/generate-lyrics
[15] Convert to WAV Format https://docs.sunoapi.org/suno-api/convert-to-wav-format
[16] Audio Separation Callbacks https://docs.sunoapi.org/suno-api/separate-vocals-from-music-callbacks
[17] Music Video Generation Callbacks https://docs.sunoapi.org/suno-api/create-music-video-callbacks
