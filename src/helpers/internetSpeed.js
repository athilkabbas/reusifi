const testSpeed = async () => {
  const imageUrl =
    "https://upload.wikimedia.org/wikipedia/commons/3/3f/JPEG_example_flower.jpg"; // Sample image
  const startTime = new Date().getTime(); // Start time

  try {
    // Fetch image data
    const response = await fetch(imageUrl);
    const data = await response.blob(); // Convert to blob

    // End time after fetch is complete
    const endTime = new Date().getTime();

    // Calculate time taken in seconds
    const duration = (endTime - startTime) / 1000;

    // Calculate speed in Mbps (bits per second / 1 million)
    const fileSizeInBits = data.size * 8;
    const speedMbps = (fileSizeInBits / duration / 1024 / 1024).toFixed(2);
    return speedMbps;
  } catch (error) {
    console.error("Error fetching file:", error);
  }
};

export default testSpeed;
