-- Simon has a face.
--
-- Three of five columns on the bench were a gradient plate, which made the whole
-- surface read half-built rather than deliberate. His is the first portrait that
-- is not a tight studio-style frame: a wide environmental shot, mostly track, him
-- small in the middle of it. So the crop values do real work here — the six
-- numbers exist precisely so a photograph does not have to be re-cut to be used.
--
-- Zoom 1.95 against Jose's 1.10 and Hope's 1.05, because their photographs are
-- already close and his is not. Anchored at 53 across and 40 down, which is the
-- midpoint of him rather than of the frame, and lifted a little in exposure
-- because it is a night photograph and the column dims it again.

update public.athletes
   set portrait_path     = 'e8328097-a879-448b-baae-3461f176d166/portrait.png',
       portrait_x        = 53,
       portrait_y        = 40,
       portrait_zoom     = 1.95,
       portrait_exposure = 1.12,
       portrait_contrast = 1.14,
       portrait_grade    = 0.20
 where slug = 'simon';
