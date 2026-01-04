const steps = document.querySelectorAll(".step");
const nextBtns = document.querySelectorAll(".next");
const prevBtns = document.querySelectorAll(".prev");
const progressBar = document.getElementById("progressBar");

let currentStep = 0;

function updateProgress(index) {
  const progress = ((index + 1) / steps.length) * 100;
  progressBar.style.width = progress + "%";
}

function showStep(index) {
  steps.forEach((step, i) => {
    step.classList.toggle("active", i === index);
  });
  updateProgress(index);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

nextBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const currentSection = steps[currentStep];

    // USAR NUESTRA VALIDACIÓN CUSTOM
    if (validateStep(currentSection)) {
      if (currentStep < steps.length - 1) {
        currentStep++;
        showStep(currentStep);
      }
    }
  });
});

prevBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (currentStep > 0) {
      currentStep--;
      showStep(currentStep);
    }
  });
});

// Inicializar
updateProgress(0);
