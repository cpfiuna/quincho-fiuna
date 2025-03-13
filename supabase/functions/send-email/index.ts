
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: 'new-reservation' | 'confirmation' | 'modification' | 'cancellation';
  recipient: string;
  reservation: any;
  changes?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const emailData: EmailRequest = await req.json();
    const { type, recipient, reservation } = emailData;
    
    console.log(`Processing ${type} email to ${recipient} for reservation ${reservation.id}`);
    
    // In a production environment, this would connect to an email service
    // For now, we'll just log the email content and return a success response
    
    let emailSubject = '';
    let emailContent = '';
    
    switch (type) {
      case 'confirmation':
        emailSubject = 'Confirmación de reserva del Quincho FIUNA';
        emailContent = `
          <h1>Reserva Confirmada</h1>
          <p>Hola ${reservation.responsable},</p>
          <p>Tu reserva ha sido confirmada con los siguientes detalles:</p>
          <ul>
            <li>Fecha: ${reservation.fecha}</li>
            <li>Hora: ${reservation.horaInicio} - ${reservation.horaFin}</li>
            <li>Motivo: ${reservation.motivo}</li>
            <li>Cantidad de personas: ${reservation.cantidadPersonas}</li>
          </ul>
          <p>Si necesitas hacer cambios, por favor contacta al administrador.</p>
          <p>¡Gracias por usar el sistema de reservas del Quincho FIUNA!</p>
        `;
        break;
      
      case 'cancellation':
        emailSubject = 'Cancelación de reserva del Quincho FIUNA';
        emailContent = `
          <h1>Reserva Cancelada</h1>
          <p>Hola ${reservation.responsable},</p>
          <p>Tu reserva ha sido cancelada:</p>
          <ul>
            <li>Fecha: ${reservation.fecha}</li>
            <li>Hora: ${reservation.horaInicio} - ${reservation.horaFin}</li>
            <li>Motivo: ${reservation.motivo}</li>
          </ul>
          <p>Motivo de cancelación: ${reservation.cancellationReason || 'No especificado'}</p>
          <p>Si tienes alguna pregunta, por favor contacta al administrador.</p>
          <p>¡Gracias por usar el sistema de reservas del Quincho FIUNA!</p>
        `;
        break;
      
      case 'new-reservation':
        emailSubject = 'Nueva reserva en el Quincho FIUNA';
        emailContent = `
          <h1>Nueva Reserva</h1>
          <p>Se ha realizado una nueva reserva con los siguientes detalles:</p>
          <ul>
            <li>Responsable: ${reservation.responsable}</li>
            <li>Email: ${reservation.email}</li>
            <li>Fecha: ${reservation.fecha}</li>
            <li>Hora: ${reservation.horaInicio} - ${reservation.horaFin}</li>
            <li>Motivo: ${reservation.motivo}</li>
            <li>Cantidad de personas: ${reservation.cantidadPersonas}</li>
          </ul>
          <p>Accede al panel de administración para ver más detalles.</p>
        `;
        break;
      
      case 'modification':
        emailSubject = 'Modificación de reserva del Quincho FIUNA';
        emailContent = `
          <h1>Reserva Modificada</h1>
          <p>Hola ${reservation.responsable},</p>
          <p>Tu reserva ha sido modificada con los siguientes detalles:</p>
          <ul>
            <li>Fecha: ${reservation.fecha}</li>
            <li>Hora: ${reservation.horaInicio} - ${reservation.horaFin}</li>
            <li>Motivo: ${reservation.motivo}</li>
            <li>Cantidad de personas: ${reservation.cantidadPersonas}</li>
          </ul>
          <p>Cambios realizados: ${emailData.changes || 'No especificados'}</p>
          <p>Si tienes alguna pregunta, por favor contacta al administrador.</p>
          <p>¡Gracias por usar el sistema de reservas del Quincho FIUNA!</p>
        `;
        break;
    }
    
    console.log('Email would be sent with subject:', emailSubject);
    console.log('Email content:', emailContent);
    console.log('To:', recipient);
    
    // In production, this is where you would call an email service API
    // For example: SendGrid, AWS SES, Resend, etc.
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email would be sent in production environment"
      }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Error processing email request:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
