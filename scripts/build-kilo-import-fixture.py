#!/usr/bin/env python3
"""Build Kilo receiving import fixture from example roster template."""

from pathlib import Path
from openpyxl import Workbook

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "sprints/Sprint-27-Recruit-Lifecycle/fixtures/kilo-receiving-import-5.xlsx"

headers = [
    "Recruit Name",
    "EDIPI / SSN",
    "MOS Prog",
    "Platoon",
    "IST Pull-ups",
    "IST Plank",
    "IST 1.5mi",
    "GT Score",
    "Weapons Serial",
    "Medical / Admin Flags",
]

rows = [
    ["ADAMS, Johnathan M.", "8870100001", "UH (Infantry)", "0000", 14, "3:45", "9:30", 115, "WPN-3001-001", "Kilo Lead 3001. None. High PT performer."],
    ["BLACZYK, Krzysztof", "8870100002", "CE (Combat Support)", "0000", 6, "2:10", "11:45", 108, "WPN-3001-002", "Kilo Lead 3001. Name Scan: Difficult pronunciation."],
    ["GARCIA, Carlos R.", "8870100003", "CH (Media/Legal)", "0000", 8, "2:50", "12:15", 122, "WPN-3001-003", "Kilo Lead 3001. Scribe Candidate: High GT score."],
    ["JOHNSON, Malik T.", "8870100004", "UT (Utilities)", "0000", 3, "1:20", "13:40", 95, "WPN-3003-001", "Kilo Follow 3003. PCP Risk: Low plank, borderline run time."],
    ["SMITH, Christian A.", "8870100005", "DD (Intel)", "0000", 11, "3:10", "10:15", 130, "WPN-3003-002", "Kilo Follow 3003. Medical: Penicillin Allergy (Requires Red Tag)."],
]

OUT.parent.mkdir(parents=True, exist_ok=True)
wb = Workbook()
ws = wb.active
ws.title = "Roster"
ws.append(headers)
for row in rows:
    ws.append(row)
wb.save(OUT)
print(f"Wrote {OUT}")
