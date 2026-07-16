# MachineFit ERD

```mermaid
erDiagram
    ROLES ||--o{ USERS : has
    COUNTRIES ||--o{ USERS : lives_in
    LANGUAGES ||--o{ USERS : prefers
    COUNTRIES ||--o{ GYMS : located_in

    USERS ||--o{ OWNER_APPLICATIONS : submits
    USERS ||--o| GYMS : owns
    USERS ||--o{ FAVORITES : saves
    USERS ||--o{ RECENT_HISTORY : views
    USERS ||--o{ POSTS : writes
    USERS ||--o{ MACHINE_REQUESTS : requests
    USERS ||--o{ QR_SCAN_EVENTS : scans
    USERS ||--o{ VISION_RECOGNITION_LOGS : uploads
    USERS ||--o{ WORKOUT_SESSIONS : trains

    BRANDS ||--o{ MACHINES : manufactures
    MACHINES ||--o{ MACHINE_ALIASES : aliased_as
    MACHINES ||--o{ MACHINE_QR_CODES : has_qr
    MACHINES ||--o{ MACHINE_EMBEDDINGS : embedded
    MACHINES ||--o{ MACHINE_SETTINGS : defines
    MACHINES ||--o{ MACHINE_RECOMMENDATIONS : targets
    MACHINES ||--o{ GYM_MACHINES : installed_at

    GYMS ||--o{ GYM_PHOTOS : has
    GYMS ||--o{ GYM_MACHINES : contains
    GYM_MACHINES ||--o{ GYM_MACHINE_QR_CODES : has_qr

    MACHINE_RECOMMENDATIONS ||--o{ RECENT_HISTORY : recorded_in
    MACHINE_RECOMMENDATIONS ||--o{ FAVORITES : saved_as
    MACHINE_RECOMMENDATIONS ||--o{ WORKOUT_SESSIONS : optional_link

    POSTS ||--o{ COMMENTS : has
    POSTS ||--o{ LIKES : receives
    POSTS ||--o{ POST_ATTACHMENTS : has
    MACHINE_REQUESTS ||--o| POSTS : published_as

    AI_MODELS ||--o{ MACHINE_EMBEDDINGS : version
    AI_MODELS ||--o{ VISION_RECOGNITION_LOGS : version
```

## Core Identity Chain

```
brandCode (HAMMER_STRENGTH)
    └── machineCode (HS_ISO_LATERAL_HIGH_ROW)  ← canonical API identifier
            ├── machine_settings (recommendation rules)
            ├── machine_qr_codes (QR → deep link)
            ├── machine_embeddings (AI search)
            └── gym_machines (per-gym inventory)
                    └── gym_machine_qr_codes (gym-specific QR)
```

## Gym Owner Chain

```
member → owner_applications (pending)
              ↓ admin approves
         users.role = owner
              ↓
         gyms (registration_status: draft → pending → approved)
              ↓
         gym_machines (inventory by machine_id)
```
