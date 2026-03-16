/* ============================================
   animationFactory.js — Factory pattern for hero animations

   Usage:
     AnimationFactory.create('geometricWireframe', canvasElement, options);

   To add a new animation:
     1. Create a new file in src/animations/ (e.g., particleNetwork.js)
     2. Register it in the registry below
   ============================================ */

var AnimationFactory = (function () {

  /* --- Animation registry --- */
  var registry = {};

  /**
   * Register an animation constructor.
   * @param {string} name — unique identifier
   * @param {function} factory — function(canvas, options) that returns { start, stop, resize }
   */
  function register(name, factory) {
    registry[name] = factory;
  }

  /**
   * Create and start an animation by name.
   * @param {string} name — registered animation name
   * @param {HTMLCanvasElement} canvas — target canvas element
   * @param {object} [options] — animation-specific config
   * @returns {object} controller with start(), stop(), resize() methods
   */
  function create(name, canvas, options) {
    if (!registry[name]) {
      console.warn('[AnimationFactory] Unknown animation: "' + name + '"');
      console.warn('[AnimationFactory] Available:', Object.keys(registry).join(', '));
      return null;
    }

    var instance = registry[name](canvas, options || {});

    /* Auto-handle resize */
    var resizeHandler = function () {
      canvas.width = canvas.parentElement.offsetWidth;
      canvas.height = canvas.parentElement.offsetHeight;
      if (instance.resize) {
        instance.resize(canvas.width, canvas.height);
      }
    };

    window.addEventListener('resize', resizeHandler);
    resizeHandler();

    instance.start();

    /* Return controller */
    return {
      start: instance.start,
      stop: function () {
        instance.stop();
        window.removeEventListener('resize', resizeHandler);
      },
      resize: resizeHandler
    };
  }

  /**
   * List all registered animation names.
   * @returns {string[]}
   */
  function list() {
    return Object.keys(registry);
  }

  return {
    register: register,
    create: create,
    list: list
  };

})();
