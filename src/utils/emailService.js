// Email templates
const bookingConfirmationTemplate = (booking) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">Booking Confirmation</h2>
      <p>Dear ${booking.customerName},</p>
      <p>Your booking has been confirmed. Here are your booking details:</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #2c3e50;">Booking Details</h3>
        <p><strong>Vehicle:</strong> ${booking.vehicleDetails.brand} ${booking.vehicleDetails.model}</p>
        <p><strong>Pickup Date:</strong> ${new Date(booking.startDate).toLocaleDateString()}</p>
        <p><strong>Return Date:</strong> ${new Date(booking.endDate).toLocaleDateString()}</p>
        <p><strong>Total Price:</strong> $${booking.totalPrice}</p>
        <p><strong>Status:</strong> ${booking.status}</p>
      </div>
      <p>Thank you for choosing our service!</p>
      <p>Best regards,<br>IslandGo Team</p>
    </div>
  `;
};

const tourReservationTemplate = (reservation) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">Tour Reservation Confirmation</h2>
      <p>Dear ${reservation.customerName},</p>
      <p>Your tour reservation has been confirmed. Here are your reservation details:</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #2c3e50;">Reservation Details</h3>
        <p><strong>Tour:</strong> ${reservation.tourName}</p>
        <p><strong>Date:</strong> ${new Date(reservation.reservationDate).toLocaleDateString()}</p>
        <p><strong>Number of Persons:</strong> ${reservation.persons}</p>
        <p><strong>Total Price:</strong> $${reservation.totalPrice}</p>
        <p><strong>Status:</strong> ${reservation.status}</p>
      </div>

      <p>Thank you for choosing our service!</p>
      <p>Best regards,<br>IslandGo Team</p>
    </div>
  `;
};

// Send email function
export const sendEmail = async (to, subject, html) => {
  try {
    if (!to) {
      console.error('Email address is undefined');
      throw new Error('Email address is required');
    }

    console.log('Attempting to send email to:', to);

    const response = await fetch('http://localhost:3001/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, subject, html }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to send email');
    }

    const data = await response.json();
    console.log('Email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

// Test server connection
export const testServerConnection = async () => {
  try {
    const response = await fetch('http://localhost:3001/api/test');
    if (!response.ok) {
      throw new Error('Server is not responding correctly');
    }
    const data = await response.json();
    console.log('Server test response:', data);
    return true;
  } catch (error) {
    console.error('Server connection test failed:', error);
    return false;
  }
};

// Export functions
export const sendBookingConfirmation = async (booking) => {
  if (!booking || !booking.customerEmail) {
    console.error('Invalid booking data:', booking);
    return { success: false, message: 'Invalid booking data' };
  }

  try {
    const subject = 'Booking Confirmation - IslandGo';
    const html = bookingConfirmationTemplate(booking);
    return await sendEmail(booking.customerEmail, subject, html);
  } catch (error) {
    console.error('Error in sendBookingConfirmation:', error);
    return { success: false, message: error.message };
  }
};

export const sendTourReservationConfirmation = async (reservation) => {
  if (!reservation || !reservation.customerEmail) {
    console.error('Invalid reservation data:', reservation);
    return { success: false, message: 'Invalid reservation data' };
  }

  try {
    const subject = 'Tour Reservation Confirmation - IslandGo';
    const html = tourReservationTemplate(reservation);
    return await sendEmail(reservation.customerEmail, subject, html);
  } catch (error) {
    console.error('Error in sendTourReservationConfirmation:', error);
    return { success: false, message: error.message };
  }
}; 