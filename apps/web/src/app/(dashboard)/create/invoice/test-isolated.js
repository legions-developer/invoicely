console.clear();
console.log('Testing isolated solution with DOM manipulation...');

document.querySelectorAll('button[aria-expanded]').forEach(button => {
  button.addEventListener('click', () => {
    const timestamp = Date.now();
    console.log(`=== ACCORDION TOGGLE at ${timestamp} ===`);
    console.log(`Clicked: ${button.textContent.trim()}`);
    
    setTimeout(() => {
      console.log(`=== CHECKING FOR RENDERS AFTER ACCORDION TOGGLE (${timestamp}) ===`);
      console.log('InvoicePreviewIsolated render count:', window.renderCounts?.InvoicePreviewIsolated || 0);
    }, 2000);
  });
});

window.renderCounts = {
  InvoicePreviewIsolated: 0
};

const originalLog = console.log;
console.log = function(...args) {
  if (typeof args[0] === 'string') {
    if (args[0].includes('InvoicePreviewIsolated rendering')) {
      window.renderCounts.InvoicePreviewIsolated++;
    }
  }
  originalLog.apply(console, args);
};

console.log('Click on accordion buttons to test re-renders');
