/* ============================================
   pageBuilder.js — Assembles HTML components into the page

   Loads individual section files from src/components/ and injects
   them into the page in order. After assembly, initializes
   animations, theme toggle, scroll nav, and fade-in observers.

   Usage (in index.html):
     <div id="app"></div>
     <script src="src/scripts/pageBuilder.js"></script>
     <script>
       PageBuilder.build('app', [
         'src/components/navbar.html',
         'src/components/hero.html',
         'src/components/experience.html',
         'src/components/projects.html',
         'src/components/contact.html',
         'src/components/footer.html'
       ]);
     </script>
   ============================================ */

var PageBuilder = (function () {

  /**
   * Fetch a single HTML component file.
   * @param {string} url — path to the component HTML file
   * @returns {Promise<string>} resolved HTML string
   */
  function fetchComponent(url) {
    return fetch(url).then(function (response) {
      if (!response.ok) {
        console.warn('[PageBuilder] Failed to load: ' + url + ' (' + response.status + ')');
        return '';
      }
      return response.text();
    });
  }

  /**
   * Build the page by loading components in order and injecting into a container.
   * @param {string} containerId — id of the target DOM element
   * @param {string[]} componentPaths — ordered list of component file paths
   * @param {object} [callbacks] — optional lifecycle hooks
   * @param {function} [callbacks.onReady] — called after all components are injected
   */
  function build(containerId, componentPaths, callbacks) {
    var container = document.getElementById(containerId);
    if (!container) {
      console.error('[PageBuilder] Container #' + containerId + ' not found.');
      return;
    }

    /* Load all components in parallel, but inject in order */
    var fetches = componentPaths.map(function (path) {
      return fetchComponent(path);
    });

    Promise.all(fetches).then(function (htmlParts) {
      container.innerHTML = htmlParts.join('\n');

      /* --- Post-assembly initialization --- */
      initThemeToggle();
      initScrollNav();
      initFadeIn();
      initHeroAnimation();

      /* Fire onReady callback if provided */
      if (callbacks && typeof callbacks.onReady === 'function') {
        callbacks.onReady();
      }
    });
  }

  /* --- Theme toggle --- */
  function initThemeToggle() {
    var toggle = document.querySelector('.theme-toggle');
    var root = document.documentElement;

    var saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      root.setAttribute('data-theme', 'dark');
    }

    if (!toggle) return;
    toggle.addEventListener('click', function () {
      var isDark = root.getAttribute('data-theme') === 'dark';
      if (isDark) {
        root.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
      } else {
        root.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
      }
      /* Refresh animation colors */
      if (window._heroAnimation && window._heroAnimation.resize) {
        window._heroAnimation.resize();
      }
    });
  }

  /* --- Scroll-based active nav link --- */
  function initScrollNav() {
    var sections = document.querySelectorAll('section[id]');
    var navLinks = document.querySelectorAll('.navbar__links a');

    window.addEventListener('scroll', function () {
      var scrollY = window.pageYOffset;

      sections.forEach(function (section) {
        var top = section.offsetTop - 100;
        var bottom = top + section.offsetHeight;
        var id = section.getAttribute('id');

        navLinks.forEach(function (link) {
          if (link.getAttribute('href') === '#' + id) {
            if (scrollY >= top && scrollY < bottom) {
              link.classList.add('active');
            } else {
              link.classList.remove('active');
            }
          }
        });
      });
    });
  }

  /* --- Scroll-triggered fade-in via IntersectionObserver --- */
  function initFadeIn() {
    var fadeEls = document.querySelectorAll('.fade-in');

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15 }
      );

      fadeEls.forEach(function (el) {
        observer.observe(el);
      });
    } else {
      fadeEls.forEach(function (el) {
        el.classList.add('visible');
      });
    }
  }

  /* --- Hero canvas animation via AnimationFactory --- */
  function initHeroAnimation() {
    var canvas = document.getElementById('hero-animation');
    if (canvas && typeof AnimationFactory !== 'undefined') {
      window._heroAnimation = AnimationFactory.create('geometricWireframe', canvas);
    }
  }

  return {
    build: build
  };

})();
