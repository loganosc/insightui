export const estimateElementCoordinates = (element, imageWidth, imageHeight) => {
  // This function maps element names to approximate bounding boxes
  // In a real implementation, this would use ML-based element detection
  // For now, we return general regions based on common UI patterns
  
  const elementLower = element.toLowerCase();
  
  // Define common UI element regions (normalized 0-1 coordinates)
  const regions = {
    'header': { x: 0, y: 0, width: 1, height: 0.08 },
    'navigation': { x: 0, y: 0.08, width: 0.2, height: 0.92 },
    'navbar': { x: 0, y: 0, width: 1, height: 0.1 },
    'sidebar': { x: 0, y: 0.1, width: 0.2, height: 0.9 },
    'menu': { x: 0, y: 0.05, width: 0.15, height: 0.4 },
    'button': { x: 0.35, y: 0.45, width: 0.3, height: 0.1 },
    'cta': { x: 0.35, y: 0.45, width: 0.3, height: 0.1 },
    'primary': { x: 0.35, y: 0.45, width: 0.3, height: 0.1 },
    'input': { x: 0.1, y: 0.3, width: 0.8, height: 0.08 },
    'form': { x: 0.1, y: 0.2, width: 0.8, height: 0.6 },
    'card': { x: 0.1, y: 0.2, width: 0.8, height: 0.3 },
    'modal': { x: 0.15, y: 0.15, width: 0.7, height: 0.7 },
    'footer': { x: 0, y: 0.9, width: 1, height: 0.1 },
    'content': { x: 0.2, y: 0.1, width: 0.8, height: 0.8 },
    'main': { x: 0.2, y: 0.1, width: 0.8, height: 0.8 }
  };

  // Find matching region
  for (const [key, region] of Object.entries(regions)) {
    if (elementLower.includes(key)) {
      return {
        x: region.x * imageWidth,
        y: region.y * imageHeight,
        width: region.width * imageWidth,
        height: region.height * imageHeight
      };
    }
  }

  // Default fallback - highlight center area
  return {
    x: imageWidth * 0.25,
    y: imageHeight * 0.35,
    width: imageWidth * 0.5,
    height: imageHeight * 0.3
  };
};

export const generateRandomCoordinates = (imageWidth, imageHeight, count = 5) => {
  // Generate random bounding boxes for demonstration
  const boxes = [];
  for (let i = 0; i < count; i++) {
    const x = Math.random() * (imageWidth * 0.7);
    const y = Math.random() * (imageHeight * 0.7);
    const width = 100 + Math.random() * 150;
    const height = 50 + Math.random() * 100;

    boxes.push({
      x: Math.min(x, imageWidth - width),
      y: Math.min(y, imageHeight - height),
      width,
      height
    });
  }
  return boxes;
};
