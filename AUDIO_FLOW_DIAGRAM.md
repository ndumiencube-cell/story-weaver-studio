# Audio Chapters Flow Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Author Creating Book                         │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Upload     │  │    Write     │  │   Record     │              │
│  │   Document   │  │    Text      │  │   Audio      │              │
│  │   (PDF/DOC)  │  │    (Text)    │  │   (Audio)    │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                 │                      │
│         ▼                 ▼                 ▼                      │
│    ┌─────────────────────────────┐                                │
│    │  Parse Document Extract Text │ ← TextChapter (word_count>0) │
│    └─────────────────────────────┘                                │
│         │                                                          │
│         └────────────────┬─────────────────┬──────────────┐       │
│                          ▼                 ▼              ▼        │
│                   ┌──────────────┐  ┌──────────────┐  ┌────────┐ │
│                   │Chapter Editor│  │Chapter Editor│  │Audio   │ │
│                   │(Text Mode)   │  │(Text Mode)   │  │Player  │ │
│                   │Word Count: ✓ │  │Word Count: ✓ │  │(RO)    │ │
│                   │Edit: Yes     │  │Edit: Yes     │  │Edit:No │ │
│                   │Validate: Yes │  │Validate: Yes │  │Val: No │ │
│                   └──────────────┘  └──────────────┘  └────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────────┐
              │   CHAPTER TYPE DETECTION          │
              ├───────────────────────────────────┤
              │ hasOnlyAudioChapters?             │
              │ hasAnyAudioChapters?              │
              │ textChapters[]                    │
              │ allChaptersMeetMinimum?           │
              └───────┬───────────────────────────┘
                      │
          ┌───────────┴───────────┬─────────────────┐
          │                       │                 │
    ┌─────▼────────┐        ┌────▼──────┐    ┌────▼──────┐
    │ AUDIO ONLY   │        │ TEXT ONLY │    │ MIXED     │
    │ BOOK         │        │ BOOK      │    │ BOOK      │
    └─────┬────────┘        └────┬──────┘    └────┬──────┘
          │                      │                │
          │ No conversion        │ Need TTS      │ Warning
          │ needed               │ conversion    │ shown
          │                      │              │
          ▼                      ▼              ▼
    ┌─────────────────────────────────────────────────┐
    │              SAVE TO LIBRARY                    │
    ├─────────────────────────────────────────────────┤
    │ Audio-Only:                                     │
    │ - Upload first audio to storage                 │
    │ - Set audio_url in audiobooks table             │
    │                                                 │
    │ Text-Only:                                      │
    │ - Call TTS API                                  │
    │ - Get MP3 audio                                 │
    │ - Upload to storage                             │
    │ - Set audio_url in audiobooks table             │
    │                                                 │
    │ Mixed:                                          │
    │ - For text chapters: Call TTS                   │
    │ - For audio chapters: Use existing audio        │
    │ - Save both properly tagged in database         │
    └─────────┬───────────────────────────────────────┘
              │
              ▼
    ┌─────────────────────┐
    │   BOOK SAVED        │
    │   IN LIBRARY        │
    │   ✓ Audiobooks      │
    │   ✓ Chapters        │
    │   ✓ Metadata        │
    └─────────────────────┘
```

## Database Schema

### Before (Text-Only)
```
chapters
├── id (UUID)
├── audiobook_id (UUID)
├── user_id (UUID)
├── chapter_number (INT)
├── title (TEXT)
├── content (TEXT) ← Always text
├── word_count (INT) ← Always counted
└── timestamps
```

### After (Audio + Text Support)
```
chapters
├── id (UUID)
├── audiobook_id (UUID)
├── user_id (UUID)
├── chapter_number (INT)
├── title (TEXT)
├── content (TEXT) ← Either real text OR "[Audio Chapter]"
├── word_count (INT) ← Either word count OR 0 for audio
├── is_audio_chapter (BOOL) ← NEW: Flag for audio
├── audio_url (TEXT) ← NEW: URL to audio file
├── audio_duration (INT) ← NEW: Duration in seconds
└── timestamps
```

## Component State Flow

```
Author Component
│
├── chapters: AudioChapter[]
│   │
│   ├── {id, title, content, wordCount, chapterNumber}
│   │
│   └── {isAudioChapter, audioBlob, audioUrl} ← NEW
│
├── hasOnlyAudioChapters = chapters.every(ch => ch.isAudioChapter)
├── hasAnyAudioChapters = chapters.some(ch => ch.isAudioChapter)  
├── textChapters = chapters.filter(ch => !ch.isAudioChapter)
└── allChaptersMeetMinimum = textChapters.every(ch => ch.wordCount >= MIN)
    
    ├── UI Conditionals
    │  ├── Show Voice Options: !hasOnlyAudioChapters
    │  ├── Show Convert Button: !hasOnlyAudioChapters && textChapters.length > 0
    │  └── Show Save Audio Button: hasOnlyAudioChapters
    │
    └── Processing
       ├── handleConvertToAudio(): Text → TTS → Audio
       ├── handleAddAudioChapter(): Record/Upload → Audio
       └── handleSaveToLibrary(): Combined save logic
```

## Chapter Type Lifecycle

### Text Chapter Path
```
Document/Write
    ↓
TextChapter {
  content: "Lorem ipsum...",
  wordCount: 250,
  isAudioChapter: false
}
    ↓
Save Draft
    ↓
DB: is_audio_chapter=false, content=text, word_count=250
    ↓
Load Draft
    ↓
Edit → word count validations apply
    ↓
Convert to Audio → TTS API
    ↓
Save to Library → MP3 stored
```

### Audio Chapter Path
```
Record/Upload Audio
    ↓
AudioChapter {
  audioBlob: Blob,
  audioUrl: blob:// URL,
  isAudioChapter: true,
  wordCount: 0
}
    ↓
Save Draft
    ↓
Upload to Supabase Storage
    ↓
DB: is_audio_chapter=true, content="[Audio Chapter]", audio_url=https://...
    ↓
Load Draft
    ↓
Display Audio Player → NO word count validation
    ↓
Save to Library → Audio already ready, just use the URL
```

## Warning System

```
User adds Audio Chapter
        ↓
Check: Are there text chapters?
        ├─ YES → Show Warning
        │        "This book has text chapters. Audio should be 
        │         in a separate audiobook for best results."
        │        (User can ignore and continue)
        │
        └─ NO → No warning, proceed normally

User adds Text Chapter
        ↓
Check: Are there audio chapters?
        ├─ YES → Show Warning
        │        "This book has audio chapters. Text should be
        │         in a separate audiobook for best results."
        │        (User can ignore and continue)
        │
        └─ NO → No warning, proceed normally
```

## State Machine: Book Type Detection

```
                    EMPTY
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
   ADD TEXT      ADD AUDIO      (nothing yet)
        │             │
        ▼             ▼
   TEXT ONLY    AUDIO ONLY
        │             │
        │      ┌──────┴─────┐
        │      ▼ (warning)  ▼ (still allows)
        │      ▼             ▼
        │    MIXED (audio+text)
        │      ▲             ▲
        │      └──────┬──────┘
        │ (warning)   │
        └─────────────┘

Conversion Paths:
TEXT ONLY  ─→ TTS API  ─→ MP3 Audio ─→ Save
AUDIO ONLY ─(no TTS)──────────────────→ Save  
MIXED      ─→ Process each separately ─→ Save
```

## UI State Indicators

```
┌─────────────────────────────────────────────────┐
│ Add Chapters Panel                              │
├─────────────────────────────────────────────────┤
│ [Upload] [Write] [Record] [Audio]               │
│                                                 │
│ Chapters List (3):                              │
│ ├─ Ch.1 📄 "Chapter One" [50 words] ⚠️ TOO SHORT
│ ├─ Ch.2 🎵 "Voice Chapter" [Audio] ✓ READY
│ └─ Ch.3 📄 "Chapter Three" [150 words] ✓ READY
│                                                 │
│ [✓] Your audio chapters are ready!             │
│ [Save Audio Book to Library] ← Only shows      │
│                               if all audio     │
└─────────────────────────────────────────────────┘
```

## Error Prevention

```
Validation Chain:
│
├─ TextChapter added?
│  ├─ word_count < MIN ─→ Show error in UI ─→ Warn on save
│  └─ word_count >= MIN ─→ OK
│
├─ AudioChapter added?
│  ├─ audioBlob missing ─→ Error toast ─→ Retry
│  └─ audioBlob ready ─→ OK
│
├─ Mixed chapters?
│  ├─ First time ─→ Warning toast
│  └─ User continues ─→ Save both types
│
├─ Save to Library?
│  ├─ generatedAudio? ─→ Save text-converted
│  ├─ hasOnlyAudioChapters? ─→ Save audio-only
│  └─ Neither? ─→ Error: "Nothing to save"
│
└─ Load Draft?
   └─ Load all chapters with correct types preserved
```

This ensures:
✓ Audio never goes through TTS  
✓ Text validation only on text  
✓ Mixed books still work  
✓ No silent failures  
✓ User always knows what's happening
