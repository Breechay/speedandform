-- Four coaching objects were written by the seed and published under Brice's
-- name: one Direction, one Read, two Decisions. He did not write any of them.
-- Published, they read to Natalie as coaching from her coach, and back to Brice
-- as his own "recent coaching". That is a fabricated authority claim, and the
-- record is supposed to be the one thing that is true.
--
-- Retracted to draft rather than deleted: reversible, and Brice may want to
-- rewrite rather than lose the rows. Draft is excluded from every athlete-facing
-- and coach-facing read, so nothing reaches Natalie in the meantime.
--
-- Nothing here should be re-seeded. Coaching content is authored, never generated.

update public.directions
   set delivery_state = 'draft', published_at = null
 where delivery_state in ('published', 'delivered_externally');

update public.reads
   set delivery_state = 'draft', published_at = null
 where delivery_state in ('published', 'delivered_externally');

update public.decisions
   set delivery_state = 'draft', published_at = null
 where delivery_state in ('published', 'delivered_externally');
