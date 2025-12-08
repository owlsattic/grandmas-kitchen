
(function() {
  const household = document.getElementById('sp-household');
  const waste = document.getElementById('sp-waste');
  const householdValue = document.getElementById('sp-household-value');
  const wasteValue = document.getElementById('sp-waste-value');
  const savingsEstimate = document.getElementById('sp-savings-estimate');
  const yearSpan = document.getElementById('sp-year');

  function update() {
    const h = Number(household.value || 0);
    const w = Number(waste.value || 0);
    householdValue.textContent = h.toString();
    wasteValue.textContent = w.toString();
    const weekly = Math.round(w * 0.8);
    savingsEstimate.textContent = weekly.toString();
  }

  if (household && waste) {
    household.addEventListener('input', update);
    waste.addEventListener('input', update);
    update();
  }

  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear().toString();
  }
})();
