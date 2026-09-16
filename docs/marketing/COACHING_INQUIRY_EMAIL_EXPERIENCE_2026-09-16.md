# Coaching Inquiry Email Experience — premium reply flow

**Date:** September 16, 2026  
**Status:** target experience approved in principle; FormSubmit remains the live transport until a branded sender is wired.

## Problem

The current coaching inquiry notification is operationally useful but aesthetically poor when quoted into a reply. Because Brice often replies directly from the notification, the lead can see the previous message body. The notification therefore becomes part of the customer experience.

## Product principle

The inbox is an action surface, not a database dump.

A new inquiry email should:
- be readable in one screen on a phone;
- make the next action obvious;
- preserve `Reply-To` so native Reply addresses the lead;
- contain only customer-safe fields in the visible body;
- move attribution / technical metadata out of the visible body where possible;
- look like FORM, not like a generic form backend;
- remain useful when quoted into the customer-facing reply.

## Target notification

**From:** `FORM <inquiries@speedandform.com>`  
**Reply-To:** athlete email  
**Subject:** `Run Development · Jorge Tacoronte · 8 weeks · $1,200`

Visible body:

- FORM wordmark
- `New coaching inquiry`
- athlete name + location
- one-line goal
- one-line current training summary
- one-line obstacle
- offer shown
- primary action: `Reply to Jorge →`

Example:

> FORM.
>
> **New coaching inquiry**
>
> **Jorge Tacoronte** · Miami  
> Wants to run longer
>
> **Current running**  
> 3 days/week · 10–20 mi/week · longest 6–10 mi · strength
>
> **Main obstacle**  
> Speed and breath
>
> **Offer shown**  
> Run Development · 8 weeks · $1,200
>
> **Reply to Jorge →**

Footer, muted:
`Submitted through speedandform.com`

## What the lead should see if the notification is quoted

The quoted block must still feel intentional and customer-safe. Do not expose:
- UTM parameter names;
- campaign IDs;
- raw field keys with underscores;
- backend/provider branding;
- duplicate fee / program fields;
- implementation notes;
- internal test labels.

Attribution such as `meta / paid_social / form_miami_run_test01 / run_development_video01` should be stored separately (database / provider headers / analytics) rather than placed in the visible email body once the branded sender is live.

## Why FormSubmit is a temporary ceiling

FormSubmit supports reply-to and several stock templates, which is enough for a compact stopgap. It does not give FORM full control over the sender identity or arbitrary premium HTML notification design. The live stopgap should therefore stay compact and replyable, but the target state is a branded transactional sender.

## Recommended transport

Use a transactional email provider such as Resend from a small server-side function.

Preferred architecture:
1. coaching form posts to a server-side endpoint;
2. endpoint validates and stores the inquiry;
3. endpoint sends one branded internal notification to `brice@speedandform.com`;
4. `From: FORM <inquiries@speedandform.com>`;
5. `Reply-To: athlete email`;
6. technical source metadata stored outside the visible body;
7. provider delivery status is logged;
8. only after accepted delivery does the UI show success / fire lead measurement.

Keep FormSubmit as fallback until the branded path has been proven in production.

## Visual direction

Apple-level here means restraint, not decoration:
- white or warm-white canvas;
- SF / system sans;
- black + neutral gray only, with one FORM accent if needed;
- generous padding;
- no table-box grid around every field;
- no dark theme in email;
- no oversized branding;
- no marketing paragraph;
- one dominant action;
- maximum ~600px content width;
- readable in one iPhone screen where possible.

## Reply behavior

Two acceptable paths:

### Native Reply
`Reply-To` points directly to the athlete. The quoted original remains visually clean because the notification itself is customer-safe.

### Clean compose action
A `Reply to <first name> →` mailto action opens a fresh compose with the athlete address and subject prefilled. This avoids quoted intake content entirely when Brice prefers a clean first-touch email.

## Acceptance test

Before replacing FormSubmit:
- notification arrives from FORM-branded sender;
- SPF/DKIM/DMARC pass;
- native Reply addresses the athlete;
- reply from iPhone Gmail does not expose ugly implementation metadata;
- compact card fits on one phone screen without scrolling for a normal inquiry;
- source attribution is still retained somewhere operationally;
- no duplicate notification;
- failed mail delivery does not silently discard the inquiry;
- the lead event is fired only after the inquiry is durably accepted.

## Current immediate stopgap

Until the branded sender is live:
- keep FormSubmit stable opaque endpoint;
- keep `_replyto` set to athlete email;
- use the most compact stock template;
- use friendly field labels;
- collapse training data into one line;
- collapse offer into one line;
- keep source attribution to one concise line at most;
- subject stays action-oriented and includes offer / duration / price.
