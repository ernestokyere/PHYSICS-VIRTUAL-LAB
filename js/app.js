
/* =========================================================
   PHYSICSLAB
   APPLICATION CONTROLLER
   Stage 3 — Navigation and Interactive Lab Foundation
   File: js/app.js
   ========================================================= */

(function () {
    "use strict";

    /* =====================================================
       1. APPLICATION CONFIGURATION
       ===================================================== */

    const APP = {
        name: "PhysicsLab",
        version: "1.0.0",
        initialized: false,
        currentView: "dashboard",
        currentLab: null,
        activeSimulation: null
    };

    const LABS = {
        mechanics: {
            title: "Mechanics Laboratory",
            eyebrow: "CLASSICAL PHYSICS",
            description:
                "Investigate motion, forces, acceleration and Newton's laws using adjustable experimental variables.",
            longDescription:
                "Change the applied force and mass to investigate how they affect the acceleration of an object. Observe the relationship between experimental variables and the laws of motion.",
            icon: "⚙️",
            variables: [
                {
                    id: "mass",
                    label: "Mass",
                    min: 1,
                    max: 20,
                    step: 1,
                    value: 5,
                    unit: "kg"
                },
                {
                    id: "force",
                    label: "Applied force",
                    min: 1,
                    max: 100,
                    step: 1,
                    value: 20,
                    unit: "N"
                }
            ],
            measurements: [
                { id: "acceleration", label: "Acceleration", unit: "m/s²" },
                { id: "force-result", label: "Net force", unit: "N" }
            ],
            equation: "F = ma"
        },

        electricity: {
            title: "Electricity Laboratory",
            eyebrow: "ELECTRICITY & CIRCUITS",
            description:
                "Explore voltage, current and resistance through an interactive circuit investigation.",
            longDescription:
                "Adjust the voltage and resistance in an ideal resistor circuit. Use the resulting current to investigate Ohm's law.",
            icon: "⚡",
            variables: [
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
            ],
            measurements: [
                { id: "current", label: "Current", unit: "A" },
                { id: "power", label: "Electrical power", unit: "W" }
            ],
            equation: "V = IR"
        },

        optics: {
            title: "Optics Laboratory",
            eyebrow: "LIGHT & OPTICAL SYSTEMS",
            description:
                "Investigate image formation, focal length and object distance using a simplified thin-lens model.",
            longDescription:
                "Adjust the focal length and object distance of an ideal thin lens. Observe the calculated image position and magnification.",
            icon: "🔭",
            variables: [
                {
                    id: "focal",
                    label: "Focal length",
                    min: 5,
                    max: 40,
                    step: 1,
                    value: 15,
                    unit: "cm"
                },
                {
                    id: "object-distance",
                    label: "Object distance",
                    min: 5,
                    max: 100,
                    step: 1,
                    value: 45,
                    unit: "cm"
                }
            ],
            measurements: [
                { id: "image-distance", label: "Image distance", unit: "cm" },
                { id: "magnification", label: "Magnification", unit: "×" }
            ],
            equation: "1/f = 1/u + 1/v"
        },

        waves: {
            title: "Waves Laboratory",
            eyebrow: "OSCILLATIONS & WAVES",
            description:
                "Explore wave frequency, wavelength and propagation speed with a live wave model.",
            longDescription:
                "Change the frequency and wavelength of an ideal periodic wave and observe how the wave speed changes.",
            icon: "〰️",
            variables: [
                {
                    id: "frequency",
                    label: "Frequency",
                    min: 1,
                    max: 20,
                    step: 1,
                    value: 5,
                    unit: "Hz"
                },
                {
                    id: "wavelength",
                    label: "Wavelength",
                    min: 1,
                    max: 10,
                    step: 0.5,
                    value: 4,
                    unit: "m"
                }
            ],
            measurements: [
                { id: "wave-speed", label: "Wave speed", unit: "m/s" },
                { id: "period", label: "Period", unit: "s" }
            ],
            equation: "v = fλ"
        },

        thermal: {
            title: "Thermal Physics Laboratory",
            eyebrow: "HEAT & ENERGY",
            description:
                "Investigate heat transfer and temperature change using a simplified calorimetry model.",
            longDescription:
                "Change the mass, specific heat capacity and temperature increase to calculate the thermal energy transferred.",
            icon: "🌡️",
            variables: [
                {
                    id: "thermal-mass",
                    label: "Mass",
                    min: 0.1,
                    max: 5,
                    step: 0.1,
                    value: 1,
                    unit: "kg"
                },
                {
                    id: "temperature-change",
                    label: "Temperature change",
                    min: 1,
                    max: 100,
                    step: 1,
                    value: 20,
                    unit: "°C"
                }
            ],
            measurements: [
                { id: "thermal-energy", label: "Heat transferred", unit: "J" },
                { id: "thermal-temperature", label: "Temperature change", unit: "°C" }
            ],
            equation: "Q = mcΔT"
        }
    };

    const $ = (selector, root = document) =>
        root.querySelector(selector);

    const $$ = (selector, root = document) =>
        Array.from(root.querySelectorAll(selector));


    /* =====================================================
       2. SHARED UTILITIES
       ===================================================== */

    function formatNumber(value, decimals = 2) {
        if (!Number.isFinite(value)) {
            return "Undefined";
        }

        return Number(value.toFixed(decimals)).toLocaleString(
            undefined,
            {
                maximumFractionDigits: decimals
            }
        );
    }

    function escapeHTML(value) {
        return String(value).replace(/[&<>"']/g, function (character) {
            const entities = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            };

            return entities[character];
        });
    }

    function showToast(message, type = "success") {
        const toast = $("#toast");

        if (!toast) {
            console.info("[PhysicsLab]", message);
            return;
        }

        toast.textContent = message;
        toast.className = "toast show " + type;
        toast.setAttribute("role", "status");

        if (APP.toastTimeout) {
            clearTimeout(APP.toastTimeout);
        }

        APP.toastTimeout = setTimeout(function () {
            toast.classList.remove("show");
        }, 2800);
    }

    function closeMobileSidebar() {
        const sidebar = $(".sidebar");

        if (sidebar) {
            sidebar.classList.remove("open", "is-open");
        }
    }

    function setText(selector, value) {
        const element = $(selector);

        if (element) {
            element.textContent = value;
        }
    }


    /* =====================================================
       3. PAGE NAVIGATION
       ===================================================== */

    function getViewElement(viewName) {
        return document.getElementById("view-" + viewName);
    }

    function showView(viewName, options = {}) {
        const target = getViewElement(viewName);

        if (!target) {
            console.warn(
                "[PhysicsLab] View not found:",
                "view-" + viewName
            );

            showToast(
                "This page is not available yet.",
                "error"
            );

            return false;
        }

        $$(".page-view, .view-section, [data-view-panel]").forEach(
            function (section) {
                section.hidden = true;
                section.classList.remove("active");
            }
        );

        /*
         * Also support page sections whose IDs follow
         * the view-name convention used in index.html.
         */
        target.hidden = false;
        target.classList.add("active");

        APP.currentView = viewName;

        $$("[data-view]").forEach(function (link) {
            const isActive =
                link.getAttribute("data-view") === viewName;

            link.classList.toggle("active", isActive);

            if (isActive) {
                link.setAttribute("aria-current", "page");
            } else {
                link.removeAttribute("aria-current");
            }
        });

        const titles = {
            dashboard: "Dashboard",
            laboratories: "Laboratories",
            experiments: "Experiments",
            analysis: "Data Analysis",
            notebook: "Lab Notebook",
            concepts: "Physics Concepts",
            assessments: "Assessments",
            premium: "PhysicsLab Premium",
            settings: "Settings"
        };

        setText(
            "#pageTitle",
            titles[viewName] || "PhysicsLab"
        );

        closeMobileSidebar();

        if (!options.keepScroll) {
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        }

        return true;
    }

    function openLab(labKey) {
        const lab = LABS[labKey];

        if (!lab) {
            showToast("Laboratory not found.", "error");
            return;
        }

        const detailView = $("#view-lab-detail");

        if (!detailView) {
            showToast(
                "The laboratory workspace is missing from index.html.",
                "error"
            );
            return;
        }

        APP.currentLab = labKey;

        $$(".page-view, .view-section, [data-view-panel]").forEach(
            function (section) {
                section.hidden = true;
                section.classList.remove("active");
            }
        );

        detailView.hidden = false;
        detailView.classList.add("active");

        $$("[data-view]").forEach(function (link) {
            link.classList.remove("active");
            link.removeAttribute("aria-current");
        });

        setText("#pageTitle", lab.title);
        setText("#detailEyebrow", lab.eyebrow);
        setText("#detailTitle", lab.title);
        setText("#detailDescription", lab.description);
        setText("#detailLong", lab.longDescription);

        closeMobileSidebar();

        renderLabWorkspace(labKey);

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }


    /* =====================================================
       4. LABORATORY WORKSPACE
       ===================================================== */

    function renderLabWorkspace(labKey) {
        const lab = LABS[labKey];
        const container = $("#view-lab-detail");

        if (!lab || !container) {
            return;
        }

        let workspace = $("#physicsLabWorkspace");

        if (!workspace) {
            workspace = document.createElement("div");
            workspace.id = "physicsLabWorkspace";
            workspace.className = "lab-workspace";

            container.appendChild(workspace);
        }

        const variableControls = lab.variables.map(function (variable) {
            const safeId = escapeHTML(variable.id);

            return `
                <div class="control-row">
                    <label for="control-${safeId}">
                        <span>${escapeHTML(variable.label)}</span>
                        <output id="output-${safeId}">
                            ${escapeHTML(variable.value)}
                            ${escapeHTML(variable.unit)}
                        </output>
                    </label>

                    <input
                        type="range"
                        id="control-${safeId}"
                        data-variable="${safeId}"
                        min="${variable.min}"
                        max="${variable.max}"
                        step="${variable.step}"
                        value="${variable.value}"
                        aria-label="${escapeHTML(variable.label)}"
                    />
                </div>
            `;
        }).join("");

        const measurementCards = lab.measurements.map(function (item) {
            return `
                <div class="measurement-card">
                    <span class="measurement-label">
                        ${escapeHTML(item.label)}
                    </span>

                    <strong
                        class="measurement-value"
                        id="result-${escapeHTML(item.id)}"
                    >
                        --
                    </strong>

                    <span class="measurement-unit">
                        ${escapeHTML(item.unit)}
                    </span>
                </div>
            `;
        }).join("");

        workspace.innerHTML = `
            <section class="simulation-panel">
                <div class="simulation-header">
                    <div>
                        <span class="eyebrow">LIVE SIMULATION</span>
                        <h3>${escapeHTML(lab.title)}</h3>
                    </div>

                    <span class="tag tag-success">
                        <span class="live-dot"></span>
                        Interactive
                    </span>
                </div>

                <div class="simulation-stage">
                    <canvas
                        id="physicsCanvas"
                        width="760"
                        height="350"
                        aria-label="${escapeHTML(lab.title)} simulation"
                    >
                        Your browser does not support canvas.
                    </canvas>
                </div>

                <div class="panel">
                    <div class="panel-header">
                        <div>
                            <h3>Live measurements</h3>
                            <p>Results update when you change a variable.</p>
                        </div>
                    </div>

                    <div class="measurement-grid">
                        ${measurementCards}
                    </div>

                    <div class="equation-card" id="labEquation">
                        ${escapeHTML(lab.equation)}
                    </div>
                </div>
            </section>

            <aside class="simulation-controls">
                <span class="eyebrow">EXPERIMENT SETUP</span>
                <h3>Adjust variables</h3>

                <p class="muted-text">
                    Move the sliders to change experimental conditions.
                </p>

                ${variableControls}

                <div class="simulation-actions">
                    <button
                        class="btn btn-secondary"
                        type="button"
                        data-action="reset-lab"
                    >
                        Reset
                    </button>

                    <button
                        class="btn btn-primary"
                        type="button"
                        data-action="record-result"
                    >
                        Record result
                    </button>
                </div>

                <div style="margin-top:22px">
                    <h3>Experiment notes</h3>

                    <p class="muted-text">
                        ${escapeHTML(lab.longDescription)}
                    </p>

                    <p class="muted-text">
                        This is a simplified educational model.
                        Compare its assumptions with real experiments.
                    </p>
                </div>
            </aside>
        `;

        APP.activeSimulation = {
            labKey: labKey,
            values: getDefaultValues(labKey)
        };

        bindLabControls();
        updateSimulation();
    }

    function getDefaultValues(labKey) {
        const values = {};

        LABS[labKey].variables.forEach(function (variable) {
            values[variable.id] = variable.value;
        });

        return values;
    }

    function getCurrentValues() {
        const values = {};

        if (!APP.currentLab) {
            return values;
        }

        LABS[APP.currentLab].variables.forEach(function (variable) {
            const input = $(
                '[data-variable="' + variable.id + '"]'
            );

            values[variable.id] = input
                ? Number(input.value)
                : variable.value;
        });

        return values;
    }

    function bindLabControls() {
        $$("#physicsLabWorkspace [data-variable]").forEach(
            function (input) {
                input.addEventListener("input", updateSimulation);
            }
        );
    }


    /* =====================================================
       5. PHYSICS CALCULATIONS
       ===================================================== */

    function calculateResults(labKey, values) {
        switch (labKey) {
            case "mechanics": {
                const mass = values.mass;
                const force = values.force;

                return {
                    acceleration: force / mass,
                    "force-result": force
                };
            }

            case "electricity": {
                const voltage = values.voltage;
                const resistance = values.resistance;
                const current = voltage / resistance;

                return {
                    current: current,
                    power: voltage * current
                };
            }

            case "optics": {
                const focal = values.focal;
                const objectDistance = values["object-distance"];

                /*
                 * Thin-lens convention:
                 * 1/f = 1/u + 1/v
                 */
                const denominator = 1 / focal - 1 / objectDistance;

                const imageDistance =
                    Math.abs(denominator) < 0.000001
                        ? Infinity
                        : 1 / denominator;

                return {
                    "image-distance": imageDistance,
                    magnification: Number.isFinite(imageDistance)
                        ? -imageDistance / objectDistance
                        : Infinity
                };
            }

            case "waves": {
                const frequency = values.frequency;
                const wavelength = values.wavelength;

                return {
                    "wave-speed": frequency * wavelength,
                    period: 1 / frequency
                };
            }

            case "thermal": {
                const mass = values["thermal-mass"];
                const temperatureChange =
                    values["temperature-change"];

                /*
                 * Approximation: specific heat capacity of water.
                 * c = 4180 J/(kg·°C)
                 */
                return {
                    "thermal-energy":
                        mass * 4180 * temperatureChange,
                    "thermal-temperature": temperatureChange
                };
            }

            default:
                return {};
        }
    }

    function updateSimulation() {
        if (!APP.currentLab) {
            return;
        }

        const lab = LABS[APP.currentLab];
        const values = getCurrentValues();
        const results = calculateResults(APP.currentLab, values);

        APP.activeSimulation = {
            labKey: APP.currentLab,
            values: values,
            results: results
        };

        lab.variables.forEach(function (variable) {
            const output = $(
                "#output-" + variable.id
            );

            if (output) {
                output.textContent =
                    formatNumber(values[variable.id]) +
                    " " +
                    variable.unit;
            }
        });

        lab.measurements.forEach(function (measurement) {
            const element = $(
                "#result-" + measurement.id
            );

            if (!element) {
                return;
            }

            const result = results[measurement.id];

            if (result === Infinity || result === -Infinity) {
                element.textContent = "∞";
            } else if (result === undefined) {
                element.textContent = "--";
            } else {
                element.textContent = formatNumber(result);
            }
        });

        drawSimulation(APP.currentLab, values, results);
    }


    /* =====================================================
       6. CANVAS DRAWING
       ===================================================== */

    function drawSimulation(labKey, values, results) {
        const canvas = $("#physicsCanvas");

        if (!canvas) {
            return;
        }

        const context = canvas.getContext("2d");

        if (!context) {
            return;
        }

        const width = canvas.width;
        const height = canvas.height;

        context.clearRect(0, 0, width, height);

        context.fillStyle = "#0b1321";
        context.fillRect(0, 0, width, height);

        drawGrid(context, width, height);

        switch (labKey) {
            case "mechanics":
                drawMechanics(context, width, height, values, results);
                break;

            case "electricity":
                drawCircuit(context, width, height, values, results);
                break;

            case "optics":
                drawOptics(context, width, height, values, results);
                break;

            case "waves":
                drawWave(context, width, height, values);
                break;

            case "thermal":
                drawThermal(context, width, height, values);
                break;
        }
    }

    function drawGrid(context, width, height) {
        context.strokeStyle = "rgba(130, 160, 210, 0.08)";
        context.lineWidth = 1;

        for (let x = 0; x <= width; x += 38) {
            context.beginPath();
            context.moveTo(x, 0);
            context.lineTo(x, height);
            context.stroke();
        }

        for (let y = 0; y <= height; y += 38) {
            context.beginPath();
            context.moveTo(0, y);
            context.lineTo(width, y);
            context.stroke();
        }
    }

    function drawText(context, text, x, y, size = 16, color = "#edf3ff") {
        context.fillStyle = color;
        context.font = "600 " + size + "px Arial, sans-serif";
        context.fillText(text, x, y);
    }

    function drawMechanics(context, width, height, values, results) {
        const groundY = height * 0.72;
        const boxX = width * 0.37;
        const boxY = groundY - 75;

        context.strokeStyle = "#6e83a6";
        context.lineWidth = 3;
        context.beginPath();
        context.moveTo(40, groundY);
        context.lineTo(width - 40, groundY);
        context.stroke();

        context.fillStyle = "#588bff";
        context.fillRect(boxX, boxY, 95, 75);

        context.strokeStyle = "#9fc0ff";
        context.lineWidth = 2;
        context.strokeRect(boxX, boxY, 95, 75);

        drawText(
            context,
            values.mass + " kg",
            boxX + 22,
            boxY + 42,
            17
        );

        const arrowLength = 35 + values.force * 1.7;
        const arrowY = boxY + 37;
        const arrowStart = boxX + 110;
        const arrowEnd = Math.min(
            width - 35,
            arrowStart + arrowLength
        );

        context.strokeStyle = "#47d7e8";
        context.fillStyle = "#47d7e8";
        context.lineWidth = 4;

        context.beginPath();
        context.moveTo(arrowStart, arrowY);
        context.lineTo(arrowEnd, arrowY);
        context.stroke();

        context.beginPath();
        context.moveTo(arrowEnd, arrowY);
        context.lineTo(arrowEnd - 12, arrowY - 8);
        context.lineTo(arrowEnd - 12, arrowY + 8);
        context.closePath();
        context.fill();

        drawText(context, "F = " + values.force + " N", 40, 45, 18);
        drawText(
            context,
            "a = " + formatNumber(results.acceleration) + " m/s²",
            40,
            74,
            15,
            "#47d7e8"
        );

        drawText(
            context,
            "Illustrative force model",
            40,
            height - 20,
            12,
            "#71819b"
        );
    }

    function drawCircuit(context, width, height, values, results) {
        const left = width * 0.23;
        const right = width * 0.75;
        const top = height * 0.27;
        const bottom = height * 0.73;

        context.strokeStyle = "#47d7e8";
        context.lineWidth = 4;
        context.beginPath();
        context.moveTo(left, top);
        context.lineTo(right, top);
        context.lineTo(right, bottom);
        context.lineTo(left, bottom);
        context.closePath();
        context.stroke();

        /* Battery */
        context.strokeStyle = "#edf3ff";
        context.lineWidth = 5;

        context.beginPath();
        context.moveTo(left - 12, top - 17);
        context.lineTo(left - 12, top + 17);
        context.moveTo(left + 12, top - 10);
        context.lineTo(left + 12, top + 10);
        context.stroke();

        /* Resistor symbol */
        const resistorX = right;
        const resistorY = (top + bottom) / 2;

        context.strokeStyle = "#ffd166";
        context.lineWidth = 4;
        context.beginPath();
        context.moveTo(resistorX, resistorY - 35);
        context.lineTo(resistorX - 9, resistorY - 27);
        context.lineTo(resistorX + 9, resistorY - 17);
        context.lineTo(resistorX - 9, resistorY - 7);
        context.lineTo(resistorX + 9, resistorY + 3);
        context.lineTo(resistorX - 9, resistorY + 13);
        context.lineTo(resistorX + 9, resistorY + 23);
        context.lineTo(resistorX, resistorY + 35);
        context.stroke();

        drawText(context, values.voltage + " V", left - 55, top - 34);
        drawText(
            context,
            values.resistance + " Ω",
            right + 18,
            resistorY + 5,
            15,
            "#ffd166"
        );

        drawText(
            context,
            "I = " + formatNumber(results.current) + " A",
            40,
            height - 30,
            16,
            "#47d7e8"
        );

        drawText(context, "Ideal DC circuit", 40, 38, 15);
    }

    function drawOptics(context, width, height, values, results) {
        const axisY = height * 0.55;
        const lensX = width * 0.59;

        context.strokeStyle = "#8194b4";
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(35, axisY);
        context.lineTo(width - 35, axisY);
        context.stroke();

        /* Thin lens */
        context.strokeStyle = "#47d7e8";
        context.lineWidth = 5;
        context.beginPath();
        context.ellipse(lensX, axisY, 12, 100, 0, 0, Math.PI * 2);
        context.stroke();

        /* Object arrow */
        const objectX = Math.max(
            55,
            lensX - Math.min(values["object-distance"] * 4, 240)
        );

        context.strokeStyle = "#ffd166";
        context.lineWidth = 4;
        context.beginPath();
        context.moveTo(objectX, axisY);
        context.lineTo(objectX, axisY - 65);
        context.stroke();

        context.fillStyle = "#ffd166";
        context.beginPath();
        context.moveTo(objectX, axisY - 76);
        context.lineTo(objectX - 8, axisY - 62);
        context.lineTo(objectX + 8, axisY - 62);
        context.closePath();
        context.fill();

        drawText(context, "Object", objectX - 25, axisY + 28, 13);
        drawText(context, "Lens", lensX - 17, axisY + 125, 13, "#47d7e8");

        drawText(
            context,
            "f = " + values.focal + " cm",
            35,
            35,
            16
        );

        const imageDistance = results["image-distance"];

        drawText(
            context,
            "Image distance: " +
                (
                    Number.isFinite(imageDistance)
                        ? formatNumber(imageDistance) + " cm"
                        : "at infinity"
                ),
            35,
            height - 22,
            14,
            "#47d7e8"
        );
    }

    function drawWave(context, width, height, values) {
        const midY = height / 2;
        const amplitude = Math.min(height * 0.28, 90);
        const cycles = values.frequency / 4;
        const phase = values.wavelength;

        context.strokeStyle = "#47d7e8";
        context.lineWidth = 3;
        context.beginPath();

        for (let x = 0; x <= width; x += 2) {
            const y =
                midY -
                Math.sin(
                    (x / width) * Math.PI * 2 * cycles
                ) *
                amplitude;

            if (x === 0) {
                context.moveTo(x, y);
            } else {
                context.lineTo(x, y);
            }
        }

        context.stroke();

        context.strokeStyle = "rgba(255, 209, 102, 0.8)";
        context.setLineDash([6, 6]);
        context.beginPath();
        context.moveTo(30, midY);
        context.lineTo(width - 30, midY);
        context.stroke();
        context.setLineDash([]);

        drawText(
            context,
            "f = " + values.frequency + " Hz",
            35,
            36,
            16
        );

        drawText(
            context,
            "λ = " + formatNumber(phase) + " m",
            35,
            height - 25,
            16,
            "#ffd166"
        );
    }

    function drawThermal(context, width, height, values) {
        const beakerX = width * 0.34;
        const beakerY = height * 0.24;
        const beakerWidth = width * 0.32;
        const beakerHeight = height * 0.53;

        const temperatureRatio =
            values["temperature-change"] / 100;

        const red = Math.round(40 + 180 * temperatureRatio);
        const green = Math.round(120 - 75 * temperatureRatio);

        context.strokeStyle = "#a9bddc";
        context.lineWidth = 4;
        context.beginPath();
        context.moveTo(beakerX, beakerY);
        context.lineTo(beakerX + 12, beakerY + beakerHeight);
        context.lineTo(beakerX + beakerWidth - 12, beakerY + beakerHeight);
        context.lineTo(beakerX + beakerWidth, beakerY);
        context.stroke();

        context.fillStyle =
            "rgba(" + red + "," + green + ",90,0.65)";

        context.fillRect(
            beakerX + 14,
            beakerY + beakerHeight * (1 - temperatureRatio * 0.55),
            beakerWidth - 28,
            beakerHeight * temperatureRatio * 0.55
        );

        drawText(
            context,
            "Mass: " + formatNumber(values["thermal-mass"]) + " kg",
            35,
            40,
            16
        );

        drawText(
            context,
            "ΔT: " + values["temperature-change"] + " °C",
            35,
            67,
            15,
            "#ffd166"
        );

        drawText(
            context,
            "Idealized calorimetry model",
            35,
            height - 24,
            12,
            "#71819b"
        );
    }


    /* =====================================================
       7. RESET AND RECORD EXPERIMENTS
       ===================================================== */

    function resetLab() {
        if (!APP.currentLab) {
            return;
        }

        LABS[APP.currentLab].variables.forEach(function (variable) {
            const input = $(
                '[data-variable="' + variable.id + '"]'
            );

            if (input) {
                input.value = variable.value;
            }
        });

        updateSimulation();
        showToast("Experiment variables reset.");
    }

    function recordResult() {
        if (!APP.currentLab || !APP.activeSimulation) {
            showToast("Open a laboratory first.", "error");
            return;
        }

        const lab = LABS[APP.currentLab];
        const values = APP.activeSimulation.values;
        const results = APP.activeSimulation.results || {};

        const record = {
            id: Date.now(),
            lab: APP.currentLab,
            title: lab.title,
            date: new Date().toISOString(),
            variables: values,
            results: results,
            equation: lab.equation
        };

        /*
         * Save records locally on this device.
         * This is not cloud synchronization.
         */
        try {
            const key = "physicslab_records";
            const existing = JSON.parse(
                localStorage.getItem(key) || "[]"
            );

            existing.unshift(record);

            localStorage.setItem(
                key,
                JSON.stringify(existing.slice(0, 100))
            );

            showToast("Result saved to this browser.");
        } catch (error) {
            console.error("Could not save experiment:", error);

            showToast(
                "Could not save this result on the device.",
                "error"
            );
        }
    }


    /* =====================================================
       8. NOTEBOOK
       ===================================================== */

    function loadNotebook() {
        const container = $(
            "#notebookEntries, #notebookList, [data-notebook-entries]"
        );

        if (!container) {
            return;
        }

        let records = [];

        try {
            records = JSON.parse(
                localStorage.getItem("physicslab_records") || "[]"
            );
        } catch (error) {
            console.warn("Notebook data could not be read.", error);
        }

        if (!records.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📓</div>
                    <h3>Your notebook is ready</h3>
                    <p>
                        Open a laboratory and select “Record result”
                        to save your first experiment.
                    </p>
                </div>
            `;

            return;
        }

        container.innerHTML = records.map(function (record) {
            const date = new Date(record.date);

            const resultLines = Object.entries(
                record.results || {}
            ).map(function (entry) {
                return (
                    escapeHTML(entry[0]) +
                    ": " +
                    escapeHTML(formatNumber(entry[1]))
                );
            }).join(" · ");

            return `
                <article class="notebook-entry">
                    <div class="notebook-meta">
                        <span>${escapeHTML(
                            Number.isNaN(date.getTime())
                                ? "Saved experiment"
                                : date.toLocaleString()
                        )}</span>

                        <span class="tag tag-primary">
                            ${escapeHTML(record.lab)}
                        </span>
                    </div>

                    <h3>${escapeHTML(record.title)}</h3>

                    <p class="muted-text">
                        ${escapeHTML(record.equation || "")}
                    </p>

                    <p class="muted-text">
                        ${resultLines}
                    </p>
                </article>
            `;
        }).join("");
    }


    /* =====================================================
       9. EXPERIMENT SEARCH AND FILTERING
       ===================================================== */

    function filterExperiments(searchTerm) {
        const term = searchTerm.trim().toLowerCase();

        const cards = $$(
            ".experiment-card, .laboratory-card, .lab-card, " +
            "[data-lab], [data-experiment]"
        );

        cards.forEach(function (card) {
            const text = (
                card.textContent +
                " " +
                (card.getAttribute("data-lab") || "") +
                " " +
                (card.getAttribute("data-experiment") || "")
            ).toLowerCase();

            card.hidden = Boolean(term) && !text.includes(term);
        });
    }


    /* =====================================================
       10. THEME
       ===================================================== */

    function initializeTheme() {
        const button = $("#themeToggle");

        let savedTheme = "dark";

        try {
            savedTheme = localStorage.getItem(
                "physicslab_theme"
            ) || "dark";
        } catch (error) {
            /* Continue using the default theme. */
        }

        document.body.classList.toggle(
            "light-theme",
            savedTheme === "light"
        );

        if (button) {
            button.setAttribute(
                "aria-pressed",
                String(savedTheme === "light")
            );
        }
    }

    function toggleTheme() {
        const isLight =
            !document.body.classList.contains("light-theme");

        document.body.classList.toggle("light-theme", isLight);

        try {
            localStorage.setItem(
                "physicslab_theme",
                isLight ? "light" : "dark"
            );
        } catch (error) {
            console.warn("Theme preference was not saved.");
        }

        const button = $("#themeToggle");

        if (button) {
            button.setAttribute(
                "aria-pressed",
                String(isLight)
            );
        }

        showToast(
            isLight ? "Light theme enabled." : "Dark theme enabled."
        );

        if (APP.currentLab) {
            updateSimulation();
        }
    }


    /* =====================================================
       11. EVENT HANDLERS
       ===================================================== */

    function bindNavigation() {
        document.addEventListener("click", function (event) {
            const navigationLink = event.target.closest("[data-view]");

            if (navigationLink) {
                event.preventDefault();

                const viewName =
                    navigationLink.getAttribute("data-view");

                if (viewName) {
                    showView(viewName);

                    if (viewName === "notebook") {
                        loadNotebook();
                    }
                }

                return;
            }

            const labCard = event.target.closest("[data-lab]");

            if (labCard) {
                const labKey = labCard.getAttribute("data-lab");

                if (LABS[labKey]) {
                    event.preventDefault();
                    openLab(labKey);
                }

                return;
            }

            const actionElement = event.target.closest("[data-action]");

            if (!actionElement) {
                return;
            }

            const action = actionElement.getAttribute("data-action");

            switch (action) {
                case "reset-lab":
                    resetLab();
                    break;

                case "record-result":
                    recordResult();
                    break;

                case "back-to-labs":
                    showView("laboratories");
                    break;

                case "back-to-dashboard":
                    showView("dashboard");
                    break;

                case "toggle-theme":
                    toggleTheme();
                    break;

                case "open-premium":
                    showView("premium");
                    break;

                case "open-notebook":
                    showView("notebook");
                    loadNotebook();
                    break;
            }
        });

        const mobileMenu = $("#mobileMenu");

        if (mobileMenu) {
            mobileMenu.addEventListener("click", function () {
                const sidebar = $(".sidebar");

                if (sidebar) {
                    sidebar.classList.toggle("open");
                    sidebar.classList.toggle("is-open");
                }
            });
        }

        const themeToggle = $("#themeToggle");

        if (themeToggle) {
            themeToggle.addEventListener("click", toggleTheme);
        }

        const searchInputs = $$(
            "#globalSearch, #searchInput, .search-box input, " +
            "[data-experiment-search]"
        );

        searchInputs.forEach(function (input) {
            input.addEventListener("input", function () {
                filterExperiments(input.value);

                if (input.value.trim()) {
                    const experimentsView = getViewElement("experiments");

                    if (experimentsView && experimentsView.hidden) {
                        showView("experiments");
                    }
                }
            });

            input.addEventListener("keydown", function (event) {
                if (event.key === "Escape") {
                    input.value = "";
                    filterExperiments("");
                    input.blur();
                }
            });
        });

        document.addEventListener("keydown", function (event) {
            const isSearchShortcut =
                (event.ctrlKey || event.metaKey) &&
                event.key.toLowerCase() === "k";

            if (isSearchShortcut) {
                event.preventDefault();

                const search = $(
                    "#globalSearch, #searchInput, .search-box input, " +
                    "[data-experiment-search]"
                );

                if (search) {
                    search.focus();
                }
            }

            if (event.key === "Escape") {
                closeMobileSidebar();
            }
        });
    }


    /* =====================================================
       12. DASHBOARD INITIALIZATION
       ===================================================== */

    function initializeDashboard() {
        const startButtons = $$(
            "[data-start-learning], .start-learning-button"
        );

        startButtons.forEach(function (button) {
            button.addEventListener("click", function () {
                showView("laboratories");
            });
        });

        const today = new Date();

        setText(
            "#currentDate",
            today.toLocaleDateString(undefined, {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            })
        );
    }


    /* =====================================================
       13. START APPLICATION
       ===================================================== */

    function initialize() {
        if (APP.initialized) {
            return;
        }

        initializeTheme();
        bindNavigation();
        initializeDashboard();

        /*
         * Display the dashboard when the application loads.
         */
        const dashboard = getViewElement("dashboard");

        if (dashboard) {
            showView("dashboard", { keepScroll: true });
        } else {
            console.warn(
                "[PhysicsLab] Could not find #view-dashboard."
            );
        }

        APP.initialized = true;

        console.info(
            APP.name + " v" + APP.version + " initialized."
        );
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            { once: true }
        );
    } else {
        initialize();
    }

    /*
     * Expose a small API for future PhysicsLab modules.
     */
    window.PhysicsLab = {
        version: APP.version,
        showView: showView,
        openLab: openLab,
        updateSimulation: updateSimulation,
        getLabs: function () {
            return Object.keys(LABS);
        },
        getCurrentLab: function () {
            return APP.currentLab;
        }
    };

})();
