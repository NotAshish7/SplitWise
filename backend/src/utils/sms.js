// Simple SMS utility that displays OTPs in console
// Perfect for development - no external SMS service needed!

export async function sendSMS(to, message) {
  // Always show in console (no Twilio dependency)
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                  📱 SMS OTP (CONSOLE MODE)');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`📱 To Phone: ${to}`);
  console.log('───────────────────────────────────────────────────────────────');
  
  // Extract OTP from message if present
  const otpMatch = message.match(/(\d{6})/);
  if (otpMatch) {
    console.log('');
    console.log('        ╔═══════════════════════════════════════╗');
    console.log('        ║                                       ║');
    console.log(`        ║     🔐 OTP CODE: ${otpMatch[1]}        ║`);
    console.log('        ║                                       ║');
    console.log('        ╚═══════════════════════════════════════╝');
    console.log('');
    console.log('        👆 COPY THIS CODE AND ENTER IT IN THE APP!');
    console.log('');
  }
  
  console.log(`💬 Message: ${message}`);
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('\n');
  
  // Return success (console mode always works)
  return { 
    success: true,
    messageId: 'console-sms',
    method: 'console'
  };
}
