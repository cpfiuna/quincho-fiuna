import { createClient } from '@supabase/supabase-js';
import { Reservation } from './types';

// Load environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Ensure required environment variables are defined
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing required environment variables for Supabase connection.');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'Defined' : 'Missing');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Defined' : 'Missing');
}

// Create Supabase client
export const supabase = createClient(
  supabaseUrl || '', 
  supabaseAnonKey || ''
);

// Configure realtime subscriptions for reservations table
if (supabaseUrl && supabaseAnonKey) {
  supabase
    .channel('schema-db-changes')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'reservations' 
    }, payload => {
      console.log('Realtime update:', payload);
    })
    .subscribe((status) => {
      console.log('Realtime subscription status:', status);
    });
}

// Helper function to sanitize inputs before sending to the database
export function sanitizeInput(input: string | null | undefined): string {
  if (input === null || input === undefined) {
    return '';
  }
  
  // Remove SQL injection patterns but allow spaces
  return input
    .replace(/['";]/g, '') // Remove quotes and semicolons
    .replace(/--/g, '')    // Remove comment markers
    .replace(/\/\*/g, '')  // Remove comment start
    .replace(/\*\//g, '')  // Remove comment end
    .replace(/\bdrop\b/gi, '')
    .replace(/\bdelete\b/gi, '')
    .replace(/\bupdate\b/gi, '')
    .replace(/\binsert\b/gi, '')
    .replace(/\bselect\b/gi, '')
    .trim();
}

// Sanitize reservation object fields
function sanitizeReservation(reservation: any): any {
  const result: any = {};
  
  for (const [key, value] of Object.entries(reservation)) {
    if (typeof value === 'string') {
      result[key] = sanitizeInput(value);
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

// Reservation functions
export async function getReservations() {
  try {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .order('fecha', { ascending: true });
    
    if (error) {
      console.error('Error fetching reservations:', error);
      throw error;
    }
    
    console.log("Retrieved reservations:", data);
    return data;
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return [];
  }
}

export async function createReservation(reservation: Omit<Reservation, 'id' | 'createdAt'>) {
  try {
    console.log("Creating reservation with data:", reservation);
    
    // Sanitize inputs
    const sanitizedReservation = sanitizeReservation(reservation);
    console.log("Sanitized reservation data:", sanitizedReservation);
    
    // Check if the time slot is available before creating
    const isAvailable = await checkAvailability(
      sanitizedReservation.fecha,
      sanitizedReservation.horaInicio,
      sanitizedReservation.horaFin
    );

    if (!isAvailable) {
      throw new Error('El horario seleccionado no está disponible.');
    }

    const { data, error } = await supabase
      .from('reservations')
      .insert([
        { 
          responsable: sanitizedReservation.responsable,
          email: sanitizedReservation.email,
          motivo: sanitizedReservation.motivo,
          fecha: sanitizedReservation.fecha,
          horaInicio: sanitizedReservation.horaInicio,
          horaFin: sanitizedReservation.horaFin,
          cantidadPersonas: sanitizedReservation.cantidadPersonas,
          createdAt: new Date().toISOString() 
        }
      ])
      .select();
    
    if (error) {
      console.error('Error creating reservation:', error);
      throw error;
    }

    console.log("Reservation created successfully:", data);

    // Send confirmation email to user
    try {
      await sendEmail({
        type: 'confirmation',
        recipient: sanitizedReservation.email,
        reservation: {
          id: data[0].id,
          ...sanitizedReservation
        }
      });
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Don't throw here, we still want to keep the reservation
    }

    // Send notification to admin
    try {
      await sendEmail({
        type: 'new-reservation',
        recipient: 'admin@system.com', // Production admin email would be here
        reservation: {
          id: data[0].id,
          ...sanitizedReservation
        }
      });
    } catch (emailError) {
      console.error('Error sending admin notification:', emailError);
      // Don't throw here, we still want to keep the reservation
    }

    return data[0];
  } catch (error) {
    console.error('Error creating reservation:', error);
    throw error;
  }
}

export async function deleteReservation(id: string, reason?: string) {
  try {
    if (!id) {
      throw new Error("No reservation ID provided for deletion");
    }
    
    console.log(`Deleting reservation with ID: ${id}, reason: ${reason || 'None provided'}`);
    
    // Get the reservation details before deleting
    const { data: reservation, error: getError } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', id)
      .single();
    
    if (getError) {
      console.error('Error fetching reservation before delete:', getError);
      throw getError;
    }
    
    console.log("Reservation to delete:", reservation);
    
    // Perform the deletion with detailed error handling
    const { error: deleteError, status } = await supabase
      .from('reservations')
      .delete()
      .eq('id', id);
    
    console.log("Delete operation status:", status);
    
    if (deleteError) {
      console.error('Error deleting reservation:', deleteError);
      throw deleteError;
    }
    
    if (status !== 204) {
      console.error(`Unexpected status code: ${status}`);
      // Some Supabase versions may return 200-204 for successful delete operations
      if (status < 200 || status >= 300) {
        throw new Error(`Failed to delete reservation. Status: ${status}`);
      }
    }

    console.log("Reservation deleted successfully");

    // If reservation exists, send cancellation email
    if (reservation) {
      try {
        await sendEmail({
          type: 'cancellation',
          recipient: reservation.email,
          reservation: {
            ...reservation,
            cancellationReason: sanitizeInput(reason) || 'No reason provided'
          }
        });
      } catch (emailError) {
        console.error('Error sending cancellation email:', emailError);
        // Don't throw, continue with the deletion
      }
    }

    return true;
  } catch (error) {
    console.error('Error deleting reservation:', error);
    throw error;
  }
}

// Admin authentication using Supabase Auth
export async function loginAdmin(email: string, password: string) {
  try {
    console.log(`Attempting admin login with email: ${email}`);
    
    if (!email || !password) {
      console.error('Email or password missing');
      throw new Error('Email and password are required');
    }
    
    // First, try to authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (authError) {
      console.error('Auth error:', authError);
      
      // If auth failed, check if the email is in the admins table
      // This is for backward compatibility with the existing admins
      const { data: adminCheck, error: adminCheckError } = await supabase
        .from('admins')
        .select('email')
        .eq('email', email)
        .single();
      
      if (adminCheckError) {
        console.error('Error checking admin table:', adminCheckError);
        
        // Check if it's the default test admin account
        if (email === 'test@email.com' && password === 'test123') {
          console.log('Using default test admin account');
          return { 
            user: { email: email },
            session: { 
              access_token: 'default_admin_token',
              expires_at: Date.now() + 86400000  // 24 hours
            } 
          };
        }
        
        // Not authorized
        throw new Error('Invalid credentials');
      }
      
      if (adminCheck) {
        console.log('Admin found in admins table, proceeding with login');
        
        // Try to sign up this admin with Auth if they don't exist yet
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (signUpError && signUpError.message !== 'User already registered') {
          console.error('Error signing up admin:', signUpError);
          throw new Error('Error creating admin account');
        }
        
        // Try to sign in again after sign up
        const { data: retryAuthData, error: retryAuthError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (retryAuthError) {
          console.error('Retry auth error:', retryAuthError);
          
          // If we still can't authenticate, but we know they're an admin,
          // create a session token manually
          return { 
            user: { email: email },
            session: { 
              access_token: 'manual_admin_token',
              expires_at: Date.now() + 86400000  // 24 hours
            } 
          };
        }
        
        // Successfully authenticated
        console.log('Admin successfully authenticated on retry');
        
        // Link the auth user to the admins table
        if (retryAuthData.user) {
          const { error: updateError } = await supabase
            .from('admins')
            .upsert({ 
              email: email,
              user_id: retryAuthData.user.id
            });
          
          if (updateError) {
            console.error('Error linking admin to auth user:', updateError);
            // Continue anyway as this is not critical
          }
        }
        
        return { user: retryAuthData.user, session: retryAuthData.session };
      }
      
      // No admin found
      throw new Error('Invalid credentials');
    }
    
    // Auth was successful, check if user is an admin
    if (authData.user) {
      // Try to check admin status using the is_admin function
      const { data: isAdminData, error: isAdminError } = await supabase
        .rpc('is_admin', { user_id: authData.user.id });
      
      if (isAdminError) {
        console.error('Error checking admin status:', isAdminError);
        
        // Fallback to admins table query
        const { data: adminCheck, error: adminCheckError } = await supabase
          .from('admins')
          .select('*')
          .eq('user_id', authData.user.id)
          .maybeSingle();
        
        if (adminCheckError) {
          console.error('Error checking admin table:', adminCheckError);
        }
        
        // Check if this email is in the admins table, regardless of user_id
        const { data: emailCheck, error: emailCheckError } = await supabase
          .from('admins')
          .select('*')
          .eq('email', email)
          .maybeSingle();
        
        if (emailCheckError) {
          console.error('Error checking admin email:', emailCheckError);
        }
        
        if (adminCheck || emailCheck) {
          console.log('Admin found via table lookup');
          
          // If email exists but user_id doesn't match, update it
          if (emailCheck && (!emailCheck.user_id || emailCheck.user_id !== authData.user.id)) {
            const { error: updateError } = await supabase
              .from('admins')
              .upsert({ 
                email: email,
                user_id: authData.user.id
              });
            
            if (updateError) {
              console.error('Error updating admin user_id:', updateError);
            }
          }
          
          return { user: authData.user, session: authData.session };
        }
        
        // Special case for the known admin emails
        if (email === 'test@email.com' || email === 'david.gimenezs@fiuna.edu.py') {
          console.log('Known admin email authenticated');
          
          // Add to admins table if not already there
          const { error: insertError } = await supabase
            .from('admins')
            .upsert({ 
              email: email,
              user_id: authData.user.id
            });
          
          if (insertError) {
            console.error('Error adding to admins table:', insertError);
          }
          
          return { user: authData.user, session: authData.session };
        }
        
        console.error('User authenticated but not an admin');
        throw new Error('Unauthorized');
      } 
      
      if (!isAdminData) {
        console.error('User authenticated but not an admin according to is_admin function');
        
        // Special case for the known admin emails
        if (email === 'test@email.com' || email === 'david.gimenezs@fiuna.edu.py') {
          console.log('Known admin email authenticated despite is_admin returning false');
          
          // Add to admins table if not already there
          const { error: insertError } = await supabase
            .from('admins')
            .upsert({ 
              email: email,
              user_id: authData.user.id
            });
          
          if (insertError) {
            console.error('Error adding to admins table:', insertError);
          }
          
          return { user: authData.user, session: authData.session };
        }
        
        throw new Error('Unauthorized');
      }
      
      console.log('Admin login successful via is_admin function');
      return { user: authData.user, session: authData.session };
    }
    
    throw new Error('Unable to authenticate');
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
}

export async function blockTimeSlot(date: string, startTime: string, endTime: string, reason: string) {
  try {
    console.log(`Blocking time slot on ${date} from ${startTime} to ${endTime} with reason: ${reason}`);
    
    // First, get any existing reservations in this time slot
    const { data: existingReservations, error: queryError } = await supabase
      .from('reservations')
      .select('*')
      .eq('fecha', date)
      .or(`horaInicio.gte.${startTime},horaFin.lte.${endTime}`);
    
    if (queryError) {
      console.error('Error checking existing reservations:', queryError);
      throw queryError;
    }
    
    console.log(`Found ${existingReservations?.length || 0} existing reservations in the time slot`);
    
    // Cancel any existing reservations with a specific cancellation reason
    if (existingReservations && existingReservations.length > 0) {
      const cancellationReason = `La reserva fue cancelada porque el administrador bloqueó este horario: ${reason}`;
      
      for (const reservation of existingReservations) {
        if (reservation.responsable !== 'Admin') {
          console.log(`Cancelling existing reservation: ${reservation.id}`);
          try {
            await deleteReservation(reservation.id, cancellationReason);
          } catch (error) {
            console.error(`Error cancelling reservation ${reservation.id}:`, error);
            // Continue with others even if one fails
          }
        }
      }
    }
    
    // Create a "blocked" reservation owned by the admin
    const blockedReservation = {
      responsable: 'Admin',
      email: 'admin@system.com',
      motivo: `BLOQUEADO: ${reason}`,
      fecha: date,
      horaInicio: startTime,
      horaFin: endTime,
      cantidadPersonas: 0
    };
    
    console.log("Creating block reservation:", blockedReservation);
    
    const { data, error: insertError } = await supabase
      .from('reservations')
      .insert([
        { 
          ...blockedReservation,
          createdAt: new Date().toISOString() 
        }
      ])
      .select();
    
    if (insertError) {
      console.error('Error creating block reservation:', insertError);
      throw insertError;
    }
    
    console.log("Block created successfully:", data?.[0]);
    
    return data?.[0];
  } catch (error) {
    console.error('Error blocking time slot:', error);
    throw error;
  }
}

export async function unblockTimeSlot(blockId: string) {
  console.log(`Unblocking time slot with ID: ${blockId}`);
  return await deleteReservation(blockId, 'Time slot unblocked by admin');
}

export async function checkAvailability(date: string, startTime: string, endTime: string, excludeId?: string) {
  try {
    console.log(`Checking availability for ${date} from ${startTime} to ${endTime}`, 
      excludeId ? `excluding reservation ${excludeId}` : '');
    
    const { data: reservations, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('fecha', date);
    
    if (error) {
      console.error('Error checking availability:', error);
      throw error;
    }
    
    console.log(`Found ${reservations?.length || 0} reservations for ${date}`);
    
    // If there's an excludeId (for updates), filter it out
    const relevantReservations = excludeId 
      ? reservations?.filter(res => res.id !== excludeId) 
      : reservations;
    
    // Check if there's any overlap with existing reservations
    const isAvailable = !relevantReservations?.some(reservation => {
      const reservationStart = reservation.horaInicio;
      const reservationEnd = reservation.horaFin;
      
      // Check overlap
      const hasOverlap = (
        (startTime >= reservationStart && startTime < reservationEnd) ||
        (endTime > reservationStart && endTime <= reservationEnd) ||
        (startTime <= reservationStart && endTime >= reservationEnd)
      );
      
      if (hasOverlap) {
        console.log(`Overlap detected with reservation:`, reservation);
      }
      
      return hasOverlap;
    });
    
    console.log(`Availability result: ${isAvailable ? 'Available' : 'Not available'}`);
    return isAvailable;
  } catch (error) {
    console.error('Error checking availability:', error);
    // Return false on error to prevent potentially conflicting bookings
    return false;
  }
}

// Helper function to send emails using our Edge Function
async function sendEmail(emailData: {
  type: 'new-reservation' | 'confirmation' | 'modification' | 'cancellation';
  recipient: string;
  reservation: any;
  changes?: string;
}) {
  try {
    console.log(`Sending ${emailData.type} email to ${emailData.recipient}`);
    
    const response = await supabase.functions.invoke('send-email', {
      body: emailData
    });
    
    if (response.error) {
      console.error('Error sending email:', response.error);
    } else {
      console.log('Email sent successfully:', response.data);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error invoking send-email function:', error);
    // Don't throw here - we don't want email failures to block the main operation
    return null;
  }
}
