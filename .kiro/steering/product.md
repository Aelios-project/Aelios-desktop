---
inclusion: always
---

# Product

Aelios-desktop is the local half of a cloud AI resident. The resident (Aelios-resident, a Cloudflare Worker) lives in the cloud and works without this project. Aelios-desktop gives it hands on one machine.

## Who it is for

A person who already has a cloud resident and wants it to do real work on their own computer or a VPS: read a repository, edit files, run a task. They keep control: they pick the folder, the helper and the permission tier.

## What it does

- Takes jobs from the resident, runs them through a coding helper over ACP, and sends back a receipt.
- Lets the person talk straight to a running thread. Their words go to the thread, not through the resident.
- Turns questions, finished work and stuck work into entries in a "waiting for you" list, instead of chat noise.

## Two ways to run

One program, two modes: headless (works, in `packages/runner`) and desktop with a window (planned, in `packages/desktop`, based on DeepSeek Harness).

## Principles

- The cloud sends text and a thread id only. This machine's config decides helper, folder and permission.
- The helper knows nothing about the person it works for.
- Nothing is redone silently. When the state is unclear, ask.
