# Daily health sync contract

Apple HealthKit reads authorized data on iOS/watchOS. Samsung Health data requires Android (Samsung Health Data SDK or Health Connect with the user's permission). This web repository implements the receiving side. It does not include a native app or vendor partnership, and cannot fetch health data from a browser on its own.

## Mobile companion flow

1. Trainee signs in to coachOS → Health data → Set up mobile sync → explicitly consents. POST `/api/health/connections` creates a 90-day, source-specific token, shown once. Its hash alone is stored server-side. Rotating or revoking it disables the old token.
2. A trusted native companion stores that bearer token in iOS Keychain / Android secure storage, never browser source code. It requests read permission for only the required health metrics through the native health framework.
3. Aggregate each metric by the trainee's local calendar day. Use HealthKit / Health Connect aggregation APIs with source deduplication, particularly when Samsung Health and another app share Health Connect. Do not sum raw samples from overlapping sources. Use sleep intervals without overlap, convert weight to kg, and active energy to kcal.
4. Send **complete daily aggregates**, up to 31 days per request, using HTTPS. Retry recent days to pick up late samples. The API replaces each `(user, source, date)` row; retries do not add duplicate steps or calories. Omit unavailable measurements, never substitute zero for a permission denial.
5. Background delivery is OS-controlled and not guaranteed at a precise daily time. Request the relevant background permissions/entitlements and refresh on app launch. Display the server's lastSyncAt timestamp; do not claim current data after permissions are revoked or sync fails.

```http
POST /api/health/ingest
Authorization: Bearer YOUR_PRIVATE_COMPANION_TOKEN
Content-Type: application/json
```

```json
{
  "days": [
    {
      "date": "2026-09-09",
      "timezone": "Asia/Tehran",
      "steps": 8420,
      "activeCalories": 410,
      "sleepMinutes": 455,
      "weightKg": 82.4
    }
  ]
}
```

200 returns `{"accepted":1}`. 401 means token expired/revoked; reauthorize. 400 means invalid/future date or invalid values. 429 means retry later (10-minute rate-limit bucket). 503 means transient backend/database failure. Unknown keys are discarded; tokens cannot choose a user ID or write a different source. Readings are private to the trainee except the weight measurements included in reports for their course's coach.

The user's Health data page supports revoking a token, deleting that source's daily records, inspecting expiry/last sync, and viewing received daily aggregates. Saved manual report measurements remain separately editable.

Official references:

- https://developer.apple.com/documentation/healthkit
- https://developer.apple.com/documentation/healthkit/hkhealthstore/enablebackgrounddelivery(for:frequency:withcompletion:)
- https://developer.samsung.com/health/health-connect-faq.html
- https://developer.samsung.com/health/data/faq.html
