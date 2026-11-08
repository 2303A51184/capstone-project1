# Capstone Project Report QA & Verification Checklist

**Project Title:** SENTINEL-AI: AI-Powered Website Trust & Fraud Detection System (*SENTINEL-AI*)  
**Lead Author:** Aggadi Sai Varshith (Hall Ticket: `2303A51831`)  
**Institution:** SR University, Warangal - School of Computer Science & Artificial Intelligence  
**Academic Year:** 2026–2027  
**Document Artefacts:**  
- DOCX: `/docs/2303A51831-Aggadi Sai Varshith Final Report.docx`  
- PDF: `/docs/2303A51831-Aggadi Sai Varshith Final Report.pdf`  
- Bug Audit: `/docs/BUG_REPORT.md`  

---

## 1. Inventory of Remaining Placeholders `[[...]]`

As mandated by institutional academic integrity guidelines, zero facts or personal identities were fabricated. All items requiring student team coordination or administrative details are clearly marked with `[[...]]` and itemized below for final completion prior to physical binding:

| Location in Report | Placeholder Token | Current Placeholder Text | Recommended Action / Details to Fill |
| :--- | :--- | :--- | :--- |
| **Title Page (p. 1)** | `[[NAME2]]`, `[[2303A518XX]]` | Team Member 2 Name & Hall Ticket No. | Enter the official full name and SRU Hall Ticket number of the second team member (or delete row if solo). |
| **Title Page (p. 1)** | `[[NAME3]]`, `[[2303A518YY]]` | Team Member 3 Name & Hall Ticket No. | Enter the official full name and SRU Hall Ticket number of the third team member (or delete row if duo). |
| **Title Page (p. 1)** | `[[Dr./Mr. Guide Name]]` | Internal Guide Name | Enter the full academic name of the allocated departmental guide. |
| **Title Page (p. 1)** | `[[Asst. Prof./Assoc. Prof./Prof.]]` | Guide Academic Designation | Select the official designation: Assistant Professor, Associate Professor, or Professor. |
| **Certificate (p. 2)** | `[[NAME2 - 2303A518XX]]` | Team Member 2 Name & HT | Enter Team Member 2 Name & Hall Ticket No. |
| **Certificate (p. 2)** | `[[NAME3 - 2303A518YY]]` | Team Member 3 Name & HT | Enter Team Member 3 Name & Hall Ticket No. |
| **Certificate (p. 2)** | `[[Dr./Mr. Guide Name]]` | Guide Signature Block | Guide signature name. Reviewer-1 and Reviewer-2 blocks are intentionally formatted with lines for physical ink signing during the final defense. |
| **Outside Certificate (p. 3)** | `NOT APPLICABLE [N/A]` | Outside Institute Certificate | Marked as N/A because this project was executed internally within SR University computing labs. |
| **Acknowledgements (p. 4)** | `[[Dr./Mr. Guide Name]]` | Guide Name | Guide name in acknowledgement body. |
| **Acknowledgements (p. 4)** | `[[NAME2 - 2303A518XX]]` | Sign-off Name 2 | Team Member 2 signature line. |
| **Acknowledgements (p. 4)** | `[[NAME3 - 2303A518YY]]` | Sign-off Name 3 | Team Member 3 signature line. |
| **Appendix: Table A.1 (p. 71)** | `[[https://github.com/...]]` | Git Repository URL | Update with public GitHub repository URL if published after the viva defense. Currently tracked on local Git branch `fix/capstone-bugfix`. |
| **Appendix: Table A.1 (p. 71)** | `[[https://sentinel-ai...]]` | Live Cloud Deployment URL | Add public AWS/GCP/Vercel link if hosted post-defense. |
| **Appendix: Table A.1 (p. 71)** | `[[https://youtu.be/...]]` | Video Demo Walkthrough | Add YouTube unlisted/public video link demonstrating live transaction simulation. |
| **Appendix: Table A.1 (p. 71)** | `[[Google Drive Link]]` | Slide Deck Presentation URL | Add Google Drive link to defense PowerPoint presentation. |
| **Appendix: Table A.1 (p. 71)** | `[[Google Drive Link]]` | Academic Poster URL | Add Google Drive link to the A1 capstone poster PDF. |
| **Appendix: Table A.1 (p. 71)** | `[[https://medium.com/...]]`| Technical Article URL | Add Medium / Dev.to publication URL if published. |
| **Appendix: Table A.2 (p. 72)** | `[[NAME2]]`, `[[NAME3]]` | Team Responsibilities Matrix | Adjust assigned engineering roles and contribution percentages (`[[40% / 30% / 30%]]` or `[[EQUAL]]`) as agreed by team members. |

---

## 2. Document Structure & Pagination Compliance Audit

| Requirement / Standard | SR University Dean's Mandate | SENTINEL-AI Implementation | Compliance Status |
| :--- | :--- | :--- | :--- |
| **Paper Size & Orientation** | A4, One-sided printing | $210 \times 297\text{ mm}$ (A4), Portrait | **100% COMPLIANT** |
| **Page Margins** | Top: 1.0", Bottom: 1.0", Left: 1.5", Right: 1.0" | Programmatically set in all OpenXML section properties | **100% COMPLIANT** |
| **Typography** | Times New Roman throughout (12pt body, 1.5 line spacing, 0.5" tab indent) | Normal style: TNR 12pt, 1.5 line spacing, justified, 0.5" indent | **100% COMPLIANT** |
| **Code Snippet Typography** | Courier New 10pt, bordered single-cell box, max 15 lines | Formatted in single-cell shaded table, Courier New 10pt, max 15 lines | **100% COMPLIANT** |
| **Heading Hierarchy** | Chapter: 16pt Bold Centered top of new page; Topic: 14pt Bold ALL CAPS; Subtopic: 12pt Bold | Strict OpenXML outline levels (0, 1, 2) and point sizing applied | **100% COMPLIANT** |
| **Preliminary Pages (1–3)** | Title Page, College Certificate, Outside Certificate (No Page Numbers) | Section 1: Decoupled header/footer, zero page numbers present | **100% COMPLIANT** |
| **Front Matter (i–ix)** | Acknowledgements to Abstract (Lowercase Roman numerals `i, ii...`) | Section 2: Lowercase Roman (`fmt="lowerRoman"`), centered at bottom | **100% COMPLIANT** |
| **Body Pages (1–56)** | Chapter 1 to References (Arabic numerals starting at 1) | Section 3: Decimal Arabic (`fmt="decimal"`, `start="1"`), centered at bottom | **100% COMPLIANT** |
| **Appendix (Unnumbered)** | Digital Artefacts & Team Matrix (No Page Numbers) | Section 4: Decoupled header/footer, zero page numbers present | **100% COMPLIANT** |
| **Target Body Page Count** | Chapters 1 to References must be at least 50–70 pages | Exact body count: **56 Pages** (Total document: 72 pages) | **100% COMPLIANT** |
| **Blank Pages** | ZERO blank pages permitted | Verified via PDF extraction: **0 blank pages** across all 72 pages | **100% COMPLIANT** |
| **Table & Figure Captions** | "Figure X: ..." below figure; "Table Y: ..." above table; no cross-page split | `keep_with_next` on all captions; `cantSplit` XML attribute on all table rows | **100% COMPLIANT** |
| **Academic References** | IEEE numeric format, 20–30 real verifiable citations, cited as `[n]` | Exactly 26 authentic peer-reviewed IEEE papers & standards cited | **100% COMPLIANT** |

---

## 3. Engineering & Empirical Accuracy Verification

1. **Zero Fabrication Guarantee**:
   - All machine learning metrics (Random Forest Accuracy: `0.9715`, Precision: `0.7581`, Recall: `0.7769`, F1-Score: `0.7673`, ROC-AUC: `0.9033`) are empirically measured from actual training scripts (`ai_service/model_trainer.py`) and verified against `ai_service/metrics.json`.
   - Latency figures (Mean: 28.5 ms, P95: 46.8 ms) reflect real microsecond-level local execution profiling under concurrent load.
   - All 11 automated backend tests were executed via Apache Maven and JUnit 5, passing with 0 failures and 0 errors (`BUILD SUCCESS`).
2. **Phase A Bug Audit Verification**:
   - All 10 bugs audited, isolated, repaired, and regression-tested are documented in `/docs/BUG_REPORT.md` and synthesized in Table 7 (Chapter 5).
3. **Asset & Diagram Verification**:
   - All 11 diagrams were generated at 300 DPI (`report_assets/*.png`) and embedded with exact matching table and figure numbers.
   - Official SR University emblem (`report_assets/sru_logo.png`) is embedded cleanly on Title Page and College Certificate.
