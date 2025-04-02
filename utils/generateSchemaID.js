const generateCustomId = (prefix) => {
    // Generate a random 9-digit number
    const randomNumber = Math.floor(Math.random() * 1000000000); // Random 9-digit number
    const paddedNumber = randomNumber.toString().padStart(9, '0'); // Pad it to ensure it's always 9 digits
  
    // Get the current Unix time (in seconds)
    const unixTime = Math.floor(Date.now() / 1000); // Convert milliseconds to seconds
  
    // Combine the prefix, random number, and Unix time to create the custom ID
    return `${prefix}-${paddedNumber}-${unixTime}`; // Example format: MED-123456789-1632874800
  };
  
  module.exports = generateCustomId;
  