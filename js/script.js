// ==========================================
// Grading Systems Configuration
// ==========================================

const GRADING_SYSTEMS = {
    AUS: {
        name: "Australia",
        grades: {
            "HD": 4.00,
            "D": 3.00,
            "C": 2.00,
            "P": 1.00,
            "Fail": 0.00
        }
    },
    MY: {
        name: "Malaysia",
        grades: {
            "HD": 4.00,
            "D": 3.67,
            "C": 3.00,
            "P": 2.33,
            "Fail": 0.00,
            "F": 0.00
        }
    }
};

// Available grades for the dropdown
const GRADES = ["HD", "D", "C", "P", "Fail"];

// Local Storage Keys
const STORAGE_KEY = 'gpa_calculator_data';
const THEME_KEY = 'gpa_calculator_theme';

// Available themes
const THEMES = ['light', 'dark', 'dark-blue', 'dark-green', 'dark-red'];

// ==========================================
// Theme Functions
// ==========================================

/**
 * Set the theme and save to localStorage
 * @param {string} theme - The theme name
 */
function setTheme(theme) {
    if (!THEMES.includes(theme)) {
        theme = 'light';
    }
    
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    
    // Update active state on theme options
    updateThemeButtonStates(theme);
    
    // Close the theme menu
    closeThemeMenu();
}

/**
 * Load the saved theme from localStorage
 */
function loadTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
    setTheme(savedTheme);
}

/**
 * Toggle the theme menu visibility
 */
function toggleThemeMenu() {
    const menu = document.getElementById('themeMenu');
    menu.classList.toggle('show');
}

/**
 * Close the theme menu
 */
function closeThemeMenu() {
    const menu = document.getElementById('themeMenu');
    menu.classList.remove('show');
}

/**
 * Update the active state on theme option buttons
 * @param {string} activeTheme - The currently active theme
 */
function updateThemeButtonStates(activeTheme) {
    const options = document.querySelectorAll('.theme-option');
    options.forEach(option => {
        if (option.getAttribute('data-theme') === activeTheme) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });
}

// Close theme menu when clicking outside
document.addEventListener('click', function(e) {
    const themeSwitcher = document.querySelector('.theme-switcher');
    if (themeSwitcher && !themeSwitcher.contains(e.target)) {
        closeThemeMenu();
    }
});

// ==========================================
// Utility Functions
// ==========================================

/**
 * Get the grade point for a given grade based on the selected grading system
 * @param {string} grade - The grade (e.g., "HD", "D", "C", "P", "Fail")
 * @param {string} systemType - The grading system type ("AUS" or "MY")
 * @returns {number} - The grade point value
 */
function getGradePoint(grade, systemType) {
    const trimmedGrade = grade.trim();
    const system = GRADING_SYSTEMS[systemType] || GRADING_SYSTEMS.AUS;
    return system.grades[trimmedGrade] !== undefined ? system.grades[trimmedGrade] : 0.00;
}

/**
 * Round a number to specified decimal places
 * @param {number} num - The number to round
 * @param {number} decimals - Number of decimal places
 * @returns {number} - Rounded number
 */
function roundTo(num, decimals) {
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==========================================
// DOM Manipulation Functions
// ==========================================

/**
 * Create a new subject row element
 * @returns {HTMLElement} - The subject row div element
 */
function createSubjectRow() {
    const div = document.createElement('div');
    div.className = 'subject-row';
    
    // Create grade options HTML
    const gradeOptions = GRADES.map(g => `<option value="${g}">${g}</option>`).join('');
    
    div.innerHTML = `
        <input type="text" placeholder="Course Code" class="s-code" required>
        <input type="text" placeholder="Course Name" class="s-name" required>
        <select class="s-grade">
            ${gradeOptions}
        </select>
        <input type="number" placeholder="Credits" class="s-credits" min="1" step="1" required>
        <button class="btn-remove-sub" onclick="removeSubject(this)">X</button>
    `;
    
    return div;
}

/**
 * Add a new semester block to the page
 */
function addSemester() {
    const container = document.getElementById('semesters-container');
    
    // Create the main div for the semester
    const semDiv = document.createElement('div');
    semDiv.className = 'semester-box';
    
    // Set the inner HTML for the semester
    semDiv.innerHTML = `
        <div class="sem-header-row">
            <h3 class="sem-title">Semester</h3>
            <button class="btn-remove-sem" onclick="removeSemester(this)">Remove Semester</button>
        </div>
        <div class="subjects-container"></div>
        <button class="btn-add-sub" onclick="addSubject(this)">+ Add Subject</button>
    `;
    
    container.appendChild(semDiv);
    
    // Automatically add one subject row to the new semester
    addSubject(semDiv.querySelector('.btn-add-sub'));
    
    // Update semester labels
    updateSemesterLabels();
    
    // Save state to localStorage
    saveState();
}

/**
 * Remove a semester block
 * @param {HTMLElement} btn - The remove button that was clicked
 */
function removeSemester(btn) {
    if (confirm("Are you sure you want to remove this semester?")) {
        const semBox = btn.closest('.semester-box');
        semBox.remove();
        updateSemesterLabels();
        saveState();
    }
}

/**
 * Add a new subject row to a semester
 * @param {HTMLElement} btn - The add subject button that was clicked
 */
function addSubject(btn) {
    const subjectsContainer = btn.previousElementSibling;
    subjectsContainer.appendChild(createSubjectRow());
    saveState();
}

/**
 * Remove a subject row
 * @param {HTMLElement} btn - The remove button that was clicked
 */
function removeSubject(btn) {
    btn.parentElement.remove();
    saveState();
}

/**
 * Update semester titles sequentially
 */
function updateSemesterLabels() {
    const semesters = document.querySelectorAll('.semester-box');
    semesters.forEach((sem, index) => {
        const title = sem.querySelector('.sem-title');
        title.innerText = `Semester ${index + 1}`;
    });
}

// ==========================================
// Calculation Functions
// ==========================================

/**
 * Calculate GPA and CGPA based on the input data
 */
function calculateGPA() {
    const systemType = document.getElementById('gradingSystem').value;
    const semesterDivs = document.querySelectorAll('.semester-box');
    
    let totalGradePoints = 0;
    let totalCredits = 0;
    const results = [];
    
    // Process each semester
    semesterDivs.forEach((semDiv, index) => {
        let semGradePoints = 0;
        let semCredits = 0;
        const processedSubjects = [];
        
        const rows = semDiv.querySelectorAll('.subject-row');
        
        rows.forEach(row => {
            const code = row.querySelector('.s-code').value.trim();
            const name = row.querySelector('.s-name').value.trim();
            const grade = row.querySelector('.s-grade').value;
            const creditsStr = row.querySelector('.s-credits').value;
            
            // Validate input
            if (!code || !name || !creditsStr) {
                return; // Skip incomplete entries
            }
            
            const credits = parseFloat(creditsStr);
            
            if (isNaN(credits) || credits <= 0) {
                console.warn(`Invalid credits value for subject ${code}`);
                return;
            }
            
            const point = getGradePoint(grade, systemType);
            const subTotalGP = point * credits;
            
            semGradePoints += subTotalGP;
            semCredits += credits;
            
            processedSubjects.push({
                code: code,
                name: name,
                grade: grade,
                credits: credits,
                point: point
            });
        });
        
        // Calculate semester GPA
        const gpa = semCredits > 0 ? semGradePoints / semCredits : 0;
        
        // Add to totals
        totalGradePoints += semGradePoints;
        totalCredits += semCredits;
        
        // Calculate Cumulative CGPA at this point
        const currentCGPA = totalCredits > 0 ? totalGradePoints / totalCredits : 0;
        
        // Only include semesters with valid subjects
        if (processedSubjects.length > 0) {
            results.push({
                semesterIndex: index + 1,
                subjects: processedSubjects,
                gpa: roundTo(gpa, 2),
                totalCredits: semCredits,
                cumulativeCGPA: roundTo(currentCGPA, 2)
            });
        }
    });
    
    // Check if we have any results
    if (results.length === 0) {
        alert("Please ensure you have at least one semester with valid subjects (all fields must be filled).");
        return;
    }
    
    // Calculate CGPA
    const cgpa = totalCredits > 0 ? totalGradePoints / totalCredits : 0;
    
    // Display results
    displayResults(results, roundTo(cgpa, 2), systemType);
}

/**
 * Display the calculation results
 * @param {Array} results - Array of semester results
 * @param {number} cgpa - The calculated CGPA
 * @param {string} systemType - The grading system used
 */
function displayResults(results, cgpa, systemType) {
    // Hide calculator, show results
    document.getElementById('semesters-container').classList.add('hidden');
    document.querySelector('.controls').classList.add('hidden');
    document.querySelector('.action-buttons').classList.add('hidden');
    document.getElementById('results-container').classList.remove('hidden');
    
    // Set system name
    const systemName = GRADING_SYSTEMS[systemType].name;
    document.getElementById('system-used').textContent = systemName;
    
    // Build semester results HTML
    const resultsContainer = document.getElementById('semester-results');
    let resultsHTML = '';
    
    results.forEach(sem => {
        resultsHTML += `
            <div class="sem-result-header">
                <h4>Semester ${sem.semesterIndex}</h4>
                <span class="gpa-badge">GPA: ${sem.gpa.toFixed(2)}</span>
            </div>
            <table class="results-table">
                <thead>
                    <tr>
                        <th>Code</th>
                        <th>Subject Name</th>
                        <th>Grade</th>
                        <th>Credits</th>
                        <th>Grade Point</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        sem.subjects.forEach(sub => {
            resultsHTML += `
                <tr>
                    <td>${escapeHtml(sub.code)}</td>
                    <td>${escapeHtml(sub.name)}</td>
                    <td>${escapeHtml(sub.grade)}</td>
                    <td>${sub.credits}</td>
                    <td>${sub.point.toFixed(2)}</td>
                </tr>
            `;
        });
        
        resultsHTML += `
                </tbody>
            </table>
        `;
    });
    
    resultsContainer.innerHTML = resultsHTML;
    
    // Set CGPA
    document.getElementById('final-cgpa').textContent = cgpa.toFixed(2);
    
    // Render Chart
    renderCGPAChart(results);
    
    // Scroll to top of results
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Show the calculator view (hide results)
 */
function showCalculator() {
    document.getElementById('semesters-container').classList.remove('hidden');
    document.querySelector('.controls').classList.remove('hidden');
    document.querySelector('.action-buttons').classList.remove('hidden');
    document.getElementById('results-container').classList.add('hidden');
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Render the CGPA progression chart using D3.js
 * @param {Array} data - The results array containing cumulativeCGPA
 */
function renderCGPAChart(data) {
    // Remove existing tooltip if any
    d3.selectAll('.chart-tooltip').remove();
    
    const containerId = 'cgpa-chart-container';
    const container = document.getElementById(containerId);
    
    // Clear previous chart
    container.innerHTML = '';
    
    if (!data || data.length === 0) return;

    // Set dimensions
    const margin = {top: 20, right: 30, bottom: 40, left: 50};
    const width = container.clientWidth - margin.left - margin.right;
    const height = container.clientHeight - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select(`#${containerId}`)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // X Scale
    const x = d3.scalePoint()
        .domain(data.map(d => `Sem ${d.semesterIndex}`))
        .range([0, width])
        .padding(0.5);

    // Y Scale (0 to 4.0)
    const y = d3.scaleLinear()
        .domain([0, 4.0])
        .range([height, 0]);

    // Add X Axis
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .attr("class", "chart-axis")
        .call(d3.axisBottom(x));

    // Add Y Axis
    svg.append("g")
        .attr("class", "chart-axis")
        .call(d3.axisLeft(y).ticks(5));

    // Line Generator for CGPA
    const lineCGPA = d3.line()
        .x(d => x(`Sem ${d.semesterIndex}`))
        .y(d => y(d.cumulativeCGPA));

    // Line Generator for GPA
    const lineGPA = d3.line()
        .x(d => x(`Sem ${d.semesterIndex}`))
        .y(d => y(d.gpa));

    // Add CGPA Line
    svg.append("path")
        .datum(data)
        .attr("class", "chart-line cgpa")
        .attr("d", lineCGPA);

    // Add GPA Line
    svg.append("path")
        .datum(data)
        .attr("class", "chart-line gpa")
        .attr("d", lineGPA);

    // Add Tooltip div
    const tooltip = d3.select("body").append("div")
        .attr("class", "chart-tooltip")
        .style("opacity", 0);

    // Add CGPA Dots
    svg.selectAll(".dot-cgpa")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "chart-dot cgpa")
        .attr("cx", d => x(`Sem ${d.semesterIndex}`))
        .attr("cy", d => y(d.cumulativeCGPA))
        .attr("r", 6)
        .on("mouseover", function(event, d) {
            d3.select(this).attr("r", 9);
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`<strong>Semester ${d.semesterIndex}</strong><br/><span class="highlight-cgpa">CGPA: ${d.cumulativeCGPA.toFixed(2)}</span><br/>GPA: ${d.gpa.toFixed(2)}`)
                .style("left", (event.pageX) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function(d) {
            d3.select(this).attr("r", 6);
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    // Add GPA Dots
    svg.selectAll(".dot-gpa")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "chart-dot gpa")
        .attr("cx", d => x(`Sem ${d.semesterIndex}`))
        .attr("cy", d => y(d.gpa))
        .attr("r", 6)
        .on("mouseover", function(event, d) {
            d3.select(this).attr("r", 9);
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`<strong>Semester ${d.semesterIndex}</strong><br/>CGPA: ${d.cumulativeCGPA.toFixed(2)}<br/><span class="highlight-gpa">GPA: ${d.gpa.toFixed(2)}</span>`)
                .style("left", (event.pageX) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function(d) {
            d3.select(this).attr("r", 6);
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    // Add Legend
    const legend = svg.append("g")
        .attr("transform", `translate(${width - 10}, 0)`)
        .attr("text-anchor", "end")
        .attr("font-family", "sans-serif")
        .attr("font-size", 12);

    // CGPA Legend
    const legendCGPA = legend.append("g").attr("transform", "translate(0, 0)");
    legendCGPA.append("line")
        .attr("x1", -30).attr("y1", 5).attr("x2", -5).attr("y2", 5)
        .attr("stroke", "var(--border-accent)")
        .attr("stroke-width", 3);
    legendCGPA.append("text")
        .attr("x", 0).attr("y", 9)
        .text("CGPA")
        .attr("fill", "var(--text-primary)");

    // GPA Legend
    const legendGPA = legend.append("g").attr("transform", "translate(0, 20)");
    legendGPA.append("line")
        .attr("x1", -30).attr("y1", 5).attr("x2", -5).attr("y2", 5)
        .attr("stroke", "var(--gpa-badge)")
        .attr("stroke-width", 3);
    legendGPA.append("text")
        .attr("x", 0).attr("y", 9)
        .text("GPA")
        .attr("fill", "var(--text-primary)");
}

// ==========================================
// Local Storage Functions
// ==========================================

/**
 * Save the current form state to localStorage
 */
function saveState() {
    const system = document.getElementById('gradingSystem').value;
    const semesters = [];
    
    document.querySelectorAll('.semester-box').forEach(semBox => {
        const subjects = [];
        semBox.querySelectorAll('.subject-row').forEach(row => {
            subjects.push({
                code: row.querySelector('.s-code').value,
                name: row.querySelector('.s-name').value,
                grade: row.querySelector('.s-grade').value,
                credits: row.querySelector('.s-credits').value
            });
        });
        semesters.push(subjects);
    });
    
    const data = { system, semesters };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/**
 * Load state from localStorage and rebuild the DOM
 * @returns {boolean} - True if data was loaded, false otherwise
 */
function loadState() {
    const dataStr = localStorage.getItem(STORAGE_KEY);
    if (!dataStr) return false;
    
    try {
        const data = JSON.parse(dataStr);
        
        // Set grading system
        document.getElementById('gradingSystem').value = data.system || 'AUS';
        
        // Clear current content
        const container = document.getElementById('semesters-container');
        container.innerHTML = '';
        
        if (data.semesters && data.semesters.length > 0) {
            data.semesters.forEach(semSubjects => {
                // Create semester structure
                const semDiv = document.createElement('div');
                semDiv.className = 'semester-box';
                semDiv.innerHTML = `
                    <div class="sem-header-row">
                        <h3 class="sem-title">Semester</h3>
                        <button class="btn-remove-sem" onclick="removeSemester(this)">Remove Semester</button>
                    </div>
                    <div class="subjects-container"></div>
                    <button class="btn-add-sub" onclick="addSubject(this)">+ Add Subject</button>
                `;
                container.appendChild(semDiv);
                
                const subContainer = semDiv.querySelector('.subjects-container');
                
                semSubjects.forEach(sub => {
                    const row = createSubjectRow();
                    row.querySelector('.s-code').value = sub.code || '';
                    row.querySelector('.s-name').value = sub.name || '';
                    row.querySelector('.s-grade').value = sub.grade || 'HD';
                    row.querySelector('.s-credits').value = sub.credits || '';
                    subContainer.appendChild(row);
                });
            });
            
            updateSemesterLabels();
            return true;
        }
    } catch (e) {
        console.error("Failed to load state:", e);
        localStorage.removeItem(STORAGE_KEY);
    }
    
    return false;
}

/**
 * Clear all data and reset to default state
 */
function clearData() {
    if (confirm("Are you sure you want to clear all data?")) {
        localStorage.removeItem(STORAGE_KEY);
        document.getElementById('semesters-container').innerHTML = '';
        document.getElementById('gradingSystem').value = 'AUS';
        addSemester();
    }
}

// ==========================================
// Event Listeners
// ==========================================

// Auto-save on input changes
document.addEventListener('input', function(e) {
    if (e.target.matches('input')) {
        saveState();
    }
});

// Auto-save on select changes
document.addEventListener('change', function(e) {
    if (e.target.matches('select') && !e.target.closest('.theme-switcher')) {
        saveState();
    }
});

// ==========================================
// Initialization
// ==========================================

/**
 * Initialize the application
 */
function init() {
    // Load saved theme
    loadTheme();
    
    // Try to load saved data, otherwise add a default semester
    if (!loadState()) {
        addSemester();
    }
}

// Run initialization when DOM is ready
document.addEventListener('DOMContentLoaded', init);