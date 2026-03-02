# Contract: GET /api/v1/csv/projects

**Type**: HTTP Endpoint  
**Method**: GET  
**Path**: `/api/v1/csv/projects`

---

## Request

### Query Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `living_lab_id` | positive integer | No | Filter results to a single living lab |

### Examples

```
GET /api/v1/csv/projects
GET /api/v1/csv/projects?living_lab_id=3
```

---

## Response

### 200 OK — CSV file

**Headers**:
```
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="projects.csv"
```

**Body** (CSV — first line is header):
```csv
"Lab","Project Name","Project Type","Start Date","Description"
"Geneva Lab","Micro-mobility Share","mobility","2022-03-15","City-wide scooter sharing program"
"Lyon Lab","Public Transport Upgrade","public_transport","","Extended metro line 3"
```

### 400 Bad Request — Invalid parameter

```json
{ "error": "Invalid parameter: living_lab_id must be a positive integer" }
```

### 404 Not Found — No rows matched the filters

```json
{ "error": "No data found for the requested filters" }
```

### 500 Internal Server Error

```json
{ "error": "Internal Server Error" }
```

---

## Behavior Notes

- When no filter is provided, all measure implementations for all labs are included.
- `Start Date` column is empty string `""` when `start_at` is null.
- `Description` column is empty string `""` when null.
- Response body never contains an empty CSV (header-row only) — a 404 is returned instead.
