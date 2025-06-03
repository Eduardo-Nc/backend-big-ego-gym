

module.exports = (compras, datos, HoraActual) => {

    let totalFactura = compras.reduce((sum, value) => (typeof value.precio_total == "number" ? sum + value.precio_total : sum), 0);

    console.log("LLEGO AL PDF REPORTE")

    // console.log(compras)
    // console.log(datos)
    // console.log(HoraActual)
    // console.log(totalFactura)

    return `

   <!DOCTYPE html>
   <html lang="es-MX">
   
   <head>
     <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
     <meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
      <title>Reporte</title>
      <style>

         
      .content-all-pdf{
         font-family:arial;
         margin-top:80px;
         border-top: 1px solid black;
         display:flex;
         flex-flow: column nowrap;
         width: 100%;
         height: 100vh;
         text-transform: capitalize;
         font-weight: normal;
     }
     
     #fecha-factura table{
         width: 100%;
         display: flex;
         margin-top:10px;
         justify-content:flex-end;
         align-items:left;
         
     }
     
     #fecha-factura strong{
         font-size: 20px;
         font-weight: normal;
     }
     
     #detalle-sucursal{
         width: 100%;
         margin-top:30px;
         display: flex;
         justify-content:center;
         align-items:center;
     }
     
     #detalle-sucursal table{
        width: 100%;
      
     }
     
     #detalle-sucursal table th{
         paddign:10px;
         font-weight: normal;
         font-size: 20px;
         text-align: center;
         
     }
     
     #reporte{
         color:red;
     }
     
     #reporte strong{
         
         font-size: 22px;
     }
     
     
     #detalles-reporte{
         margin-top:40px;
         width: 100%;
     }
     
     #detalles-reporte th{
             paddign:10px;
             font-size: 17px;
             text-align: center;
     }

     #detalles-reporte td{
      paddign:8px;
      font-size: 17px;
      text-align: center;
}
     
     .content-total-reporte table{
         width: 100%;
         margin-top:35px;
         display: flex;
         justify-content:flex-end;
         align-items:left;   
         font-weight: bold;
         font-size: 21px;
         
         
     
     }
      


      </style>
   </head>
   <body>


   <div class="content-all-pdf">
   
   <div id="fecha-factura">
      <table>
            <th><strong>Fecha Corte: ${HoraActual} </strong></th>
      </table>
   </div>

   <div class="content-detalle-corte">
       <div id="detalle-sucursal">

           <table>
               <th>Cajero(a): ${datos.nomu}</th>
               <th>El Pollo Rico "${datos.noms}"</th>
               <th>Dirección: ${datos.direc} </th>
               <th>Telefóno: ${datos.tel}</th>
               <th id="reporte"> <strong>Reporte venta</strong></th>
           </table>

       </div>

       <table id="detalles-reporte">
           <tr>
               <th>Nombre producto</th>
               <th>Precio Unitario</th>
               <th>cantidad</th>
               <th>Totales</th>
           </tr>

           ${compras.map(element =>
        `<tr>
         <td>${element.nombre_producto}</td>
         <td>$${element.precio}.00</td>
         <td>${element.cantidad_total}</td>
         <td>$${element.precio_total}.00</td>
     </tr>`
    )}
       </table>

       <div class="content-total-reporte">
       <br></br>
       <table> 
           <th>Inicio caja: $${datos.inicaja}.00</th>
           <th>Efectivo: $${datos.toefec}.00</th>
           <th>Diferencia: $${datos.dif >= 1 ? "+" + datos.dif : datos.dif < 0 ? datos.dif : "0"}.00</th>
           <th>Total: $${totalFactura}.00</th>
           </table>
       </div>

   </div>

</div>



   </body>
</html>




`;

};