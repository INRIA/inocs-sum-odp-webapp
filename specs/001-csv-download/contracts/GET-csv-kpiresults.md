# Contract: GET /api/v1/csv/kpiresults

**Type**: HTTP Endpoint  
**Method**: GET  
**Path**: `/api/v1/csv/kpiresults`

---

## Request

### Query Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `living_lab_id` | positive integer | No | Filter results to a single living lab |
| `category_id` | positive integer | No | Filter results to a single KPI group (category) |
| `kpidefinition_id` | positive integer | No | Filter results to a single KPI definition |

All parameters are optional and can be combined. Non-integer or negative values are rejected.

### Examples

```
GET /api/v1/csv/kpiresults
GET /api/v1/csv/kpiresults?living_lab_id=3
GET /api/v1/csv/kpiresults?category_id=7
GET /api/v1/csv/kpiresults?living_lab_id=3&kpidefinition_id=12
GET /api/v1/csv/kpiresults?kpidefinition_id=12
```

---

## Response

### 200 OK — CSV file

**Headers**:
```
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="kpi-results.csv"
```

**Body** (CSV — first line is header):
```csv
"Lab","KPI Number","KPI Name","KPI Group","Metric","Value","Date","Transport Mode"
"Geneva Lab","1.1","Air Quality","Environment","µg/m3","45.2","2023-01-01","Car"
"Lyon Lab","1.1","Air Quality","Environment","µg/m3","38.0","2023-01-01",""
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

- When no filters are provided, all KPI results across all labs are included.
- For KPI definitions linked to multiple categories, the first category name (by insertion order) is used.
- `Transport Mode` column is empty string `""` when the KPI result has no transport mode.
- Response body never contains an empty CSV (header-row only) — a 404 is returned instead.
