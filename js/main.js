document.addEventListener("DOMContentLoaded", () => {
  const gridSize = 10;
  const moistureThreshold = 30;

  const simulations = {
    ai: { field: [], interval: null, waterUsed: 0, healthData: [] },
    traditional: { field: [], interval: null, waterUsed: 0, healthData: [] }
  };

  function createCell(id) {
    return {
      id,
      moisture: Math.floor(Math.random() * 40 + 30), // 30–70%
      health: 100
    };
  }

  function initField(mode) {
    const sim = simulations[mode];
    const container = document.getElementById(`field-${mode}`);
    container.innerHTML = '';
    sim.field = [];

    for (let i = 0; i < gridSize * gridSize; i++) {
      const cell = createCell(i);
      sim.field.push(cell);

      const cellEl = document.createElement('div');
      cellEl.className = 'cell';
      cellEl.id = `${mode}-cell-${i}`;
      updateCellDisplay(cell, cellEl);
      container.appendChild(cellEl);
    }

    updateDisplay(mode);
  }

  function updateCellDisplay(cell, cellEl) {
    const color = cell.moisture > 50
      ? '#6cbb3c'   // Green
      : cell.moisture > 30
        ? '#f0c330' // Yellow
        : '#d9534f';// Red

    cellEl.style.backgroundColor = color;
    cellEl.textContent = `${cell.moisture}%`;
  }

  function updateDisplay(mode) {
    const sim = simulations[mode];
    for (const cell of sim.field) {
      const el = document.getElementById(`${mode}-cell-${cell.id}`);
      if (el) updateCellDisplay(cell, el);
    }

    const avg = Math.round(sim.field.reduce((a, c) => a + c.moisture, 0) / sim.field.length);
    document.getElementById(`healthIndex-${mode}`).textContent = avg;
    document.getElementById(`waterUsed-${mode}`).textContent = sim.waterUsed;
  }

  function simulateWeather() {
    const options = ['Sunny', 'Rainy', 'Cloudy'];
    return options[Math.floor(Math.random() * options.length)];
  }

  function applyEvaporation(mode) {
    simulations[mode].field.forEach(cell => {
      cell.moisture = Math.max(0, cell.moisture - 5); // dry loss
    });
  }

  function applyRain(mode) {
    simulations[mode].field.forEach(cell => {
      cell.moisture = Math.min(100, cell.moisture + 15);
    });
  }

  function applyIrrigation(mode, weather) {
    const sim = simulations[mode];
    const forecastEnabled = document.getElementById(`forecastToggle-${mode}`)?.checked ?? false;

    for (const cell of sim.field) {
      const irrigate = mode === 'ai'
        ? cell.moisture < moistureThreshold && (!forecastEnabled || weather !== 'Rainy')
        : true;

      if (irrigate) {
        cell.moisture = Math.min(100, cell.moisture + (mode === 'ai' ? 30 : 20));
        sim.waterUsed++;
        logIrrigation(mode, cell.id);
      }
    }
  }

  function logIrrigation(mode, cellId) {
    const logList = document.getElementById(`logList-${mode}`);
    if (!logList) return;
    const li = document.createElement('li');
    li.textContent = `Cell ${cellId} irrigated at ${new Date().toLocaleTimeString()}`;
    logList.appendChild(li);
  }

  function logHealthData(mode) {
    const sim = simulations[mode];
    const avg = Math.round(sim.field.reduce((a, c) => a + c.moisture, 0) / sim.field.length);
    sim.healthData.push(avg);
  }

  function runCycle(mode) {
    const weather = simulateWeather();
    applyEvaporation(mode);
    if (weather === 'Rainy') applyRain(mode);
    applyIrrigation(mode, weather);
    updateDisplay(mode);
    logHealthData(mode);
  }

  function startSimulation(mode) {
    stopSimulation(mode);
    simulations[mode].interval = setInterval(() => runCycle(mode), 1000);
  }

  function stopSimulation(mode) {
    if (simulations[mode].interval) {
      clearInterval(simulations[mode].interval);
      simulations[mode].interval = null;
    }
  }

  function stepSimulation(mode) {
    runCycle(mode);
  }

  function resetSimulation(mode) {
    stopSimulation(mode);
    simulations[mode].waterUsed = 0;
    simulations[mode].healthData = [];
    initField(mode);
    const logList = document.getElementById(`logList-${mode}`);
    if (logList) logList.innerHTML = '';
  }

  function downloadData() {
    const format = document.getElementById('exportFormat').value;
    const mode = document.getElementById('modeSelector').value;
    const sim = simulations[mode];

    const data = {
      waterUsed: sim.waterUsed,
      healthHistory: sim.healthData,
      fieldSnapshot: sim.field.map(cell => ({
        id: cell.id,
        moisture: cell.moisture,
        health: cell.health
      }))
    };

    let blob;
    const filename = `simulation_${mode}.${format}`;

    if (format === 'json') {
      blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    } else if (format === 'csv') {
      const csv = ["id,moisture,health"];
      for (const cell of data.fieldSnapshot) {
        csv.push(`${cell.id},${cell.moisture},${cell.health}`);
      }
      csv.push(`\nTotal Water Used,${sim.waterUsed}`);
      blob = new Blob([csv.join("\n")], { type: "text/csv" });
    }

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  }

  function showMode(mode) {
    const ai = document.getElementById('aiSim');
    const trad = document.getElementById('traditionalSim');

    if (mode === 'both') {
      ai.style.display = 'block';
      trad.style.display = 'block';
    } else if (mode === 'ai') {
      ai.style.display = 'block';
      trad.style.display = 'none';
    } else {
      ai.style.display = 'none';
      trad.style.display = 'block';
    }
  }

  // Expose to HTML
  window.startSimulation = startSimulation;
  window.stopSimulation = stopSimulation;
  window.stepSimulation = stepSimulation;
  window.resetSimulation = resetSimulation;
  window.downloadData = downloadData;
  window.showMode = showMode;

  // Initial setup
  initField('ai');
  initField('traditional');
  updateDisplay('ai');
  updateDisplay('traditional');
  showMode('ai');
});
