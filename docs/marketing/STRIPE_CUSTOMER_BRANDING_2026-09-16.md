# Stripe Customer-Facing Branding — FORM

**Updated:** September 16, 2026  
**Status:** read-only audit complete; live branding change intentionally not applied yet.

Stripe is part of the customer experience because Checkout, Payment Links and receipts are customer-facing.

## Current live read

Stripe brand settings currently resolve to:
- Checkout background: white
- Checkout button: Stripe blue
- primary brand color: blue-gray
- secondary/accent: Stripe blue
- logo: none
- icon: none
- font: default

This is functional but does not yet look like Speed & Form. Treat it as roughly **5.5/10** against the current FORM customer-experience standard.

## Target

Keep Stripe restrained rather than heavily themed:
- background: white
- button: FORM ink / near-black
- primary: FORM ink
- accent: restrained FORM green
- default/system font
- existing rounded/default border style
- FORM/SF mark or clean wordmark asset
- no decorative background imagery

Candidate palette:
- ink: `#111111`
- green accent: `#9acb19`
- white: `#ffffff`

Candidate existing icon asset to inspect before use:
`https://speedandform.com/apple-touch-icon.png`

Do not apply the asset blindly. Check that it remains legible at receipt/icon scale and that it is the current brand mark.

## Acceptance

Before calling Stripe 9/10:
- [ ] preview Checkout on phone and desktop;
- [ ] confirm product name and `$79.00` hierarchy remains dominant;
- [ ] confirm black CTA passes contrast;
- [ ] confirm logo/icon looks intentional at small size;
- [ ] inspect a real receipt preview/customer email;
- [ ] verify statement descriptor remains `SPEED AND FORM`;
- [ ] verify support identity/address remains appropriate;
- [ ] do not add promotional clutter to receipts.

## Change-control note

Stripe branding is a live-account setting shared by hosted surfaces and receipts. Apply it deliberately, not as an incidental site deploy.
