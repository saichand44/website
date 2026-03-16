/* ============================================
   geometricWireframe.js — Multiple scattered wireframe icosahedrons

   Registered as 'geometricWireframe' in AnimationFactory.
   Options:
     - color:       stroke color (default: pulled from CSS --color-accent)
     - opacity:     max line opacity (default: 0.25)
     - speed:       rotation speed multiplier (default: 1)
     - count:       number of wireframes (default: 6)
   ============================================ */

(function () {

  function geometricWireframe(canvas, options) {
    var ctx = canvas.getContext('2d');
    var animId = null;

    /* Config */
    var accentColor = options.color || getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim() || '#5D8AA8';
    var maxOpacity = options.opacity || 0.25;
    var speedMult = options.speed || 1;
    var shapeCount = options.count || 16;

    /* Mouse interaction — subtle parallax */
    var mouseX = 0;
    var mouseY = 0;
    canvas.parentElement.addEventListener('mousemove', function (e) {
      var rect = canvas.parentElement.getBoundingClientRect();
      mouseX = (e.clientX - rect.left) / rect.width - 0.5;
      mouseY = (e.clientY - rect.top) / rect.height - 0.5;
    });

    /* --- Icosahedron geometry --- */
    var phi = (1 + Math.sqrt(5)) / 2;

    var baseVertices = [
      [-1,  phi, 0], [ 1,  phi, 0], [-1, -phi, 0], [ 1, -phi, 0],
      [ 0, -1,  phi], [ 0,  1,  phi], [ 0, -1, -phi], [ 0,  1, -phi],
      [ phi, 0, -1], [ phi, 0,  1], [-phi, 0, -1], [-phi, 0,  1]
    ];

    var len = Math.sqrt(1 + phi * phi);
    baseVertices = baseVertices.map(function (v) {
      return [v[0] / len, v[1] / len, v[2] / len];
    });

    var edges = [
      [0,1],[0,5],[0,11],[0,7],[0,10],
      [1,5],[1,9],[1,7],[1,8],
      [2,3],[2,4],[2,11],[2,6],[2,10],
      [3,4],[3,9],[3,6],[3,8],
      [4,5],[4,9],[4,11],
      [5,9],[5,11],
      [6,7],[6,8],[6,10],
      [7,8],[7,10],
      [8,9],
      [10,11]
    ];

    /* --- Generate scattered shapes using grid-based placement --- */
    var shapes = [];

    /* Predefined positions to ensure full spread across the hero.
       Each shape gets a zone; a small random jitter keeps it organic. */
    var presetPositions = [
      /* Corners */
      { x: 0.05, y: 0.10 },
      { x: 0.92, y: 0.08 },
      { x: 0.08, y: 0.88 },
      { x: 0.90, y: 0.85 },
      /* Edges — top/bottom */
      { x: 0.35, y: 0.04 },
      { x: 0.65, y: 0.06 },
      { x: 0.30, y: 0.94 },
      { x: 0.70, y: 0.92 },
      /* Edges — left/right */
      { x: 0.02, y: 0.45 },
      { x: 0.97, y: 0.50 },
      /* Mid ring */
      { x: 0.22, y: 0.30 },
      { x: 0.78, y: 0.28 },
      { x: 0.20, y: 0.65 },
      { x: 0.80, y: 0.68 },
      /* Inner scattered */
      { x: 0.50, y: 0.18 },
      { x: 0.42, y: 0.78 },
    ];

    var presetSizes = [
      0.22, 0.16, 0.18, 0.14, 0.12, 0.15, 0.13, 0.10,
      0.19, 0.14, 0.13, 0.11, 0.16, 0.10, 0.09, 0.12
    ];

    function generateShapes() {
      shapes = [];
      var count = Math.min(shapeCount, presetPositions.length);
      for (var i = 0; i < count; i++) {
        var jitterX = (Math.random() - 0.5) * 0.06;
        var jitterY = (Math.random() - 0.5) * 0.06;
        shapes.push({
          x: Math.max(0.02, Math.min(0.98, presetPositions[i].x + jitterX)),
          y: Math.max(0.02, Math.min(0.98, presetPositions[i].y + jitterY)),
          size: presetSizes[i] || (0.06 + Math.random() * 0.1),
          speedX: (0.3 + Math.random() * 0.8) * (Math.random() > 0.5 ? 1 : -1),
          speedY: (0.4 + Math.random() * 1.0) * (Math.random() > 0.5 ? 1 : -1),
          speedZ: (0.1 + Math.random() * 0.5) * (Math.random() > 0.5 ? 1 : -1),
          offsetX: Math.random() * Math.PI * 2,
          offsetY: Math.random() * Math.PI * 2,
          offsetZ: Math.random() * Math.PI * 2,
          opacityMult: 0.4 + Math.random() * 0.5
        });
      }
    }

    generateShapes();

    /* --- 3D rotation helpers --- */
    function rotateX(v, angle) {
      var cos = Math.cos(angle), sin = Math.sin(angle);
      return [v[0], v[1] * cos - v[2] * sin, v[1] * sin + v[2] * cos];
    }

    function rotateY(v, angle) {
      var cos = Math.cos(angle), sin = Math.sin(angle);
      return [v[0] * cos + v[2] * sin, v[1], -v[0] * sin + v[2] * cos];
    }

    function rotateZ(v, angle) {
      var cos = Math.cos(angle), sin = Math.sin(angle);
      return [v[0] * cos - v[1] * sin, v[0] * sin + v[1] * cos, v[2]];
    }

    function project(v, cx, cy, radius) {
      var perspective = 3;
      var z = v[2] + perspective;
      var factor = perspective / z;
      return {
        x: cx + v[0] * radius * factor,
        y: cy + v[1] * radius * factor,
        z: v[2],
        scale: factor
      };
    }

    /* --- Parse hex/named color to RGB --- */
    function parseColor(color) {
      var temp = document.createElement('div');
      temp.style.color = color;
      document.body.appendChild(temp);
      var computed = getComputedStyle(temp).color;
      document.body.removeChild(temp);
      var match = computed.match(/(\d+)/g);
      if (match) return { r: match[0], g: match[1], b: match[2] };
      return { r: 93, g: 138, b: 168 };
    }

    var rgb = parseColor(accentColor);

    /* --- Draw a single wireframe shape --- */
    function drawShape(shape, time, w, h) {
      var cx = shape.x * w;
      var cy = shape.y * h;
      var radius = Math.min(w, h) * shape.size;
      var shapeOpacity = maxOpacity * shape.opacityMult;

      var rx = time * shape.speedX * 0.003 * speedMult + shape.offsetX + mouseY * 0.15;
      var ry = time * shape.speedY * 0.003 * speedMult + shape.offsetY + mouseX * 0.15;
      var rz = time * shape.speedZ * 0.003 * speedMult + shape.offsetZ;

      var projected = baseVertices.map(function (v) {
        var r = rotateX(v, rx);
        r = rotateY(r, ry);
        r = rotateZ(r, rz);
        return project(r, cx, cy, radius);
      });

      /* Draw edges */
      edges.forEach(function (edge) {
        var a = projected[edge[0]];
        var b = projected[edge[1]];

        var avgZ = (a.z + b.z) / 2;
        var depthFactor = (avgZ + 1.5) / 3;
        depthFactor = Math.max(0.15, Math.min(1, depthFactor));
        var opacity = shapeOpacity * depthFactor;

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + opacity + ')';
        ctx.lineWidth = Math.max(0.5, 0.8 * a.scale * (shape.size / 0.12));
        ctx.stroke();
      });

      /* Draw vertex dots */
      projected.forEach(function (p) {
        var depthFactor = (p.z + 1.5) / 3;
        depthFactor = Math.max(0.2, Math.min(1, depthFactor));
        var opacity = shapeOpacity * depthFactor * 1.3;
        var dotSize = Math.max(1, 1.5 * p.scale * (shape.size / 0.12));

        ctx.beginPath();
        ctx.arc(p.x, p.y, dotSize, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + opacity + ')';
        ctx.fill();
      });
    }

    /* --- Animation loop --- */
    var time = 0;

    function draw() {
      var w = canvas.width;
      var h = canvas.height;

      ctx.clearRect(0, 0, w, h);
      time += 1;

      shapes.forEach(function (shape) {
        drawShape(shape, time, w, h);
      });

      animId = requestAnimationFrame(draw);
    }

    /* --- Public interface --- */
    return {
      start: function () {
        if (!animId) draw();
      },
      stop: function () {
        if (animId) {
          cancelAnimationFrame(animId);
          animId = null;
        }
      },
      resize: function () {
        var newColor = getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim();
        if (newColor) {
          rgb = parseColor(newColor);
        }
      }
    };
  }

  AnimationFactory.register('geometricWireframe', geometricWireframe);

})();
