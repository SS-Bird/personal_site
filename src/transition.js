// ---------------------------------------------------------------------------
// transition.js: the animations.
//
// First open:
//   1. UNFOLD: the sheet starts folded once; its crease is pulled up.
//   2. DROP:   the inner corners fall over their bars and reveal the header.
// Page change:
//   1. TUG:    the inner corners are dragged down and outward until both
//              pieces have peeled off the screen.
//   2. Swap in the new page and its fabric while the screen is empty.
//   3. RETURN: the new cloth is dragged back in by its inner corners: the
//              tug played backwards.
//
// Each tween just changes numbers in `config`. onUpdate pushes them to the
// shader and the HTML and draws a frame. When the timeline ends, nothing
// calls update(), so the GPU idles.
// ---------------------------------------------------------------------------
import gsap from 'gsap';
import { FONTS, loadFonts } from './fonts.js';

export function createTransitions({ config, els, update, setFabric, onShow = () => {} }) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let timeline = null;
  let busy = false;
  let queued = null;
  let firstPage = true;

  function showPage(page) {
    setFabric(page.fabric);
    if (page.fontSpecimen) loadFonts(FONTS.map((f) => f.name));
    els.scroller.innerHTML = page.html;
    els.scroller.scrollTop = 0;
    document.title = page.title;
    onShow();
  }

  // A fresh sheet: folded once, corners up, seam hidden, new random wobble.
  function newSheet(page) {
    showPage(page);
    config.unfold.progress = 0;
    config.fold.cornerDrop = 0;
    config.tug.progress = 0;
    config.scrollLift.progress = 0;
    config.seam.opacity = 0;
    config.fold.seed = Math.random() * 100;
    update();
  }

  // The new page's cloth, ready to be pulled back in: already unfolded with
  // its corners resting, but tugged all the way off-screen.
  function offscreenSheet(page) {
    showPage(page);
    config.unfold.progress = 1;
    config.fold.cornerDrop = 1;
    config.tug.progress = 1;
    config.scrollLift.progress = 0;
    config.seam.opacity = config.seam.restOpacity;
    config.fold.seed = Math.random() * 100; // invisible: the wobble is off while fully tugged
    update();
  }

  // Adds "unfold, then drop the corners" to a timeline.
  function addArrival(tl) {
    const a = config.animation;
    return tl
      .to(config.unfold, { progress: 1, ...a.unfold })
      .to(config.fold, { cornerDrop: 1, ...a.drop }, `+=${a.pause}`)
      // '<' = start at the same time as the previous tween
      .to(config.seam, { opacity: config.seam.restOpacity, duration: a.drop.duration, ease: 'sine.inOut' }, '<');
  }

  function finish() {
    busy = false;
    firstPage = false;
    if (queued) {
      const next = queued;
      queued = null;
      go(next);
    }
  }

  function firstOpen(page) {
    newSheet(page);
    timeline = addArrival(gsap.timeline({ onUpdate: update, onComplete: finish }));
  }

  function changePage(page) {
    const a = config.animation;
    timeline = gsap.timeline({ onUpdate: update, onComplete: finish })
      .to(config.tug, { progress: 1, ...a.tug })
      // .call() runs a function at that point in the timeline. The screen is
      // empty now, so swapping the fabric and content is invisible.
      .call(() => offscreenSheet(page), null, `+=${a.betweenSheets}`)
      .to(config.tug, { progress: 0, ...a.tugReturn });
  }

  // Reduced motion: no folding, just the resting state and a crossfade.
  function crossfade(page) {
    const rest = () => {
      config.unfold.progress = 1;
      config.fold.cornerDrop = 1;
      config.tug.progress = 0;
      config.seam.opacity = config.seam.restOpacity;
      update();
    };
    const duration = config.animation.reducedMotionFade * 1000;
    const fadeIn = () => {
      showPage(page);
      rest();
      els.scroller.animate([{ opacity: 0 }, { opacity: 1 }], { duration }).finished.then(finish);
    };
    if (firstPage) return fadeIn();
    els.scroller.animate([{ opacity: 1 }, { opacity: 0 }], { duration, fill: 'forwards' }).finished.then((anim) => {
      fadeIn();
      anim.cancel(); // drop the "forwards" fill now that the new page is fading in
    });
  }

  // page = { title, html, fabric }
  function go(page) {
    if (busy) {
      queued = page; // clicked during a transition: play it next
      return;
    }
    busy = true;
    timeline?.kill();
    if (reduceMotion.matches) crossfade(page);
    else if (firstPage) firstOpen(page);
    else changePage(page);
  }

  // For the debug GUI: replay just the arrival of a new sheet.
  function replayArrival(page) {
    if (busy) return;
    firstPage = true;
    go(page);
  }

  return { go, replayArrival };
}
