# 06 — NOC and immigration

NOC determines a job's immigration value. Machine-readable list: `data/noc.json`.

## Tracks
- **Track A** — NOC 22XXX, TEER 2. Highest value: SOWP eligible + PR via Express Entry / OINP. Uses résumé Template A.
- **Track B** — NOC 72XXX / 73XXX, TEER 3. SOWP eligible + PR via Federal Skilled Trades. Uses résumé Template B.
- **Income-only** — NOC 75XXX or unknown. No SOWP/PR value; shown as "Backup".

## Rules summary
- Spousal Open Work Permit (SOWP): principal worker must be in TEER 0, 1, or an eligible TEER 2/3 role. Eligible categories: all NOC 22XXX, 72XXX, 73XXX.
- The principal worker's permit must have 16+ months remaining when the spouse applies. No minimum job tenure required first.
- PR pathways: Federal Skilled Trades (72XXX/73XXX), OINP Employer Job Offer, Express Entry CEC (1 year of Canadian skilled work in TEER 0-3).
- IRCC assesses actual duties, not job title. Always ask the employer for written NOC confirmation.
- Targeting priority: Track A (NOC 22XXX, TEER 2) highest for SOWP + PR; Track B (NOC 72XXX/73XXX, TEER 3) strong for Federal Skilled Trades; income-only roles (75XXX) do not advance immigration but may be taken for income.

## In the app
Show SOWP eligibility and the PR pathway on the job detail. **Never** put SOWP/immigration language in résumés or cover letters — that is for Rudra's eyes only.

## Full NOC list
```json
[
  {
    "code": "22210",
    "name": "Architectural Technician",
    "teer": 2,
    "track": "A",
    "sowp": true,
    "pr": "Express Entry / OINP"
  },
  {
    "code": "22212",
    "name": "Drafting / CAD Technician",
    "teer": 2,
    "track": "A",
    "sowp": true,
    "pr": "Express Entry / OINP"
  },
  {
    "code": "22300",
    "name": "Civil Engineering Technician",
    "teer": 2,
    "track": "A",
    "sowp": true,
    "pr": "Express Entry / OINP"
  },
  {
    "code": "22303",
    "name": "Construction Estimator",
    "teer": 2,
    "track": "A",
    "sowp": true,
    "pr": "Express Entry / OINP"
  },
  {
    "code": "22234",
    "name": "Building / Construction Inspector",
    "teer": 2,
    "track": "A",
    "sowp": true,
    "pr": "Express Entry / OINP"
  },
  {
    "code": "72100",
    "name": "CNC Operator / Machinist Helper",
    "teer": 3,
    "track": "B",
    "sowp": true,
    "pr": "Federal Skilled Trades"
  },
  {
    "code": "72101",
    "name": "Tool & Die Helper",
    "teer": 3,
    "track": "B",
    "sowp": true,
    "pr": "Federal Skilled Trades"
  },
  {
    "code": "72102",
    "name": "Sheet Metal Worker",
    "teer": 3,
    "track": "B",
    "sowp": true,
    "pr": "Federal Skilled Trades"
  },
  {
    "code": "72104",
    "name": "Boilermaker",
    "teer": 3,
    "track": "B",
    "sowp": true,
    "pr": "Federal Skilled Trades"
  },
  {
    "code": "72105",
    "name": "Ironworker / Structural Metal",
    "teer": 3,
    "track": "B",
    "sowp": true,
    "pr": "Federal Skilled Trades"
  },
  {
    "code": "72106",
    "name": "Welder / Fabricator Helper",
    "teer": 3,
    "track": "B",
    "sowp": true,
    "pr": "Federal Skilled Trades"
  },
  {
    "code": "72200",
    "name": "Electrician Helper",
    "teer": 3,
    "track": "B",
    "sowp": true,
    "pr": "Federal Skilled Trades"
  },
  {
    "code": "72300",
    "name": "Plumber Helper",
    "teer": 3,
    "track": "B",
    "sowp": true,
    "pr": "Federal Skilled Trades"
  },
  {
    "code": "72310",
    "name": "Carpenter / Helper",
    "teer": 3,
    "track": "B",
    "sowp": true,
    "pr": "Federal Skilled Trades"
  },
  {
    "code": "72311",
    "name": "Cabinetmaker",
    "teer": 3,
    "track": "B",
    "sowp": true,
    "pr": "Federal Skilled Trades"
  },
  {
    "code": "72400",
    "name": "Industrial Mechanic / Millwright Helper",
    "teer": 3,
    "track": "B",
    "sowp": true,
    "pr": "Federal Skilled Trades"
  },
  {
    "code": "72401",
    "name": "HVAC Technician Helper",
    "teer": 3,
    "track": "B",
    "sowp": true,
    "pr": "Federal Skilled Trades"
  },
  {
    "code": "72402",
    "name": "Refrigeration Mechanic Helper",
    "teer": 3,
    "track": "B",
    "sowp": true,
    "pr": "Federal Skilled Trades"
  },
  {
    "code": "73100",
    "name": "Concrete Finisher",
    "teer": 3,
    "track": "B",
    "sowp": true,
    "pr": "Federal Skilled Trades"
  },
  {
    "code": "73102",
    "name": "Plasterer / Drywall Installer",
    "teer": 3,
    "track": "B",
    "sowp": true,
    "pr": "Federal Skilled Trades"
  },
  {
    "code": "73110",
    "name": "Tilesetter / Floor Covering",
    "teer": 3,
    "track": "B",
    "sowp": true,
    "pr": "Federal Skilled Trades"
  },
  {
    "code": "73111",
    "name": "Roofer / Shingler",
    "teer": 3,
    "track": "B",
    "sowp": true,
    "pr": "Federal Skilled Trades"
  },
  {
    "code": "73112",
    "name": "Painter & Decorator",
    "teer": 3,
    "track": "B",
    "sowp": true,
    "pr": "Federal Skilled Trades"
  },
  {
    "code": "75101",
    "name": "Warehouse / Order Picker",
    "teer": 4,
    "track": "N",
    "sowp": false,
    "pr": "None - income only"
  },
  {
    "code": "75110",
    "name": "General Labourer / Machine Op",
    "teer": 4,
    "track": "N",
    "sowp": false,
    "pr": "None - income only"
  },
  {
    "code": "other",
    "name": "Other / confirm NOC",
    "teer": 0,
    "track": "N",
    "sowp": false,
    "pr": "Confirm with employer"
  }
]
```
