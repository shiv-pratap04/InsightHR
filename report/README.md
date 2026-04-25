# Project report (LaTeX)

## Files

- `report.tex` — main document (edit `\newcommand{...}` placeholders at the top).
- `chapters/` — chapter bodies included via `\input`.
- `report.bib` — bibliography (BibTeX).
- `report_file/` — put `iiit_manipur.png` here (see `report_file/README.txt`).

## Build

From this `report/` directory:

```bash
pdflatex report.tex
bibtex report
pdflatex report.tex
pdflatex report.tex
```

Or use **latexmk**:

```bash
latexmk -pdf -bibtex report.tex
```

## Requirements

TeX distribution (TeX Live / MiKTeX) with `fouriernc`, `pgfplots`, `hyperref`, `booktabs`, `listings`, `xcolor` (with `table` option), `subcaption`, `longtable`, `tocbibind`.

## Customisation

Replace placeholders in `report.tex`: student name, roll number, semester, supervisor, emails, phone, dates, and month/year on the title page.
