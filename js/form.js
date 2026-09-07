const form = document.getElementById("formRCD");
const loader = document.getElementById("loader");
const loaderText = document.getElementById("loaderText");
const spinner = document.getElementById("spinner");
const resetFormBtn = document.getElementById("resetFormBtn");

//const BACKEND_URL =
//"https://script.google.com/macros/s/AKfycbxDIU-oVuIWzVvnkFJMZUS0-Z43DaVmqIBPY-jA3Jj30Vfz-WHrDT8FvRQZL5kLGdGzGA/exec";

const BACKEND_URL =
  "https://script.google.com/macros/s/AKfycbx-0cMl3EMNgl_ALuHITbBnqJWqAy277CZ1RGHp7QUE72MfhsGlgdgQkeE8216ySIqkuw/exec";

// --- FUNCIÓN PARA SUBIDA RESUMIBLE (ELIMINA EL LÍMITE DE 50MB) ---
async function uploadFileResumable(file, folderId, accessToken) {
  const metadata = {
    name: file.name,
    mimeType: file.type,
    parents: [folderId],
  };

  // 1. Iniciar sesión de subida
  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable",
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + accessToken,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": file.type,
        "X-Upload-Content-Length": file.size,
      },
      body: JSON.stringify(metadata),
    },
  );

  if (!response.ok) throw new Error("No se pudo iniciar la subida a Drive");

  const location = response.headers.get("Location");

  // 2. Subir el archivo binario
  const uploadResponse = await fetch(location, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!uploadResponse.ok) throw new Error("Fallo al subir el archivo");

  const result = await uploadResponse.json();
  return `https://drive.google.com/file/d/${result.id}/view`;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const lastStep = document.querySelector('.step[data-step="3"]');
  if (!validateStep(lastStep)) return;

  try {
    // Preparar UI
    loader.classList.remove("hidden");
    spinner.classList.remove("hidden");
    resetFormBtn.classList.add("hidden");
    loaderText.textContent = "Obteniendo autorización...";
    loaderText.style.color = "black";

    // 1. Obtener Token de Acceso desde el Backend (doGet)
    const authRes = await fetch(`${BACKEND_URL}?action=getToken`);
    const authData = await authRes.json();
    const { token, folderId } = authData;

    const formData = new FormData(form);
    const infoViajesFile = formData.get("info_viajes");
    const valesFile = formData.get("vales_escaneados");

    let infoViajesUrl = "";
    let valesUrl = "";

    // 2. Subir Archivos Directamente a Drive
    if (infoViajesFile && infoViajesFile.size > 0) {
      loaderText.textContent = "Subiendo archivo de viajes...";
      infoViajesUrl = await uploadFileResumable(
        infoViajesFile,
        folderId,
        token,
      );
    }

    if (valesFile && valesFile.size > 0) {
      loaderText.textContent =
        "Subiendo vales escaneados (esto puede tardar)...";
      valesUrl = await uploadFileResumable(valesFile, folderId, token);
    }

    // 3. Construir Objeto final (Solo texto y links)
    loaderText.textContent = "Registrando solicitud en el sistema...";
    const data = {
      correo_adicional: formData.get("correo_adicional"),
      autorizacion_datos: !!formData.get("autorizacion_datos"),
      empresa_generadora: formData.get("empresa_generadora"),
      nit_generadora: formData.get("nit_generadora"),
      correo_certificado_generadora: formData.get(
        "correo_certificado_generadora",
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

      // Links y nombres para el backend
      info_viajes_url: infoViajesUrl,
      info_viajes_nombre: infoViajesFile.name,
      vales_url: valesUrl,
      vales_escaneados_nombre: valesFile.name,

      requiere_anexo_ii: formData.get("requiere_anexo_ii") || "No",
      anexo_ii_info: formData.get("anexo_ii_info"),
      representante_legal: formData.get("representante_legal"),
      direccion_domicilio: formData.get("direccion_domicilio"),
      telefono: formData.get("telefono"),
      correo: formData.get("correo"),
      direccion_generacion_rcd: formData.get("direccion_generacion_rcd"),
      observaciones: formData.get("observaciones"),
    };

    // 4. Enviar datos al doPost (ahora la carga es mínima)
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
      form.reset();
    } else {
      throw new Error(res.message || "Error en el servidor");
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
