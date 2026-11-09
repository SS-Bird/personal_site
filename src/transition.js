// ---------------------------------------------------------------------------
// transition.js: the animations.
//
// First open:
//   1. UNFOLD: the sheet starts folded once; its crease is pulled up.
//   2. DROP:   the inner corners fall over their bars and reveal the header.
// Page change:
//   1. TUG:    the inner corners are dragged down and outward until both
//              pieces have peeled off the screen. Between two Sewing pages
//              (same linen, same patches) only the main piece goes; the
//              left strip stays put.
//   2. Swap in the new page and its fabric while that cloth is off-screen.
//   3. RETURN: the new cloth is dragged back in by its inner corners: the
//              tug played backwards.
// Clicking another link mid-change re-aims it: the cloth carries on from
// wherever it is, back off the screen, and returns with the newest page.
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
  let queued = null;    // only used by the reduced-motion crossfade
  let firstPage = true;
  let arriving = false; // the first-open animation is playing
  let onScreen = null;  // the page whose content is on the cloth right now

  function showPage(page) {
    onScreen = page;
    setFabric(page.fabric);
    if (page.fontSpecimen) loadFonts(FONTS.map((f) => f.name));
    els.scroller.innerHTML = page.html;
    els.scroller.scrollTop = 0;
    document.title = page.title;
    onShow(page);
  }

  // A fresh sheet: folded once, corners up, seam hidden, new random wobble.
  function newSheet(page) {
    showPage(page);
    config.unfold.progress = 0;
    config.fold.cornerDrop = 0;
    config.tug.progress = 0;
    config.tug.stripProgress = 0;
    config.scrollLift.progress = 0;
    config.seam.opacity = 0;
    config.fold.seed = Math.random() * 100;
    config.fold.stripSeed = null;
    update();
  }

  // The new page's cloth, ready to be pulled back in: already unfolded with
  // its corners resting, but tugged all the way off-screen. With stripStays,
  // only the main piece is new: the strip keeps its place and its wobble.
  function offscreenSheet(page, stripStays) {
    showPage(page);
    config.unfold.progress = 1;
    config.fold.cornerDrop = 1;
    config.tug.progress = 1;
    config.scrollLift.progress = 0;
    config.seam.opacity = config.seam.restOpacity;
    if (stripStays) {
      config.fold.stripSeed ??= config.fold.seed + 31.7; // freeze the strip's current wobble
    } else {
      config.tug.stripProgress = 1;
      config.fold.stripSeed = null;
    }
    config.fold.seed = Math.random() * 100; // invisible: the wobble is off while fully tugged
    update();
  }

  // Can the strip stay while the main piece changes? Only if both pages are
  // Sewing pages (same patches) on the same linen.
  const stripCanStay = (from, to) =>
    from?.section === 'sewing' && to.section === 'sewing' && from.fabric === to.fabric;

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
    arriving = false;
    firstPage = false;
    if (queued) {
      const next = queued;
      queued = null;
      go(next);
    }
  }

  function firstOpen(page) {
    arriving = true;
    newSheet(page);
    timeline = addArrival(gsap.timeline({ onUpdate: update, onComplete: finish }));
  }

  // A tween's duration, scaled by how far there is left to go, so carrying
  // on from halfway takes half as long (but never less than a moment).
  // When carrying on from part-way, an ease that "starts slow" would make the
  // cloth stall for a moment, so carry on at a steady speed ('none') instead.
  const scaled = (spec, from, to) => {
    const left = Math.abs(to - from);
    return { ...spec, duration: Math.max(0.25, spec.duration * left), ...(left < 0.99 && spec.ease.endsWith('.in') ? { ease: 'none' } : {}) };
  };

  // Change to `page`, starting from wherever the cloth is now: at rest, or
  // part-way through an earlier change (so it can be re-aimed mid-flight).
  function changePage(page) {
    const a = config.animation;
    const tug = config.tug;
    timeline?.kill();
    timeline = gsap.timeline({ onUpdate: update, onComplete: finish });

    // Clicked back to the page that's already on the cloth: just let the
    // cloth fall back into place, no swap.
    if (page === onScreen) {
      timeline
        .to(tug, { progress: 0, ...scaled(a.tugReturn, tug.progress, 0) })
        .to(tug, { stripProgress: 0, ...scaled(a.tugReturn, tug.stripProgress, 0) }, '<');
      return;
    }

    const stripStays = stripCanStay(onScreen, page);
    timeline
      .to(tug, { progress: 1, ...scaled(a.tug, tug.progress, 1) })
      // '<' = at the same time. The strip goes too, unless it can stay (then
      // it settles back, in case an earlier change had started moving it).
      .to(tug, stripStays
        ? { stripProgress: 0, ...scaled(a.tugReturn, tug.stripProgress, 0) }
        : { stripProgress: 1, ...scaled(a.tug, tug.stripProgress, 1) }, '<')
      // .call() runs a function at that point in the timeline. The cloth
      // that's changing is off-screen now, so swapping it is invisible.
      .call(() => offscreenSheet(page, stripStays), null, `+=${a.betweenSheets}`)
      .to(tug, { progress: 0, ...a.tugReturn });
    if (!stripStays) timeline.to(tug, { stripProgress: 0, ...a.tugReturn }, '<');
  }

  // Reduced motion: no folding, just the resting state and a crossfade.
  function crossfade(page) {
    const rest = () => {
      config.unfold.progress = 1;
      config.fold.cornerDrop = 1;
      config.tug.progress = 0;
      config.tug.stripProgress = 0;
      config.seam.opacity = config.seam.restOpacity;
      update();
    };
    const duration = config.animation.reducedMotionFade * 1000;
    // Fade the page text and the patches together.
    const fade = (keyframes, options) =>
      Promise.all([els.scroller, els.patches].map((el) => el.animate(keyframes, { duration, ...options }).finished));
    const fadeIn = () => {
      showPage(page);
      rest();
      fade([{ opacity: 0 }, { opacity: 1 }]).then(finish);
    };
    if (firstPage) return fadeIn();
    fade([{ opacity: 1 }, { opacity: 0 }], { fill: 'forwards' }).then((anims) => {
      fadeIn();
      anims.forEach((anim) => anim.cancel()); // drop the "forwards" fill now that the new page is fading in
    });
  }

  // page = { title, html, fabric }
  function go(page) {
    if (reduceMotion.matches) {
      if (busy) { queued = page; return; } // a crossfade is short: play it next
      busy = true;
      crossfade(page);
      return;
    }
    // Clicked while the very first sheet is still arriving: put the new page
    // on it straight away and let it carry on arriving.
    if (arriving) {
      showPage(page);
      update();
      return;
    }
    busy = true;
    if (firstPage) firstOpen(page);
    else changePage(page); // also re-aims a change that's already playing
  }

  // For the debug GUI: replay just the arrival of a new sheet.
  function replayArrival(page) {
    if (busy) return;
    firstPage = true;
    go(page);
  }

  return { go, replayArrival };
}
