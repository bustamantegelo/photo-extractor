# Product Requirements Document (PRD)

# Photo Extraction Desktop Application

## 1. Product Overview

### Product Name

Photo Extractor

### Product Type

Desktop application built with:

- React.js
- Electron
- TypeScript
- Node.js

### Purpose

The application allows event/race photographers or operators to extract and organize photos from a source folder into a destination folder.

The user selects:

1. Source folder
2. Destination folder
3. Obstacle / zone
4. Photographer

The application scans the photos, determines the earliest and latest photo taken times, and generates a standardized extraction name.

The user can then **Copy** or **Cut / Move** the photos to the destination.

---

# 2. Problem Statement

Race/event photography can produce hundreds or thousands of photos. Manually organizing these photos by zone, photographer, and time range is repetitive and error-prone.

The application should simplify this workflow:

```text
Source Folder
      ↓
Scan Photos
      ↓
Select Obstacle / Zone
      ↓
Select Photographer
      ↓
Generate Extraction Name
      ↓
Review
      ↓
Copy / Cut
      ↓
Destination Folder
```

---

# 3. Goals

## Primary Goals

- Select a source folder.
- Select a destination folder.
- Scan supported image files.
- Select an obstacle / zone.
- Select a photographer.
- Display photographer initials together with the full photographer name.
- Determine the first photo taken time, preferring EXIF `DateTimeOriginal`.
- Determine the last photo taken time, preferring EXIF `DateTimeOriginal`.
- Generate a standardized name using the photographer's **full name**.
- Copy photos to the destination.
- Cut/move photos to the destination.
- Display processing progress.
- Provide clear success and error messages.

## Secondary Goals

- Preserve original photo filenames.
- Avoid modifying source files when using Copy.
- Prevent accidental overwrites.
- Support large photo batches.
- Allow users to review the extraction before processing.
- Keep the UI simple enough for repeated event use.

---

# 4. Important Naming Rules

The photographer selection UI and generated extraction name have different requirements.

## Photographer Button

The photographer button must display:

```text
{INITIALS} - {Photographer Full Name}
```

Example:

```text
JD - John Doe
JS - Jane Smith
MC - Michael Cruz
```

## Generated Extraction Name

The generated name must use the photographer's **full name**, not the initials.

Format:

```text
{zone}_{photographerFullName}_{firstTakenTime}-{lastTakenTime}
```

Example:

```text
Zone01_JohnDoe_083214-104753
```

Initials must **not** appear in the generated extraction name.

---

# 5. User Workflow

```text
┌────────────────────────────────────────────────────┐
│ SOURCE + DESTINATION                                 │
│ SCAN / ACTIVE PROGRESS + ESTIMATED COMPLETION        │
│                                                    │
│ ZONE + COMPACT PHOTOGRAPHER LIST                     │
│ PHOTO COUNT + TAKEN-TIME RANGE                       │
│ GENERATED NAME + DESTINATION                         │
│ DUPLICATE POLICY       COPY / CUT-MOVE               │
└────────────────────────────────────────────────────┘
```

---

# 6. Functional Requirements

## FR-001 — Source Folder

The application must provide a source folder field.

Example:

```text
Source Folder

┌──────────────────────────────────────────────┐
│ C:\Photos\Event2026                         │
└──────────────────────────────────────────────┘

[ Browse ]
```

### Requirements

- User can enter a folder path manually.
- User can select a folder using the native Electron folder picker.
- Application validates that the folder exists.
- Application validates that the folder is readable.
- Application scans supported image files.

---

# 7. FR-002 — Destination Folder

The application must provide a destination folder field.

Example:

```text
Destination Folder

┌──────────────────────────────────────────────┐
│ D:\Processed\Event2026                     │
└──────────────────────────────────────────────┘

[ Browse ]
```

### Requirements

- User can enter a folder path manually.
- User can select a folder using the native Electron folder picker.
- Application validates the destination.
- Application can optionally create the destination folder when it does not exist.

---

# 8. FR-003 — Supported Photo Formats

The initial version should support:

- `.jpg`
- `.jpeg`
- `.png`
- `.webp`
- `.heic`
- `.heif`

The supported extensions should be configurable in the future.

---

# 9. FR-004 — Photo Scanning

After the source folder is selected, the application scans the folder for supported images.

The application should determine:

- File name
- File path
- File extension
- File size
- Filesystem creation time
- Modification time
- Photo taken time from EXIF `DateTimeOriginal`, when available
- Capture-time source (`exif` or filesystem fallback)

Example:

```typescript
interface Photo {
  id: string;
  fileName: string;
  filePath: string;
  extension: string;
  size: number;
  createdAt: string;
  modifiedAt: string;
  takenAt: string;
  captureTimeSource: "exif" | "filesystem";
}
```

### Scan Result

Example:

```text
Photos Found

1,284 photos

First Taken:
08:32:14

Last Taken:
10:47:53
```

---

# 10. FR-005 — Obstacle / Zone Selection

After scanning, the user selects exactly one obstacle or zone in the single-page extraction workspace.

Example:

```text
SELECT OBSTACLE / ZONE

[ Zone 01 ]
[ Zone 02 ]
[ Zone 03 ]
[ Zone 04 ]
[ Finish Line ]
[ Starting Line ]

```

Copy and move actions remain disabled until a zone is selected.

## Zone Data Model

```typescript
interface Zone {
  id: string;
  name: string;
}
```

Example:

```json
{
  "zones": [
    {
      "id": "zone-01",
      "name": "Zone 01"
    },
    {
      "id": "zone-02",
      "name": "Zone 02"
    },
    {
      "id": "finish-line",
      "name": "Finish Line"
    }
  ]
}
```

---

# 11. FR-006 — Photographer Selection

The photographer selector appears alongside the zone selector on the same page. The user selects exactly one photographer.

The photographer buttons must display initials followed by the full name.

Example:

```text
SELECT PHOTOGRAPHER

┌───────────────────────────────┐
│ JD - John Doe                 │
├───────────────────────────────┤
│ JS - Jane Smith               │
├───────────────────────────────┤
│ MC - Michael Cruz             │
├───────────────────────────────┤
│ AS - Alex Santos              │
└───────────────────────────────┘

```

## Photographer Data Model

```typescript
interface Photographer {
  id: string;
  initials: string;
  name: string;
}
```

Example:

```json
{
  "photographers": [
    {
      "id": "john-doe",
      "initials": "JD",
      "name": "John Doe"
    },
    {
      "id": "jane-smith",
      "initials": "JS",
      "name": "Jane Smith"
    },
    {
      "id": "michael-cruz",
      "initials": "MC",
      "name": "Michael Cruz"
    }
  ]
}
```

---

# 12. FR-007 — Photographer Initials

Initials are a display-only value for the photographer selection UI.

Example:

```text
JD - John Doe
```

Where:

```text
Initials = JD
Full Name = John Doe
```

The initials must not be used in the generated extraction name.

The application should allow manually configured initials rather than always automatically generating them.

This allows photographers with custom initials to be supported.

---

# 13. FR-008 — Generated Extraction Name

After the photographer is selected, the application generates the extraction name.

## Format

```text
{zone}_{photographerFullName}_{firstTakenTime}-{lastTakenTime}
```

Example:

```text
Zone01_JohnDoe_083214-104753
```

Another example:

```text
FinishLine_JaneSmith_091502-113845
```

## Naming Rules

- Zone name is included.
- Photographer **full name** is included.
- Photographer initials are not included.
- Spaces in the photographer name should be removed or converted to `_`.
- Invalid filesystem characters must be removed or replaced.
- Time format must be `HHmmss`.
- First timestamp is the earliest photo taken time.
- Last timestamp is the latest photo taken time.

### Example

Given:

```text
Zone:
Zone 01

Photographer:
JD - John Doe

First Taken:
08:32:14

Last Taken:
10:47:53
```

The generated name must be:

```text
Zone01_JohnDoe_083214-104753
```

Not:

```text
Zone01_JD_083214-104753
```

---

# 14. FR-009 — Photo Time Calculation

The application must calculate the earliest and latest photo taken times. It uses EXIF `DateTimeOriginal` for each photo when available and falls back to that file's filesystem creation time when the tag is missing or unreadable.

Example:

```text
IMG_0001.jpg → 08:32:14
IMG_0002.jpg → 08:33:07
IMG_0003.jpg → 08:41:22
IMG_0004.jpg → 10:47:53
```

Result:

```text
First Taken:
08:32:14

Last Taken:
10:47:53
```

Internal calculation:

```typescript
const firstTakenAt = Math.min(
  ...photos.map((photo) => new Date(photo.takenAt).getTime()),
);

const lastTakenAt = Math.max(
  ...photos.map((photo) => new Date(photo.takenAt).getTime()),
);
```

---

# 15. FR-010 — Extraction Preview

Before processing, the application must display a preview.

Example:

```text
EXTRACTION PREVIEW

Zone:
Zone 01

Photographer:
JD - John Doe

Photos:
384

First Taken:
08:32:14

Last Taken:
10:47:53

Generated Name:
Zone01_JohnDoe_083214-104753

Destination:
D:\Processed\Event2026\Zone01_JohnDoe_083214-104753


[ Copy & Remove Source Files ]       [ Cut / Move ]
```

The preview should clearly show that the generated name uses the full photographer name.

---

# 16. FR-011 — Destination Structure

The recommended destination structure is:

```text
Destination/
│
└── Zone01_JohnDoe_083214-104753/
    │
    ├── IMG_0001.jpg
    ├── IMG_0002.jpg
    ├── IMG_0003.jpg
    └── ...
```

The generated extraction name should be used as the destination folder name.

The original camera filenames should be preserved.

### Rationale

This avoids unnecessarily renaming potentially thousands of photos and maintains the original filenames supplied by the camera.

---

# 17. FR-012 — Copy Operation

The Copy button copies the selected photos to the generated destination folder.

Example:

```text
Source:

C:\Photos\Event2026

        COPY
          ↓

Destination:

D:\Processed\Event2026\
└── Zone01_JohnDoe_083214-104753\
```

Requirements:

- Successfully copied files are removed from the source after the destination copy completes.
- Skipped and failed files remain in the source.
- The selected source directory is removed only if it is empty after processing.
- Destination folder is created if required.
- File copy progress is displayed.
- Errors are reported without unnecessarily stopping the entire batch.

---

# 18. FR-013 — Cut / Move Operation

The Cut button moves the selected photos to the destination.

Example:

```text
Source:

C:\Photos\Event2026

        MOVE
          ↓

Destination:

D:\Processed\Event2026\
└── Zone01_JohnDoe_083214-104753\
```

Requirements:

- Successfully moved files must no longer exist in the source.
- Skipped and failed files remain in the source.
- The selected source directory is removed only if it is empty after processing.
- Destination folder is created if required.
- Progress is displayed.
- Failed files must not be reported as successfully moved.

Where possible, use filesystem rename/move operations instead of unnecessary copy/delete operations.

---

# 19. FR-014 — Duplicate Handling

If a destination file already exists, the application must not silently overwrite it.

Example:

```text
IMG_0001.jpg already exists.

[ Replace ]
[ Skip ]
[ Rename ]
[ Cancel All ]
```

Recommended default:

```text
Skip
```

The user should have an explicit option to replace files.

---

# 20. FR-015 — Progress Indicator

The application must display progress during scanning and extraction.

Example:

```text
PROCESSING

Zone01_JohnDoe_083214-104753

████████████████░░░░ 82%

984 / 1,200 photos

Current:
IMG_0984.jpg

Estimated Time of Completion:
3:24:16 PM
```

The UI must remain responsive during filesystem operations. During copy and move, the estimated completion time is recalculated from elapsed time and completed files; while there is insufficient data, show that the estimate is being calculated.

---

# 21. FR-016 — Completion Summary

After the operation:

```text
EXTRACTION COMPLETE

1,200 photos processed

Successful:
1,198

Skipped:
2

Failed:
0

Source Folder:
Removed if empty; otherwise retained

Destination:
D:\Processed\Event2026\Zone01_JohnDoe_083214-104753

[ Open Folder ]
[ Extract Another Batch ]
```

---

# 22. FR-017 — Error Handling

## Invalid Source Folder

```text
Source folder could not be found.
Please select another folder.
```

## Invalid Destination Folder

```text
Destination folder could not be found.

[ Create Folder ] [ Cancel ]
```

## Permission Error

```text
Unable to access:

IMG_0042.jpg

The file may be locked or you may not have permission.
```

## Invalid Image

```text
Unable to process:

IMG_0213.jpg
```

The application should continue processing other valid files whenever possible.

---

# 23. UI / UX Requirements

## Main Screen

```text
┌──────────────────────────────────────────────────────┐
│                  PHOTO EXTRACTOR                     │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Source Folder                                        │
│ ┌──────────────────────────────────────────────┐     │
│ │ C:\Photos\Event                              │ [📁]│
│ └──────────────────────────────────────────────┘     │
│                                                      │
│ Destination Folder                                   │
│ ┌──────────────────────────────────────────────┐     │
│ │ D:\Processed\Event                           │ [📁]│
│ └──────────────────────────────────────────────┘     │
│                                                      │
│                    [ Scan Photos ]                   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

# 24. Application Screens

## Single-Page Extraction Workspace

Folder selection, scanning, zone and photographer assignment, preview, duplicate handling, and copy/move actions appear together on one page. Zone and photographer controls become available after scanning; no Next/Back navigation is used.

```text
PHOTO EXTRACTION

Source Folder                         Destination Folder
[____________________] [Browse]       [____________________] [Browse]
                                      [ Scan Photos ]

Progress: 82%  |  984 / 1,200  |  IMG_0984.jpg
Estimated Time of Completion: 3:24:16 PM

PHOTOS FOUND       TAKEN-TIME RANGE
384                08:32:14 → 10:47:53

ZONE                               PHOTOGRAPHER
[ Zone 01 ] [ Zone 02 ]            [ JD - John Doe ]
[ Zone 03 ] [ Finish Line ]        [ JS - Jane Smith ]

GENERATED NAME                     DESTINATION
Zone01_JohnDoe_083214-104753       D:\Processed\Event\Zone01_JohnDoe_083214-104753

Duplicate policy: Skip / Rename / Replace
[ Copy & remove source files ]     [ Cut / Move ]
```

Folder fields occupy the top of the workspace. While scanning or transferring, the progress indicator appears directly below them so current activity stays visible without scrolling past assignment or transfer controls. Photographer choices use compact rows in a two-column list where space permits.

After each photo is successfully copied or moved, its source file is removed. Skipped and failed files remain. The selected source directory is removed only when it is empty.

---

# 25. Application Architecture

Recommended architecture:

```text
┌─────────────────────────────┐
│       React Renderer        │
│                             │
│  UI / State / Navigation    │
└──────────────┬──────────────┘
               │
               │ Secure IPC
               ▼
┌─────────────────────────────┐
│      Electron Main          │
│                             │
│  Folder Dialogs             │
│  File Operations            │
│  Photo Scanning             │
│  Metadata                   │
│  Extraction                 │
└─────────────────────────────┘
```

---

# 26. React Responsibilities

React should handle:

- Folder selection UI
- Zone selection
- Photographer selection
- Navigation between steps
- Extraction preview
- Progress display
- Operation result
- Error messages
- Application state

React should not directly access Node.js filesystem APIs.

---

# 27. Electron Responsibilities

Electron main process should handle:

- Native folder dialogs
- Filesystem access
- Photo scanning
- EXIF `DateTimeOriginal` parsing and filesystem creation-time fallback
- Copying
- Moving
- Destination folder creation
- Opening destination folders
- Secure IPC communication

---

# 28. Electron Security

Electron must use secure defaults.

Recommended configuration:

```typescript
webPreferences: {
  preload: path.join(__dirname, "preload.js"),
  contextIsolation: true,
  nodeIntegration: false
}
```

The renderer should only access explicitly exposed APIs through the preload script.

Do not expose arbitrary Node.js APIs to React.

---

# 29. Recommended Project Structure

```text
photo-extractor/
│
├── electron/
│   ├── main.ts
│   ├── preload.ts
│   │
│   ├── ipc/
│   │   ├── folderHandlers.ts
│   │   ├── photoHandlers.ts
│   │   └── extractionHandlers.ts
│   │
│   └── services/
│       ├── fileScanner.ts
│       ├── photoMetadata.ts
│       ├── extractionService.ts
│       └── configService.ts
│
├── src/
│   ├── components/
│   │   ├── FolderSelector.tsx
│   │   ├── ZoneSelector.tsx
│   │   ├── PhotographerSelector.tsx
│   │   ├── ExtractionPreview.tsx
│   │   ├── ProgressBar.tsx
│   │   └── ResultSummary.tsx
│   │
│   ├── pages/
│   │   ├── FolderSelection.tsx
│   │   ├── ZoneSelection.tsx
│   │   ├── PhotographerSelection.tsx
│   │   ├── Preview.tsx
│   │   └── Complete.tsx
│   │
│   ├── types/
│   │   ├── Photo.ts
│   │   ├── Zone.ts
│   │   ├── Photographer.ts
│   │   └── ExtractionJob.ts
│   │
│   ├── services/
│   │   └── electronApi.ts
│   │
│   ├── App.tsx
│   └── main.tsx
│
├── package.json
├── tsconfig.json
└── README.md
```

---

# 30. TypeScript Models

## Photo

```typescript
interface Photo {
  id: string;
  fileName: string;
  filePath: string;
  extension: string;
  size: number;
  createdAt: string;
  modifiedAt: string;
  takenAt: string;
  captureTimeSource: "exif" | "filesystem";
}
```

## Zone

```typescript
interface Zone {
  id: string;
  name: string;
}
```

## Photographer

```typescript
interface Photographer {
  id: string;
  initials: string;
  name: string;
}
```

Example:

```typescript
const photographer: Photographer = {
  id: "john-doe",
  initials: "JD",
  name: "John Doe",
};
```

The UI displays:

```text
JD - John Doe
```

But the generated name uses:

```text
John Doe
```

---

# 31. Extraction Job

```typescript
interface ExtractionJob {
  sourcePath: string;
  destinationPath: string;

  zone: Zone;
  photographer: Photographer;

  photos: Photo[];

  firstTakenAt: string;
  lastTakenAt: string;

  generatedName: string;

  operation: "copy" | "move";
}
```

---

# 32. Filename Generation Service

The generated name should use the photographer's full name.

```typescript
function generateExtractionName(
  zone: string,
  photographerName: string,
  firstTakenAt: Date,
  lastTakenAt: Date,
): string {
  return `${sanitize(zone)}_${sanitize(photographerName)}_${formatTime(firstTakenAt)}-${formatTime(lastTakenAt)}`;
}
```

Example:

```typescript
generateExtractionName(
  "Zone 01",
  "John Doe",
  new Date(...),
  new Date(...)
);
```

Result:

```text
Zone01_JohnDoe_083214-104753
```

The photographer initials are intentionally not passed to this function.

---

# 33. Name Sanitization

The application must prevent invalid filesystem names.

Invalid characters should be removed or replaced.

For example:

```text
John/Doe
```

could become:

```text
JohnDoe
```

Spaces may be removed:

```text
John Doe
```

becomes:

```text
JohnDoe
```

The exact sanitization rules should be centralized in one utility function.

---

# 34. Configuration

Zones and photographers should be configurable.

Example:

```json
{
  "zones": [
    {
      "id": "zone-01",
      "name": "Zone 01"
    },
    {
      "id": "zone-02",
      "name": "Zone 02"
    },
    {
      "id": "finish",
      "name": "Finish Line"
    }
  ],
  "photographers": [
    {
      "id": "john-doe",
      "initials": "JD",
      "name": "John Doe"
    },
    {
      "id": "jane-smith",
      "initials": "JS",
      "name": "Jane Smith"
    }
  ]
}
```

---

# 35. Future Configuration UI

A future version should provide an administration/settings screen where users can:

- Add photographer
- Edit photographer
- Remove photographer
- Set photographer initials
- Add zone
- Edit zone
- Remove zone
- Reorder zones

Example:

```text
PHOTOGRAPHERS

Initials    Full Name
--------------------------------
JD          John Doe
JS          Jane Smith
MC          Michael Cruz

[ Add Photographer ]
```

---

# 36. Performance Requirements

The application should support at least:

- 10,000 photos per extraction job.
- Large source folders.
- Asynchronous filesystem operations.
- Non-blocking UI.
- Incremental progress updates.

The React UI must remain responsive while scanning or moving/copying files.

---

# 37. Progress Events

Electron should send progress events to React.

Example:

```typescript
interface ProgressEvent {
  current: number;
  total: number;
  percentage: number;
  currentFile: string;
}
```

Example:

```text
Scanning:

0%
25%
50%
75%
100%
```

Extraction:

```text
0%
25%
50%
75%
100%
```

---

# 38. Logging

The application should record extraction operations for troubleshooting.

Example:

```text
2026-10-01 08:32:14

Extraction started

Zone:
Zone 01

Photographer:
John Doe

Photos:
384

Operation:
COPY

Generated Name:
Zone01_JohnDoe_083214-104753

Destination:
D:\Processed\Event2026\Zone01_JohnDoe_083214-104753

Result:
384 successful
0 failed
```

---

# 39. Future Features

Potential future functionality:

## Automatic Photographer Detection

Use photo metadata or user-defined rules.

## Automatic Zone Detection

Determine zone from:

- Folder
- Filename
- Metadata
- User-defined rules

## Drag and Drop

Allow folders to be dragged into the application.

## Saved Events

Example:

```text
Event:
Race 2026

Zones:
Zone 01
Zone 02
Zone 03

Photographers:
John Doe
Jane Smith
Michael Cruz
```

## Batch Extraction

Allow multiple zone/photographer combinations to be processed in one operation.

Example:

```text
Zone 01 → John Doe
Zone 02 → Jane Smith
Zone 03 → Michael Cruz
```

## EXIF Preview

Display:

- Camera
- Lens
- Date taken
- Aperture
- Shutter speed
- ISO
- GPS metadata when available

---

# 40. MVP Scope

## Required

- React.js
- Electron
- TypeScript
- Source folder selection
- Destination folder selection
- Photo scanning
- Photo taken-time detection (`DateTimeOriginal` with filesystem fallback)
- Zone selection
- Photographer selection
- Photographer initials in selection buttons
- Photographer full name in generated extraction name
- Extraction preview
- Copy operation
- Cut / Move operation
- Progress indicator
- Duplicate handling
- Error handling
- Completion summary
- Open destination folder

## Not Required for MVP

- Full EXIF metadata preview
- Automatic photographer detection
- Automatic zone detection
- Cloud storage
- User accounts
- Authentication
- Database
- Multi-user support
- Batch extraction

---

# 41. Acceptance Criteria

## Single-Page Workflow

- Source/destination fields, assignments, preview, duplicate policy, and transfer actions are available on one page.
- Scanning reveals batch details without navigating to another page.
- Transfer actions remain disabled until a photo scan, zone, and photographer are available.

## Folder Selection

- User can select a source folder.
- User can select a destination folder.
- Invalid paths are rejected.

## Photo Scanning

- Application detects supported image files.
- Application displays photo count.
- Application determines the earliest taken time, preferring EXIF `DateTimeOriginal`.
- Application determines the latest taken time, preferring EXIF `DateTimeOriginal`.
- Photos without readable `DateTimeOriginal` use filesystem creation time as fallback.

## Zone Selection

- User can select exactly one zone.
- Copy and move actions remain disabled until exactly one zone is selected.

## Photographer Selection

- User can select exactly one photographer.
- Photographer button displays initials and full name.

Example:

```text
JD - John Doe
```

## Generated Name

Given:

```text
Zone = Zone 01
Photographer Initials = JD
Photographer Full Name = John Doe
First Taken = 08:32:14
Last Taken = 10:47:53
```

The generated name must be:

```text
Zone01_JohnDoe_083214-104753
```

The generated name must NOT be:

```text
Zone01_JD_083214-104753
```

## Copy

When Copy is selected:

- Files are copied to the destination before their source files are removed.
- Skipped and failed files remain in the source.
- The selected source directory is removed only if it is empty after processing.
- Progress is displayed.
- Estimated time of completion updates during the transfer.
- Completion summary is displayed.

## Cut / Move

When Cut is selected:

- Files are moved to the destination.
- Successfully moved source files no longer exist in the source.
- Skipped and failed files remain in the source.
- The selected source directory is removed only if it is empty after processing.
- Progress is displayed.
- Estimated time of completion updates during the transfer.
- Completion summary is displayed.

## Duplicate Files

- Existing files must not be silently overwritten.
- User receives an explicit duplicate handling option.

## Completion

The application reports:

- Total files
- Successful files
- Skipped files
- Failed files
- Whether the source directory was removed or retained
- Destination path

---

# 42. Recommended MVP User Flow

The full extraction is configured and operated from one page. Scanning reveals the batch assignments and preview in place; progress appears inline during transfer.

```text
PHOTO EXTRACTOR
┌──────────────────────────────────────────────────────────────┐
│ Source folder / Destination folder       [ Scan Photos ]     │
│ Photo count / Taken-time range                              │
│ Zone selection / Photographer selection                     │
│ Generated folder name / Destination                         │
│ Duplicate handling      [ Copy & remove source ] [ Cut/Move ] │
│ Progress bar / Current file / Estimated completion time      │
└──────────────────────────────────────────────────────────────┘
```

Each successfully processed image is removed from the source. Skipped or failed images stay there, and the selected source directory is removed only if empty.

---

# 43. Product Success Criteria

The MVP is successful when an event photographer can organize a large photo batch with minimal manual work:

```text
Select Source
      ↓
Select Destination
      ↓
Scan
      ↓
Select Zone
      ↓
Select Photographer
      ↓
Review Generated Name
      ↓
Copy / Cut
      ↓
Done
```

The core naming rule is:

```text
BUTTON:
INITIALS - Photographer Full Name

GENERATED NAME:
Zone_PhotographerFullName_FirstTakenTime-LastTakenTime
```

Example:

```text
Button:
JD - John Doe

Generated:
Zone01_JohnDoe_083214-104753
```
