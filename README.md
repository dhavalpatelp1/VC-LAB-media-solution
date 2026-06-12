# VC Lab Media Solution

A lightweight, offline-capable laboratory calculator for scaling media recipes and performing common bench calculations.

## Purpose

This project was developed to reduce repetitive calculation errors during routine laboratory preparation. It provides a simple browser-based interface for scaling recipes and completing common concentration and dilution calculations.

## Features

- Scale media recipes to any target volume
- Percentage calculations for `% w/v` and `% v/v`
- Molarity calculations
- `C1V1 = C2V2` dilution calculations
- Local browser storage for saved recipes
- Progressive Web App support for offline use
- Responsive interface for desktop and mobile use

## Technology

- HTML5
- CSS3
- JavaScript
- LocalStorage
- Progressive Web App service worker

## Running locally

No installation is required. Clone or download the repository and open `index.html` in a modern browser.

For local development with a simple web server:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Research-use note

This tool is intended as a laboratory workflow aid. Users should independently verify calculations and preparation instructions before experimental use.

## Project role

Conceptualised, specified, tested, and iteratively developed as part of a broader effort to improve reproducibility and efficiency in laboratory workflows.
