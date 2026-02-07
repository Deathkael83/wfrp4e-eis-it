# WFRP4E – Enemy in Shadows (IT) – Translation Workflow

This repository contains the **technical workflow and tooling** for an Italian translation module for *Warhammer Fantasy Roleplay 4th Edition – Enemy in Shadows*, intended for use with **Foundry VTT** and **Babele**.

⚠️ **Important notice**  
This project is currently a **private work in progress**.  
It is used to develop and test a translation workflow.  
The textual content is **not intended for public distribution** at this stage.

---

## Scope of the Project

- Provide a clean, maintainable workflow for translating Foundry VTT content
- Support incremental, testable translations (page by page, entity by entity)
- Generate Babele-compatible translation files automatically
- Keep translation sources modular and readable

The project is structured to support translations for the following content types:

- Journals
- Actors
- Items
- Tables
- Scenes

Each content type is handled independently to ensure scalability and maintainability.

---

## Repository Structure

```text
src/
  journals/
  actors/
  items/
  tables/
  scenes/

translations/
  (generated output for Babele)

tools/
  build-journals.mjs
  build-actors.mjs
  build-items.mjs
  build-tables.mjs
  build-scenes.mjs
