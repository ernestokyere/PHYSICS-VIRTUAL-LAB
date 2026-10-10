
/* =========================================================
   PHYSICSLAB
   APPLICATION CONTROLLER
   Stage 3 — Navigation, Laboratories and Interactivity
   ========================================================= */

(function () {
  "use strict";

  /* =======================================================
     1. APPLICATION CONFIGURATION
     ======================================================= */

  const LABS = {
    mechanics: {
      title: "Mechanics Laboratory",
      eyebrow: "01 / MOTION AND FORCES",
      description:
        "Investigate Newton's second law and the relationship between force, mass and acceleration.",
      intro:
        "Change the mass and applied net force to calculate acceleration using F = ma.",
      params: [
        {
          id: "mass",
          label: "Object mass",
          min: 1,
          max: 50,
          step: 1,
          value: 5,
          unit: "kg"
        },
        {
          id: "force",
          label: "Net force",
          min: 1,
          max: 100,
          step: 1,
          value: 20,
          unit: "N"
        }
      ]
    },

    electricity: {
      title: "Electricity Laboratory",
      eyebrow: "02 / ELECTRIC CIRCUITS",
      description:
        "Explore the relationship between voltage, current and resistance using Ohm's law.",
      intro:
        "Adjust voltage and resistance to calculate current using I = V/R.",
      params: [
        {
          id: "voltage",
          label: "Voltage",
          min: 1,
          max: 24,
          step: 1,
          value: 12,
          unit: "V"
        },
        {
          id: "resistance",
          label: "Resistance",
          min: 1,
          max: 100,
          step: 1,
          value: 6,
          unit: "Ω"
        }
      ]
    },

    optics: {
      title: "Optics Laboratory",
      eyebrow: "03 / LIGHT AND LENSES",
      description:
        "Investigate image formation by a thin converging lens.",
      intro:
        "Set the focal length and object distance. For an object beyond the focal point, calculate image distance using 1/f = 1/u + 1/v.",
      params: [
        {
          id: "focalLength",
          label: "Focal length",
          min: 5,
          max: 30,
          step: 1,
          value: 10,
          unit: "cm"
        },
        {
          id: "objectDistance",
          label: "Object distance",
          min: 6,
          max: 100,
          step: 1,
          value: 30,
          unit: "cm"
        }
      ]
    },

    waves: {
      title: "Waves Laboratory",
      eyebrow: "04 / WAVES AND OSCILLATIONS",
      description:
        "Explore how frequency and wavelength determine wave speed.",
      intro:
        "Change frequency and wavelength to calculate wave speed using v = fλ.",
      params: [
        {
          id: "frequency",
          label: "Frequency",
          min: 1,
          max: 100,
          step: 1,
          value: 10,
          unit: "Hz"
        },
        {
          id: "wavelength",
          label: "Wavelength",
          min: 1,
          max: 20,
          step: 0.5,
          value: 2,
          unit: "m"
        }
      ]
    },

    thermal: {
      title: "Thermal Physics Laboratory",
      eyebrow: "05 / HEAT AND ENERGY",
      description:
        "Calculate the heat energy required to change the temperature of a substance.",
      intro:
        "Adjust mass, specific heat capacity and temperature change using Q = mcΔT. This model assumes no phase change.",
      params: [
        {
          id: "thermalMass",
          label: "Mass",
          min: 0.1,
          max: 10,
          step: 0.1,
          value: 1,
          unit: "kg"
        },
        {
          id: "specificHeat",
          label: "Specific heat capacity",
          min: 100,
          max: 5000,
          step: 100,
          value: 4200,
          unit: "J/(kg·°C)"
        },
        {
          id: "temperatureChange",
          label: "Temperature change",
          min: 1,
          max: 100,
          step: 1,
          value: 10,
          unit: "°C"
        }
      ]
    }
  };

  const VIEW_TITLES = {
    dashboard: "Dashboard",
    laboratories: "Laboratories",
    experiments: "Experiments",
    analysis: "Data Analysis",
    notebook: "Lab Notebook",
    concepts: "Physics Concepts",
    assessments: "Assessments",
    premium: "Premium",
    settings: "Settings",
    "lab-detail": "Laboratory Workspace"
  };

  const state = {
    currentView: "dashboard",
    currentLab: null,
    experimentsStarted: 0,
    completedActivities: new Set(),
    toastTimeout: null
  };

  /* =======================================================
     2. DOM HELPERS
     ======================================================= */

  const $ = (selector, parent = document) =>
    parent.querySelector(selector);

  const $$ = (selector, parent = document) =>
    Array.from(parent.querySelectorAll(selector));

  const getViewElement = (name) =>
    document.getElementById("view-" + name);

  function formatNumber(value, digits = 2) {
    if (!Number.isFinite(value)) {
      return "Not defined";
    }

    return Number(value.toFixed(digits)).toLocaleString(
      undefined,
      {
        maximumFractionDigits: digits
      }
    );
  }

  function safeRead(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch (error) {
      return fallback;
    }
  }

  function safeWrite(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      return false;
    }
  }

  function safeRemove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      return false;
    }
  }

  /* =======================================================
     3. NOTIFICATIONS
     ======================================================= */

  function showToast(message) {
    const toast = $("#toast");

    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    if (state.toastTimeout) {
      clearTimeout(state.toastTimeout);
    }

    state.toastTimeout = setTimeout(() => {
      toast.classList.remove("show");
    }, 2600);
  }

  /* =======================================================
     4. NAVIGATION
     ======================================================= */

  function navigate(viewName) {
    const validViews = Object.keys(VIEW_TITLES);

    if (!validViews.includes(viewName)) {
      showToast("That page is not available.");
      return;
    }

    if (viewName === "lab-detail" && !state.currentLab) {
      viewName = "laboratories";
    }

    let visibleView = viewName;

    if (viewName === "lab-detail") {
      visibleView = "lab-detail";
    }

    $$(".page-view").forEach((view) => {
      view.hidden = view.id !== "view-" + visibleView;
    });

    state.currentView = viewName;

    const title = $("#pageTitle");

    if (title) {
      title.textContent =
        VIEW_TITLES[viewName] || "PhysicsLab";
    }

    $$(".nav-item[data-view]").forEach((button) => {
      const isActive = button.dataset.view === viewName;

      button.classList.toggle("active", isActive);

      if (isActive) {
        button.setAttribute("aria-current", "page");
      } else {
        button.removeAttribute("aria-current");
      }
    });

    closeMobileMenu();

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  /* =======================================================
     5. MOBILE MENU
     ======================================================= */

  function openMobileMenu() {
    document.body.classList.add("sidebar-open");

    const button = $("#mobileMenu");

    if (button) {
      button.setAttribute("aria-expanded", "true");
      button.setAttribute("aria-label", "Close navigation menu");
    }
  }

  function closeMobileMenu() {
    document.body.classList.remove("sidebar-open");

    const button = $("#mobileMenu");

    if (button) {
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-label", "Open navigation menu");
    }
  }

  function toggleMobileMenu() {
    if (document.body.classList.contains("sidebar-open")) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  }

  /* =======================================================
     6. DARK AND LIGHT THEME
     ======================================================= */

  function applyTheme(theme) {
    const light = theme === "light";

    document.body.classList.toggle("light-theme", light);

    const button = $("#themeToggle");

    if (button) {
      button.textContent = light ? "☾" : "☼";

      button.setAttribute(
        "aria-label",
        light ? "Switch to dark theme" : "Switch to light theme"
      );
    }

    safeWrite("physicsLabTheme", light ? "light" : "dark");
  }

  function toggleTheme() {
    const isLight =
      document.body.classList.contains("light-theme");

    applyTheme(isLight ? "dark" : "light");
  }

  /* =======================================================
     7. BUILD LABORATORY CARDS
     ======================================================= */

  function createLabCard(key) {
    const lab = LABS[key];

    const symbols = {
      mechanics: "↗",
      electricity: "ϟ",
      optics: "◉",
      waves: "〰",
      thermal: "♨"
    };

    const classes = {
      mechanics: "mechanics-card",
      electricity: "electricity-card",
      optics: "optics-card",
      waves: "waves-card",
      thermal: "thermal-card"
    };

    const descriptions = {
      mechanics: "Motion, forces, energy and momentum.",
      electricity: "Voltage, current, resistance and circuits.",
      optics: "Reflection, refraction, lenses and images.",
      waves: "Frequency, wavelength, sound and wave motion.",
      thermal: "Temperature, heat transfer and energy."
    };

    const button = document.createElement("button");

    button.type = "button";
    button.className = "lab-card " + classes[key];
    button.dataset.lab = key;

    const symbol = document.createElement("span");
    symbol.className = "lab-symbol";
    symbol.textContent = symbols[key];

    const tag = document.createElement("span");
    tag.className = "lab-tag";
    tag.textContent = lab.eyebrow;

    const title = document.createElement("h3");
    title.textContent = lab.title.replace(" Laboratory", "");

    const description = document.createElement("p");
    description.textContent = descriptions[key];

    const link = document.createElement("span");
    link.className = "card-link";
    link.textContent = "Enter laboratory →";

    button.append(symbol, tag, title, description, link);

    return button;
  }

  function populateLaboratories() {
    const container = $("#allLaboratories");

    if (!container) return;

    container.replaceChildren();

    Object.keys(LABS).forEach((key) => {
      container.appendChild(createLabCard(key));
    });
  }

  /* =======================================================
     8. LABORATORY WORKSPACE
     ======================================================= */

  function openLab(key) {
    const lab = LABS[key];

    if (!lab) {
      showToast("Laboratory not found.");
      return;
    }

    state.currentLab = key;

    if (!state.completedActivities.has(key)) {
      state.completedActivities.add(key);
      state.experimentsStarted += 1;
      updateDashboardStats();
    }

    const eyebrow = $("#detailEyebrow");
    const title = $("#detailTitle");
    const description = $("#detailDescription");
    const longDescription = $("#detailLong");
    const workspace = $("#physicsLabWorkspace");

    if (!workspace) {
      showToast("Laboratory workspace could not be loaded.");
      return;
    }

    if (eyebrow) eyebrow.textContent = lab.eyebrow;
    if (title) title.textContent = lab.title;
    if (description) description.textContent = lab.description;
    if (longDescription) {
      longDescription.textContent =
        "This is an educational mathematical model. Compare its predictions with real measurements when performing a physical experiment.";
    }

    workspace.replaceChildren();

    const intro = document.createElement("p");
    intro.textContent = lab.intro;

    const controls = document.createElement("div");
    controls.className = "lab-controls";

    lab.params.forEach((param) => {
      const wrapper = document.createElement("label");
      wrapper.className = "lab-parameter";

      const titleLine = document.createElement("span");
      titleLine.className = "parameter-title";
      titleLine.textContent = param.label + ": ";

      const output = document.createElement("strong");
      output.id = "output-" + param.id;
      output.textContent =
        formatNumber(param.value) + " " + param.unit;

      titleLine.appendChild(output);

      const range = document.createElement("input");
      range.type = "range";
      range.min = String(param.min);
      range.max = String(param.max);
      range.step = String(param.step);
      range.value = String(param.value);
      range.dataset.param = param.id;
      range.setAttribute(
        "aria-label",
        param.label
      );

      wrapper.append(titleLine, range);
      controls.appendChild(wrapper);
    });

    const resultArea = document.createElement("div");
    resultArea.className = "simulation-result";
    resultArea.id = "simulationResults";

    const visual = document.createElement("div");
    visual.className = "simulation-visual";
    visual.id = "simulationVisual";
    visual.setAttribute("aria-label", "Illustration of the current physics model");
    visual.setAttribute("role", "img");

    const actions = document.createElement("div");
    actions.className = "simulation-actions";

    const resetButton = document.createElement("button");
    resetButton.type = "button";
    resetButton.className = "secondary-button";
    resetButton.dataset.simulationReset = "true";
    resetButton.textContent = "Reset values";

    const notebookButton = document.createElement("button");
    notebookButton.type = "button";
    notebookButton.className = "primary-button";
    notebookButton.dataset.recordLab = key;
    notebookButton.textContent = "Record in notebook";

    actions.append(resetButton, notebookButton);

    workspace.append(intro, controls, resultArea, visual, actions);

    navigate("lab-detail");
    updateSimulation();
  }

  /* =======================================================
     9. READ SIMULATION VALUES
     ======================================================= */

  function getSimulationValues() {
    const key = state.currentLab;
    const lab = LABS[key];

    if (!lab) return null;

    const values = {};

    lab.params.forEach((param) => {
      const input = $(
        '[data-param="' + param.id + '"]',
        $("#physicsLabWorkspace")
      );

      values[param.id] = input
        ? Number(input.value)
        : param.value;
    });

    return values;
  }

  /* =======================================================
     10. PHYSICS CALCULATIONS
     ======================================================= */

  function calculateSimulation(key, v) {
    switch (key) {
      case "mechanics": {
        const acceleration = v.force / v.mass;

        return {
          results: [
            ["Acceleration", formatNumber(acceleration) + " m/s²"],
            ["Net force", formatNumber(v.force) + " N"],
            ["Mass", formatNumber(v.mass) + " kg"],
            ["Kinetic energy at 1 m/s", formatNumber(0.5 * v.mass) + " J"]
          ],
          summary:
            "Acceleration = force ÷ mass = " +
            formatNumber(acceleration) +
            " m/s²."
        };
      }

      case "electricity": {
        const current = v.voltage / v.resistance;
        const power = v.voltage * current;

        return {
          results: [
            ["Current", formatNumber(current) + " A"],
            ["Voltage", formatNumber(v.voltage) + " V"],
            ["Resistance", formatNumber(v.resistance) + " Ω"],
            ["Electrical power", formatNumber(power) + " W"]
          ],
          summary:
            "Current = voltage ÷ resistance = " +
            formatNumber(current) +
            " A. Assumes an ohmic resistor."
        };
      }

      case "optics": {
        const f = v.focalLength;
        const u = v.objectDistance;

        if (Math.abs(u - f) < 0.000001) {
          return {
            results: [
              ["Image distance", "At infinity (ideal model)"],
              ["Focal length", formatNumber(f) + " cm"],
              ["Object distance", formatNumber(u) + " cm"],
              ["Magnification", "Not finite"]
            ],
            summary:
              "The object is at the focal point of the ideal thin lens. The emerging rays are parallel."
          };
        }

        const imageDistance = (f * u) / (u - f);
        const magnification = -imageDistance / u;

        return {
          results: [
            ["Image distance", formatNumber(imageDistance) + " cm"],
            ["Focal length", formatNumber(f) + " cm"],
            ["Object distance", formatNumber(u) + " cm"],
            ["Magnification", formatNumber(magnification)]
          ],
          summary:
            u > f
              ? "The ideal converging lens forms a real, inverted image."
              : "The ideal converging lens forms a virtual, upright image."
        };
      }

      case "waves": {
        const speed = v.frequency * v.wavelength;
        const period = 1 / v.frequency;

        return {
          results: [
            ["Wave speed", formatNumber(speed) + " m/s"],
            ["Frequency", formatNumber(v.frequency) + " Hz"],
            ["Wavelength", formatNumber(v.wavelength) + " m"],
            ["Period", formatNumber(period) + " s"]
          ],
          summary:
            "Wave speed = frequency × wavelength = " +
            formatNumber(speed) +
            " m/s."
        };
      }

      case "thermal": {
        const energy =
          v.thermalMass *
          v.specificHeat *
          v.temperatureChange;

        return {
          results: [
            ["Heat energy", formatNumber(energy) + " J"],
            ["Mass", formatNumber(v.thermalMass) + " kg"],
            ["Specific heat capacity", formatNumber(v.specificHeat) + " J/(kg·°C)"],
            ["Temperature change", formatNumber(v.temperatureChange) + " °C"]
          ],
          summary:
            "Heat energy = mass × specific heat capacity × temperature change = " +
            formatNumber(energy) +
            " J. Assumes no phase change and no heat loss."
        };
      }

      default:
        return {
          results: [],
          summary: "Choose a laboratory to begin."
        };
    }
  }

  /* =======================================================
     11. RENDER SIMULATION RESULTS
     ======================================================= */

  function updateSimulation() {
    const key = state.currentLab;
    const values = getSimulationValues();

    if (!key || !values) return;

    const lab = LABS[key];

    lab.params.forEach((param) => {
      const output = $("#output-" + param.id);

      if (output) {
        output.textContent =
          formatNumber(values[param.id]) +
          " " +
          param.unit;
      }
    });

    const calculated = calculateSimulation(key, values);
    const results = $("#simulationResults");
    const visual = $("#simulationVisual");

    if (results) {
      results.replaceChildren();

      calculated.results.forEach(([label, value]) => {
        const card = document.createElement("div");

        const caption = document.createElement("span");
        caption.textContent = label;

        const result = document.createElement("strong");
        result.textContent = value;

        card.append(caption, result);
        results.appendChild(card);
      });

      const summary = document.createElement("p");
      summary.textContent = calculated.summary;
      summary.style.gridColumn = "1 / -1";
      results.appendChild(summary);
    }

    if (visual) {
      renderSimulationVisual(visual, key, values);
    }
  }

  /* =======================================================
     12. SIMPLE VISUAL MODEL
     ======================================================= */

  function renderSimulationVisual(container, key, values) {
    const width = 640;
    const height = 180;

    const svgNS = "http://www.w3.org/2000/svg";

    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", String(height));
    svg.setAttribute("role", "img");

    const description = document.createElementNS(svgNS, "title");
    description.textContent = "Illustrative " + LABS[key].title;
    svg.appendChild(description);

    const addShape = (tag, attrs, textContent) => {
      const element = document.createElementNS(svgNS, tag);

      Object.entries(attrs).forEach(([name, value]) => {
        element.setAttribute(name, String(value));
      });

      if (textContent !== undefined) {
        element.textContent = textContent;
      }

      svg.appendChild(element);
      return element;
    };

    const stroke = "#6685ff";
    const cyan = "#55d9ed";
    const muted = "#96a6bd";

    if (key === "mechanics") {
      addShape("line", {
        x1: 45, y1: 130, x2: 595, y2: 130,
        stroke: muted, "stroke-width": 2
      });

      const x = 75 + Math.min(values.force, 100) * 4.3;

      addShape("rect", {
        x: x, y: 87, width: 58, height: 43,
        rx: 8, fill: stroke
      });

      addShape("line", {
        x1: x + 65, y1: 108, x2: x + 130, y2: 108,
        stroke: cyan, "stroke-width": 4,
        "stroke-linecap": "round"
      });

      addShape("path", {
        d: `M ${x + 118} 97 L ${x + 132} 108 L ${x + 118} 119`,
        fill: "none", stroke: cyan, "stroke-width": 4
      });

      addShape("text", {
        x: 45, y: 40, fill: muted, "font-size": 16
      }, "Net force: " + formatNumber(values.force) + " N");
    }

    if (key === "electricity") {
      addShape("rect", {
        x: 55, y: 45, width: 530, height: 100,
        rx: 12, fill: "none", stroke: muted, "stroke-width": 2
      });

      addShape("rect", {
        x: 105, y: 77, width: 65, height: 36,
        rx: 4, fill: stroke
      });

      addShape("text", {
        x: 137, y: 100, fill: "#ffffff",
        "font-size": 15, "text-anchor": "middle"
      }, "V");

      addShape("rect", {
        x: 350, y: 77, width: 75, height: 36,
        rx: 4, fill: cyan
      });

      addShape("text", {
        x: 387, y: 100, fill: "#0b1120",
        "font-size": 15, "text-anchor": "middle"
      }, "R");

      addShape("text", {
        x: 240, y: 35, fill: muted,
        "font-size": 15, "text-anchor": "middle"
      }, "Simple circuit model");
    }

    if (key === "optics") {
      const axisY = 95;
      const lensX = 320;

      addShape("line", {
        x1: 45, y1: axisY, x2: 595, y2: axisY,
        stroke: muted, "stroke-width": 1.5
      });

      addShape("path", {
        d: `M ${lensX} 35 Q ${lensX - 32} ${axisY} ${lensX} 155 Q ${lensX + 32} ${axisY} ${lensX} 35`,
        fill: "none", stroke: cyan, "stroke-width": 3
      });

      const objectX = Math.max(70, lensX - values.objectDistance * 5);
      const imageX = Math.min(
        575,
        lensX + Math.abs(
          (values.focalLength * values.objectDistance) /
          (values.objectDistance - values.focalLength)
        ) * 2.3
      );

      addShape("line", {
        x1: objectX, y1: axisY, x2: objectX, y2: 45,
        stroke: stroke, "stroke-width": 4
      });

      addShape("path", {
        d: `M ${objectX - 8} 55 L ${objectX} 43 L ${objectX + 8} 55`,
        fill: "none", stroke: stroke, "stroke-width": 3
      });

      addShape("line", {
        x1: imageX, y1: axisY, x2: imageX, y2: 140,
        stroke: "#ffbd75", "stroke-width": 4
      });

      addShape("text", {
        x: lensX, y: 22, fill: muted,
        "font-size": 13, "text-anchor": "middle"
      }, "Lens");
    }

    if (key === "waves") {
      let path = "";

      for (let x = 35; x <= 605; x += 3) {
        const y =
          90 -
          37 * Math.sin(
            ((x - 35) / 570) *
            Math.min(values.frequency, 40) *
            Math.PI / 2
          );

        path += (x === 35 ? "M " : " L ") + x + " " + y;
      }

      addShape("path", {
        d: path,
        fill: "none",
        stroke: cyan,
        "stroke-width": 3
      });

      addShape("line", {
        x1: 35, y1: 90, x2: 605, y2: 90,
        stroke: muted, "stroke-width": 1,
        "stroke-dasharray": "5 5"
      });
    }

    if (key === "thermal") {
      addShape("rect", {
        x: 245, y: 38, width: 150, height: 105,
        rx: 12, fill: "none", stroke: muted, "stroke-width": 2
      });

      const temperatureFraction =
        Math.min(values.temperatureChange / 100, 1);

      addShape("rect", {
        x: 256,
        y: 49 + (1 - temperatureFraction) * 70,
        width: 128,
        height: 83 - (1 - temperatureFraction) * 70,
        rx: 6,
        fill: "#ffbd75",
        opacity: 0.9
      });

      addShape("text", {
        x: 320, y: 25, fill: muted,
        "font-size": 14, "text-anchor": "middle"
      }, "Heating model");

      addShape("path", {
        d: "M 275 32 Q 265 22 275 12 M 320 32 Q 310 22 320 12 M 365 32 Q 355 22 365 12",
        fill: "none", stroke: "#ffbd75", "stroke-width": 3
      });
    }

    container.replaceChildren(svg);
  }

  /* =======================================================
     13. RESET LABORATORY
     ======================================================= */

  function resetSimulation() {
    const key = state.currentLab;
    const lab = LABS[key];

    if (!lab) return;

    lab.params.forEach((param) => {
      const input = $(
        '[data-param="' + param.id + '"]',
        $("#physicsLabWorkspace")
      );

      if (input) {
        input.value = String(param.value);
      }
    });

    updateSimulation();
    showToast("Experiment values reset.");
  }

  /* =======================================================
     14. DASHBOARD STATISTICS
     ======================================================= */

  function updateDashboardStats() {
    const experimentCount = $("#experimentCount");
    const progressValue = $("#progressValue");

    if (experimentCount) {
      experimentCount.textContent =
        String(state.experimentsStarted).padStart(2, "0");
    }

    if (progressValue) {
      const progress = Math.round(
        (state.completedActivities.size / Object.keys(LABS).length) * 100
      );

      progressValue.textContent = progress + "%";
    }
  }

  /* =======================================================
     15. DATA ANALYSIS CALCULATOR
     ======================================================= */

  function calculateAnalysis() {
    const aInput = $("#analysisA");
    const bInput = $("#analysisB");
    const output = $("#analysisResult");

    if (!aInput || !bInput || !output) return;

    const a = Number(aInput.value);
    const b = Number(bInput.value);

    if (
      aInput.value.trim() === "" ||
      bInput.value.trim() === "" ||
      !Number.isFinite(a) ||
      !Number.isFinite(b)
    ) {
      output.textContent = "Enter valid numbers";
      return;
    }

    if (b === 0) {
      output.textContent = "Cannot divide by zero";
      return;
    }

    output.textContent = formatNumber(a / b, 6);
  }

  /* =======================================================
     16. LAB NOTEBOOK
     ======================================================= */

  const NOTEBOOK_KEY = "physicsLabNotebook";

  function readNotes() {
    try {
      const raw = safeRead(NOTEBOOK_KEY, "[]");
      const parsed = JSON.parse(raw);

      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function renderNotes() {
    const container = $("#savedNotes");

    if (!container) return;

    container.replaceChildren();

    const notes = readNotes();

    if (notes.length === 0) {
      const empty = document.createElement("p");
      empty.className = "muted small";
      empty.textContent = "No saved notes yet.";
      container.appendChild(empty);
      return;
    }

    notes.forEach((note) => {
      const article = document.createElement("article");
      article.className = "saved-note";

      const title = document.createElement("h3");
      title.textContent = note.title || "Untitled experiment";

      const content = document.createElement("p");
      content.textContent = note.content || "";

      const date = document.createElement("small");
      date.textContent = note.date || "";

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "secondary-button";
      removeButton.textContent = "Delete note";
      removeButton.dataset.deleteNote = String(note.id);

      article.append(title, content, date, removeButton);
      container.appendChild(article);
    });
  }

  function saveNotebookNote(title, content) {
    const notes = readNotes();

    const note = {
      id: Date.now(),
      title: title.trim() || "Untitled experiment",
      content: content.trim(),
      date: new Date().toLocaleString()
    };

    notes.unshift(note);

    if (!safeWrite(NOTEBOOK_KEY, JSON.stringify(notes))) {
      showToast("Could not save. Browser storage may be unavailable.");
      return false;
    }

    return true;
  }

  function saveNoteFromForm() {
    const titleInput = $("#noteTitle");
    const contentInput = $("#noteContent");
    const status = $("#noteStatus");

    if (!titleInput || !contentInput) return;

    if (!contentInput.value.trim()) {
      showToast("Enter your observations before saving.");
      contentInput.focus();
      return;
    }

    const saved = saveNotebookNote(
      titleInput.value,
      contentInput.value
    );

    if (!saved) return;

    titleInput.value = "";
    contentInput.value = "";

    if (status) {
      status.textContent = "Your note has been saved in this browser.";
    }

    renderNotes();
    showToast("Notebook entry saved.");
  }

  function recordLabInNotebook(key) {
    const lab = LABS[key];
    const values = getSimulationValues();

    if (!lab || !values) return;

    const calculated = calculateSimulation(key, values);

    const details = [
      lab.description,
      "",
      "Recorded parameters:",
      ...lab.params.map((param) =>
        param.label + ": " +
        formatNumber(values[param.id]) + " " + param.unit
      ),
      "",
      "Results:",
      ...calculated.results.map(([label, value]) =>
        label + ": " + value
      ),
      "",
      calculated.summary
    ].join("\n");

    if (!saveNotebookNote(lab.title, details)) return;

    renderNotes();
    navigate("notebook");
    showToast("Experiment recorded in your notebook.");
  }

  function deleteNotebookNote(id) {
    const notes = readNotes().filter(
      (note) => String(note.id) !== String(id)
    );

    if (!safeWrite(NOTEBOOK_KEY, JSON.stringify(notes))) {
      showToast("Could not update notebook storage.");
      return;
    }

    renderNotes();
    showToast("Notebook entry deleted.");
  }

  function clearNotebook() {
    const confirmed = window.confirm(
      "Delete all saved PhysicsLab notebook entries from this browser?"
    );

    if (!confirmed) return;

    if (!safeRemove(NOTEBOOK_KEY)) {
      showToast("Could not clear notebook storage.");
      return;
    }

    renderNotes();
    showToast("Saved notebook entries cleared.");
  }

  /* =======================================================
     17. SAMPLE ASSESSMENT
     ======================================================= */

  function handleQuizAnswer(button) {
    const feedback = $("#quizFeedback");

    if (!feedback) return;

    const buttons = $$(".quiz-options button");

    buttons.forEach((item) => {
      item.disabled = true;
    });

    if (button.dataset.answer === "correct") {
      feedback.textContent =
        "Correct! Using F = ma, acceleration = 12 ÷ 3 = 4 m/s².";

      feedback.style.color = "var(--green)";

      state.completedActivities.add("sample-quiz");
    } else {
      feedback.textContent =
        "Not quite. Use a = F ÷ m, so 12 N ÷ 3 kg = 4 m/s².";

      feedback.style.color = "var(--danger)";
    }

    updateDashboardStats();

    const retry = document.createElement("button");
    retry.type = "button";
    retry.className = "secondary-button";
    retry.textContent = "Try again";
    retry.dataset.quizRetry = "true";

    feedback.appendChild(document.createElement("br"));
    feedback.appendChild(retry);
  }

  function resetQuiz() {
    const feedback = $("#quizFeedback");

    if (feedback) {
      feedback.replaceChildren();
    }

    $$(".quiz-options button").forEach((button) => {
      button.disabled = false;
    });
  }

  /* =======================================================
     18. SEARCH
     ======================================================= */

  function handleSearch() {
    const input = $("#globalSearch");

    if (!input) return;

    const query = input.value.trim().toLowerCase();

    if (!query) {
      if (state.currentView === "laboratories") {
        populateLaboratories();
      }

      return;
    }

    navigate("laboratories");

    const container = $("#allLaboratories");

    if (!container) return;

    $$(".lab-card", container).forEach((card) => {
      const key = card.dataset.lab;
      const lab = LABS[key];

      const searchableText = [
        lab.title,
        lab.eyebrow,
        lab.description,
        lab.intro
      ].join(" ").toLowerCase();

      card.hidden = !searchableText.includes(query);
    });

    const anyVisible = $$(".lab-card", container).some(
      (card) => !card.hidden
    );

    if (!anyVisible) {
      const message = document.createElement("p");
      message.className = "muted search-empty";
      message.textContent =
        "No matching laboratory found. Try mechanics, electricity, optics, waves or thermal physics.";

      container.appendChild(message);
    } else {
      $$(".search-empty", container).forEach((item) => item.remove());
    }
  }

  /* =======================================================
     19. GLOBAL CLICK HANDLER
     ======================================================= */

  document.addEventListener("click", (event) => {
    const target = event.target;

    if (!(target instanceof Element)) return;

    const viewButton = target.closest("[data-view]");

    if (viewButton) {
      navigate(viewButton.dataset.view);
      return;
    }

    const goButton = target.closest("[data-go]");

    if (goButton) {
      navigate(goButton.dataset.go);
      return;
    }

    const labButton = target.closest("[data-lab]");

    if (labButton) {
      openLab(labButton.dataset.lab);
      return;
    }

    if (target.closest("#mobileMenu")) {
      toggleMobileMenu();
      return;
    }

    if (target.closest("#themeToggle") ||
        target.closest("#settingsThemeToggle")) {
      toggleTheme();
      return;
    }

    if (target.closest("#calculateAnalysis")) {
      calculateAnalysis();
      return;
    }

    if (target.closest("#saveNote")) {
      saveNoteFromForm();
      return;
    }

    if (target.closest("#clearLocalData")) {
      clearNotebook();
      return;
    }

    const resetButton = target.closest("[data-simulation-reset]");

    if (resetButton) {
      resetSimulation();
      return;
    }

    const recordButton = target.closest("[data-record-lab]");

    if (recordButton) {
      recordLabInNotebook(recordButton.dataset.recordLab);
      return;
    }

    const deleteButton = target.closest("[data-delete-note]");

    if (deleteButton) {
      deleteNotebookNote(deleteButton.dataset.deleteNote);
      return;
    }

    const quizButton = target.closest("[data-answer]");

    if (quizButton) {
      handleQuizAnswer(quizButton);
      return;
    }

    if (target.closest("[data-quiz-retry]")) {
      resetQuiz();
      return;
    }

    if (
      document.body.classList.contains("sidebar-open") &&
      !target.closest("#sidebar")
    ) {
      closeMobileMenu();
    }
  });

  /* =======================================================
     20. GLOBAL INPUT HANDLER
     ======================================================= */

  document.addEventListener("input", (event) => {
    const target = event.target;

    if (!(target instanceof HTMLInputElement)) return;

    if (target.dataset.param) {
      updateSimulation();
      return;
    }

    if (target.id === "globalSearch") {
      handleSearch();
      return;
    }

    if (
      target.id === "analysisA" ||
      target.id === "analysisB"
    ) {
      calculateAnalysis();
    }
  });

  /* =======================================================
     21. KEYBOARD SUPPORT
     ======================================================= */

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMobileMenu();
    }
  });

  /* =======================================================
     22. INITIALISE APPLICATION
     ======================================================= */

  function initialise() {
    populateLaboratories();

    const savedTheme = safeRead("physicsLabTheme", "dark");
    applyTheme(savedTheme);

    renderNotes();
    updateDashboardStats();
    calculateAnalysis();

    $$(".page-view").forEach((view) => {
      view.hidden = view.id !== "view-dashboard";
    });

    const pageTitle = $("#pageTitle");

    if (pageTitle) {
      pageTitle.textContent = "Dashboard";
    }

    $$(".nav-item[data-view]").forEach((button) => {
      button.classList.toggle(
        "active",
        button.dataset.view === "dashboard"
      );
    });

    console.info("PhysicsLab application initialised.");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialise);
  } else {
    initialise();
  }
})();
