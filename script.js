// Variables globales
let Tf = 10;
let Td = 40;
let T = 60;
let Q = 10;  // Caudal en L/min
let P = 0;   // Potencia en kW
let V = 50;  // Volumen en L (NUEVA VARIABLE)
let currentSlide = 1;
let totalSlides = 7;
let simulationRunning = false;
let simulationTime = 0;
let simulationInterval = null;
let totalEnergy = 0; // Energía consumida en kWh
let totalWaterUsed = 0; // Agua usada en litros

// Constantes físicas
const rho_c = 4.186;   // Capacidad calorífica en kJ/(L·°C)

// Sistema de navegación
function nextSlide() {
    if (currentSlide < totalSlides) {
        document.getElementById('slide' + currentSlide).classList.remove('active');
        currentSlide++;
        document.getElementById('slide' + currentSlide).classList.add('active');
        updateSlideIndicator();
        updateCalculations();
    }
}

function prevSlide() {
    if (currentSlide > 1) {
        document.getElementById('slide' + currentSlide).classList.remove('active');
        currentSlide--;
        document.getElementById('slide' + currentSlide).classList.add('active');
        updateSlideIndicator();
        updateCalculations();
    }
}

function goToSlide(n) {
    document.getElementById('slide' + currentSlide).classList.remove('active');
    currentSlide = n;
    document.getElementById('slide' + currentSlide).classList.add('active');
    updateSlideIndicator();
    updateCalculations();
}

function restartTour() {
    goToSlide(1);
}

function updateSlideIndicator() {
    const indicator = document.getElementById('slideIndicator');
    indicator.innerHTML = '';
    for (let i = 1; i <= totalSlides; i++) {
        const dot = document.createElement('div');
        dot.className = 'indicator-dot' + (i === currentSlide ? ' active' : '');
        dot.onclick = () => goToSlide(i);
        indicator.appendChild(dot);
    }
}

// Sistema de cálculo con VOLUMEN - CORREGIDO
function updateCalculations() {
    // Obtener valores actuales
    Tf = parseFloat(document.getElementById('tempCold').value);
    Td = parseFloat(document.getElementById('tempShower').value);
    T = parseFloat(document.getElementById('tempTank').value);
    Q = parseFloat(document.getElementById('flowRate').value);
    P = parseFloat(document.getElementById('heaterPower').value);
    V = parseFloat(document.getElementById('tankVolume').value);
    
    // Actualizar displays
    document.getElementById('tempColdValue').textContent = Tf + '°C';
    document.getElementById('tempShowerValue').textContent = Td + '°C';
    document.getElementById('tempTankValue').textContent = T + '°C';
    document.getElementById('flowRateValue').textContent = Q.toFixed(1) + ' L/min';
    document.getElementById('heaterPowerValue').textContent = P.toFixed(1) + ' kW';
    document.getElementById('tankVolumeValue').textContent = V + ' L';
    
    // Actualizar resumen
    document.getElementById('summaryTf').textContent = Tf;
    document.getElementById('summaryTd').textContent = Td;
    document.getElementById('summaryT0').textContent = T;
    document.getElementById('summaryQ').textContent = Q.toFixed(1);
    document.getElementById('summaryP').textContent = P.toFixed(1);
    document.getElementById('summaryV').textContent = V;
    
    // --- CÁLCULOS DIAPOSITIVA 3 (CORREGIDOS) ---
    // Calcular proporción con protección contra división por cero
    let proportion;
    if (Math.abs(T - Tf) < 0.001) {
        proportion = 0;
    } else {
        proportion = (Td - Tf) / (T - Tf);
    }
    proportion = Math.max(0, Math.min(1, proportion)); // Limitar entre 0 y 1
    
    // Actualizar elementos de la diapositiva 3
    document.getElementById('proportionFormulaDisplay').innerHTML = 
        `f(${T}) = (${Td} - ${Tf}) / (${T} - ${Tf}) = ${(Td-Tf).toFixed(1)} / ${(T-Tf).toFixed(1)} = ${proportion.toFixed(3)}`;
    
    document.getElementById('slide3ProportionValue').textContent = proportion.toFixed(3);
    document.getElementById('slide3CurrentFlow').textContent = Q.toFixed(1);
    
    // Calcular flujos de agua
    const hotWaterFlow = Q * proportion;
    const coldWaterFlow = Q * (1 - proportion);
    document.getElementById('slide3HotWaterFlow').textContent = hotWaterFlow.toFixed(2);
    document.getElementById('slide3ColdWaterFlow').textContent = coldWaterFlow.toFixed(2);
    
    // --- CÁLCULOS ENERGÉTICOS (CORREGIDOS) ---
    // 1. Pérdida de energía por ducha
    const energyLossPerMin = Q * rho_c * (Td - Tf); // kJ/min
    const lossRate = -(Q * (Td - Tf)) / V; // °C/min (¡Ahora depende de V!)
    
    // 2. Ganancia de energía por resistencia (CORRECTO: P kW = P kJ/s = P*60 kJ/min)
    const energyGainPerMin = P * 60; // kJ/min
    const gainRate = (P * 60) / (rho_c * V); // °C/min (¡Ahora depende de V!)
    
    // 3. Tasa neta
    const netRate = lossRate + gainRate; // °C/min
    
    // Actualizar balance de energía
    document.getElementById('energyLoss').textContent = energyLossPerMin.toFixed(1);
    document.getElementById('energyGain').textContent = energyGainPerMin.toFixed(1);
    document.getElementById('energyLossRate').textContent = lossRate.toFixed(2);
    document.getElementById('energyGainRate').textContent = gainRate.toFixed(2);
    document.getElementById('netRate').textContent = netRate.toFixed(2);
    
    // Actualizar valores de volumen y tasa neta
    document.getElementById('currentV').textContent = V;
    document.getElementById('currentNetRate').textContent = netRate.toFixed(2);
    document.getElementById('currentV2').textContent = V;
    document.getElementById('currentNetRate2').textContent = netRate.toFixed(2);
    
    // Actualizar estado del balance
    let balanceState = '';
    if (netRate < -0.01) {
        balanceState = 'Pérdida > Ganancia → El depósito se enfría';
    } else if (netRate > 0.01) {
        balanceState = 'Ganancia > Pérdida → El depósito se calienta';
    } else {
        balanceState = '¡Equilibrio perfecto! Temperatura constante';
    }
    document.getElementById('balanceState').textContent = balanceState;
    
    // --- CÁLCULOS DE EQUILIBRIO (NO dependen de V) ---
    const P_equilibrium = (Q * (Td - Tf) * rho_c) / 60;
    const Q_max = (P * 60) / ((Td - Tf) * rho_c);
    
    document.getElementById('Q_eq').textContent = Q.toFixed(1);
    document.getElementById('Td_eq').textContent = Td;
    document.getElementById('Tf_eq').textContent = Tf;
    document.getElementById('Q_TdTf').textContent = (Q * (Td - Tf)).toFixed(1);
    document.getElementById('P_eq_calc').textContent = (Q * (Td - Tf) * rho_c).toFixed(1);
    document.getElementById('P_eq_result').textContent = P_equilibrium.toFixed(2);
    document.getElementById('Q_max').textContent = Q_max.toFixed(2);
    
    // Calcular tiempo hasta T = Td
    const timeToEquilibrium = (Td - T) / netRate;
    if (timeToEquilibrium > 0 && timeToEquilibrium < 1000) {
        document.getElementById('timeToEquilibrium').textContent = Math.abs(timeToEquilibrium).toFixed(2);
    } else {
        document.getElementById('timeToEquilibrium').textContent = "∞";
    }
    
    // --- EXPERIMENTOS DIAPOSITIVA 7 ---
    // Experimento 1
    const lossRateOriginal = -(10 * (40 - 10)) / 50;
    const lossRateDoubleV = -(10 * (40 - 10)) / 100;
    document.getElementById('exp1Result').textContent = 
        `dT/dt: ${lossRateOriginal.toFixed(2)} → ${lossRateDoubleV.toFixed(2)} °C/min`;
    
    // Experimento 2
    const Peq_Q5 = (5 * (40 - 10) * rho_c) / 60;
    document.getElementById('exp2Result').textContent = 
        `Pequilibrio = ${Peq_Q5.toFixed(2)} kW (no cambia con V)`;
    
    // Experimento 3
    const timeForBigTank = (40 - 80) / (-(10 * (40 - 10)) / 150);
    document.getElementById('exp3Result').textContent = 
        `Dura ≈ ${timeForBigTank.toFixed(1)} minutos`;
    
    // Actualizar simulación si está en esa diapositiva
    if (currentSlide === 6) {
        updateSimulationDisplay();
    }
}

// Sistema de simulación con VOLUMEN
function updateSimulationDisplay() {
    // Calcular tasas actuales (con V)
    const lossRate = -(Q * (Td - Tf)) / V;
    const gainRate = (P * 60) / (rho_c * V);
    const netRate = lossRate + gainRate;
    
    // Calcular temperatura actual en la simulación
    let currentTemp = T + netRate * simulationTime;
    currentTemp = Math.max(Td, Math.min(100, currentTemp)); // Limitar entre Td y 100°C
    
    // Calcular progreso para la barra
    let progress;
    if (netRate < 0) {
        // Enfriamiento
        progress = Math.max(0, Math.min(100, (currentTemp - Td) / (T - Td) * 100));
    } else if (netRate > 0) {
        // Calentamiento
        progress = Math.max(0, Math.min(100, (currentTemp - Td) / (100 - Td) * 100));
    } else {
        // Equilibrio
        progress = 50;
    }
    
    // Calcular energía consumida y agua usada
    const energyConsumed = (P * simulationTime) / 60; // kWh
    const waterUsed = Q * simulationTime; // Litros
    
    // Actualizar display
    document.getElementById('temperatureFill').style.width = progress + '%';
    document.getElementById('currentTempLabel').textContent = currentTemp.toFixed(1) + '°C';
    document.getElementById('timeDisplay').textContent = simulationTime.toFixed(2);
    document.getElementById('currentHeaterPower').textContent = P.toFixed(1);
    document.getElementById('currentFlowRate').textContent = Q.toFixed(1);
    document.getElementById('currentTankVolume').textContent = V.toFixed(1);
    document.getElementById('coolingRate').textContent = netRate.toFixed(2);
    document.getElementById('energyConsumed').textContent = energyConsumed.toFixed(2);
    document.getElementById('waterUsed').textContent = waterUsed.toFixed(1);
    
    // Calcular proporción actual
    const proportion = (Td - Tf) / (currentTemp - Tf);
    document.getElementById('currentProportion').textContent = proportion.toFixed(3);
    
    // Actualizar estado
    let state = '';
    if (netRate < -0.01) {
        state = `Depósito a ${currentTemp.toFixed(1)}°C, enfriándose a ${Math.abs(netRate).toFixed(2)}°C/min`;
    } else if (netRate > 0.01) {
        state = `Depósito a ${currentTemp.toFixed(1)}°C, calentándose a ${netRate.toFixed(2)}°C/min`;
    } else {
        state = `Depósito a ${currentTemp.toFixed(1)}°C, temperatura constante`;
    }
    document.getElementById('simulationState').textContent = state;
    
    // Actualizar tabla
    updateSimulationTable();
}

function updateSimulationTable() {
    const tableBody = document.getElementById('simulationTable');
    tableBody.innerHTML = '';
    
    const lossRate = -(Q * (Td - Tf)) / V;
    const gainRate = (P * 60) / (rho_c * V);
    const netRate = lossRate + gainRate;
    
    // Generar puntos de tiempo
    const steps = 10;
    const maxTime = Math.min(30, Math.abs((Td - T) / netRate) * 1.5); // Ajustar según la tasa
    
    for (let i = 0; i <= steps; i++) {
        const t = (maxTime / steps) * i;
        let currentTemp = T + netRate * t;
        currentTemp = Math.max(Td, Math.min(100, currentTemp));
        
        // Solo mostrar si la temperatura es válida
        if (currentTemp >= Td) {
            const proportion = (Td - Tf) / (currentTemp - Tf);
            
            let state = '';
            if (netRate < -0.01) {
                state = '📉 Enfriándose';
            } else if (netRate > 0.01) {
                state = '📈 Calentándose';
            } else {
                state = '⚖️ Equilibrio';
            }
            
            const row = document.createElement('tr');
            if (Math.abs(t - simulationTime) < 0.1) {
                row.classList.add('highlight');
            }
            
            row.innerHTML = `
                <td>${t.toFixed(2)}</td>
                <td>${currentTemp.toFixed(1)}</td>
                <td>${proportion.toFixed(3)}</td>
                <td>${netRate.toFixed(2)}</td>
                <td>${state}</td>
            `;
            
            tableBody.appendChild(row);
        }
    }
}

function toggleSimulation() {
    if (simulationRunning) {
        pauseSimulation();
    } else {
        startSimulation();
    }
}

function startSimulation() {
    simulationRunning = true;
    document.getElementById('simButton').textContent = '⏸️ Pausar simulación';
    
    simulationInterval = setInterval(() => {
        simulationTime += 0.1;
        updateSimulationDisplay();
        
        // Detener si la temperatura llega a Td (enfriamiento) o 100°C (calentamiento)
        const lossRate = -(Q * (Td - Tf)) / V;
        const gainRate = (P * 60) / (rho_c * V);
        const netRate = lossRate + gainRate;
        let currentTemp = T + netRate * simulationTime;
        
        if ((netRate < 0 && currentTemp <= Td) || (netRate > 0 && currentTemp >= 100)) {
            pauseSimulation();
        }
    }, 200);
}

function pauseSimulation() {
    simulationRunning = false;
    document.getElementById('simButton').textContent = '▶️ Reanudar simulación';
    clearInterval(simulationInterval);
}

function resetSimulation() {
    simulationTime = 0;
    totalEnergy = 0;
    totalWaterUsed = 0;
    updateSimulationDisplay();
    if (simulationRunning) {
        pauseSimulation();
        document.getElementById('simButton').textContent = '▶️ Iniciar simulación';
    }
}

function stepSimulation() {
    simulationTime += 1.0;
    updateSimulationDisplay();
}

function fastForward() {
    simulationTime += 5.0;
    updateSimulationDisplay();
}

// Configurar eventos
document.querySelectorAll('input[type="range"]').forEach(slider => {
    slider.addEventListener('input', function() {
        const valueDisplay = this.parentElement.querySelector('.value-display');
        if (valueDisplay) {
            if (this.id === 'heaterPower') {
                valueDisplay.textContent = this.value + ' kW';
            } else if (this.id === 'flowRate') {
                valueDisplay.textContent = this.value + ' L/min';
            } else if (this.id === 'tankVolume') {
                valueDisplay.textContent = this.value + ' L';
            } else {
                valueDisplay.textContent = this.value + '°C';
            }
        }
        updateCalculations();
    });
});

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    updateSlideIndicator();
    updateCalculations();
});