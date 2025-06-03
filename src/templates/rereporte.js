module.exports = (compras) => {


   return `

   <!DOCTYPE html>
   <html lang="es-MX">
   
   <head>
     <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
     <meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
      <title>Reporte reimpresion</title>
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
            <th><strong>Fecha Corte: ${compras[0].fecha_venta_cierre_caja} </strong></th>
      </table>
   </div>

   <div class="content-detalle-corte">
       <div id="detalle-sucursal">

           <table>
               <th>Cajero(a): ${compras[0].nombre_completo_usuario}</th>
               <th>El Pollo Rico "${compras[0].nombre_sucursal}"</th>
               <th>Dirección: ${compras[0].direccion} </th>
               <th>Telefóno: ${compras[0].numero_tel}</th>
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
         <td>$${element.precio_total / element.cantidad_total}.00</td>
         <td>${element.cantidad_total}</td>
         <td>$${element.precio_total}.00</td>
     </tr>`
   )}
       </table>

       <div class="content-total-reporte">
       <br></br>
       <table> 
           <th>Inicio caja: $${compras[0].inicio_caja}.00</th>
           <th>Efectivo: $${compras[0].total_efectivo}.00</th>
           <th>Diferencia: $${compras[0].diferencia >= 1 ? "+" + compras[0].diferencia :  compras[0].diferencia < 0 ? compras[0].diferencia : "0"}.00</th>
           <th>Total: $${compras[0].total_venta_periodo}.00</th>
           </table>
       </div>

   </div>

</div>



   </body>
</html>




`;

};