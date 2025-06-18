const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const generarReportePDF = async (data, nombreArchivo) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Generar HTML dinámico del reporte
  const htmlContent = `
  <!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>BIG EGO GYM - Reporte de Flujo de Caja</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      background-color: #f4f6f8;
      color: #333;
    }

    header {
      background-color: #000;
      color: #fff;
      padding: 20px 40px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    header img {
      height: 60px;
    }

    header h1 {
      font-size: 2rem;
      text-transform: uppercase;
      margin: 0;
    }

    .container {
      padding: 40px;
    }

    .title {
      color: #007bff;
      margin-bottom: 20px;
      text-transform: uppercase;
    }

    .section {
      background-color: #fff;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .section h2 {
      color: #444;
      border-bottom: 2px solid #007bff;
      padding-bottom: 8px;
    }

    ul {
      padding-left: 20px;
    }

    ul li {
      margin: 6px 0;
    }
  </style>
</head>
<body>

  <header>
    <h1>BIG EGO GYM</h1>
    <img src="https://res.cloudinary.com/ddkofntrk/image/upload/v1750186975/logo_i3hofm.png" alt="Logo del gimnasio">
  </header>

  <div class="container">
    <h2 class="title">Reporte de Flujo de Caja ${data.tipo}</h2>
    <h4 class="date">${data.date}</h4>
    <h4 class="date">Responsable: ${data.responsable} - tel:${data.telefono}</h4>

    <div class="section">
      <h2>Totales</h2>
      <p><strong>Ingresos:</strong> $${data.ingresos}</p>
      <p><strong>Gastos:</strong> $${data.gastos}</p>
      <p><strong>Ventas de productos:</strong> $${data.productos}</p>
      <p><strong>Ventas de membresías:</strong> $${data.membresias}</p>
      <p><strong>Flujo de caja:</strong> $${data.flujoCaja}</p>
    </div>

    <div class="section">
      <h2>Frecuencia de asistencia por horas</h2>
      <ul>
        ${data.checkIns.map(item => `<li><strong>${item.hora}:</strong> ${item.total} asistencias</li>`).join('')}
      </ul>
    </div>
  </div>

</body>
</html>

  `;

  await page.setContent(htmlContent);
  const pdfPath = path.join(__dirname, `../reportes/${nombreArchivo}.pdf`);

  await page.pdf({ path: pdfPath, format: 'A4' });
  await browser.close();

  return pdfPath;
};

module.exports = {
  generarReportePDF
};
