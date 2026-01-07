const form = document.getElementById("formRCD");
const loader = document.getElementById("loader");
const loaderText = document.getElementById("loaderText");
const spinner = document.getElementById("spinner");
const resetFormBtn = document.getElementById("resetFormBtn");

const BACKEND_URL =
  "https://script.google.com/macros/s/AKfycbxDIU-oVuIWzVvnkFJMZUS0-Z43DaVmqIBPY-jA3Jj30Vfz-WHrDT8FvRQZL5kLGdGzGA/exec";

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Validar último paso antes de enviar
  const lastStep = document.querySelector('.step[data-step="3"]');
  if (!validateStep(lastStep)) return;

  try {
    const formData = new FormData(form);

    // Preparar UI
    loader.classList.remove("hidden");
    spinner.classList.remove("hidden");
    resetFormBtn.classList.add("hidden");
    loaderText.textContent = "Enviando información...";
    loaderText.style.color = "black";

    // Procesar archivos
    const infoViajesFile = formData.get("info_viajes");
    const valesFile = formData.get("vales_escaneados");
    const infoViajesBase64 = await fileToBase64(infoViajesFile);
    const valesBase64 = await fileToBase64(valesFile);

    // Construir Objeto
    const data = {
      correo_adicional: formData.get("correo_adicional"),
      autorizacion_datos: !!formData.get("autorizacion_datos"),
      empresa_generadora: formData.get("empresa_generadora"),
      nit_generadora: formData.get("nit_generadora"),
      correo_certificado_generadora: formData.get(
        "correo_certificado_generadora"
      ),
      obra_identificacion: formData.get("obra_identificacion"),
      pin_ambiental: formData.get("pin_ambiental"),
      direccion_obra: formData.get("direccion_obra"),
      contacto_nombre_obra: formData.get("contacto_nombre_obra"),
      contacto_telefono_obra: formData.get("contacto_telefono_obra"),
      cantidad_vales: formData.get("cantidad_vales"),
      fecha_desde: formData.get("fecha_desde"),
      fecha_hasta: formData.get("fecha_hasta"),
      contrato_idu: formData.get("contrato_idu") || "No",
      numero_contrato_idu: formData.get("numero_contrato_idu") || "N/A",

      info_viajes: {
        nombre: infoViajesFile.name,
        mimeType: infoViajesFile.type,
        base64: infoViajesBase64,
      },
      vales_escaneados: {
        nombre: valesFile.name,
        mimeType: valesFile.type,
        base64: valesBase64,
      },

      requiere_anexo_ii: formData.get("requiere_anexo_ii") || "No",
      anexo_ii_info: formData.get("anexo_ii_info"),
      representante_legal: formData.get("representante_legal"),
      direccion_domicilio: formData.get("direccion_domicilio"),
      telefono: formData.get("telefono"),
      correo: formData.get("correo"),
      direccion_generacion_rcd: formData.get("direccion_generacion_rcd"),
      observaciones: formData.get("observaciones"),
    };

    const response = await fetch(BACKEND_URL, {
      method: "POST",
      body: JSON.stringify(data),
    });

    const res = await response.json();

    if (res.success) {
      spinner.classList.add("hidden");
      loaderText.textContent = "✅ ¡Solicitud enviada con éxito!";
      loaderText.style.color = "green";
      resetFormBtn.classList.remove("hidden");
      form.reset(); // Limpiar formulario detrás
    } else {
      throw new Error("El servidor respondió con un error.");
    }
  } catch (err) {
    spinner.classList.add("hidden");
    loaderText.textContent = "❌ Error: " + err.message;
    loaderText.style.color = "red";
    resetFormBtn.classList.remove("hidden");
  }
});

resetFormBtn.addEventListener("click", () => {
  loader.classList.add("hidden");
  // Reiniciar a paso 1
  currentStep = 0;
  showStep(0);
  form.reset();
  // Limpiar errores visuales
  document
    .querySelectorAll(".input-error")
    .forEach((el) => el.classList.remove("input-error"));
  document
    .querySelectorAll(".error-msg.active")
    .forEach((el) => el.classList.remove("active"));
});

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
