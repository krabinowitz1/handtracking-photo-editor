// Original source code taken from https://github.com/higuaro/liquify-tool
// Modified by Kevin Rabinowitz

var graphics = (function(canvasId) {
    "use strict";
     
     var effectIntensity = 5.0;
     var canvasId = "canvas1";
     var currentBuffer;
     var toolRadious = 50;
     var canvas = document.getElementById(canvasId);
     var context2d = canvas.getContext('2d');
     var MIN_TOOL_RADIOUS = 10;
     var MAX_TOOL_RADIOUS = 80;
     
     function setEffectIntensity(intensity) {
         effectIntensity = (intensity / 100.0) * 10.0;
     }            
     
     setEffectIntensity(200);
     
     function loadImage(src){
         //	Prevent any non-image file type from being read.
         if(!src.type.match(/image.*/)){
             console.log("The dropped file is not an image: ", src.type);
             return;
         }

         //	Create our FileReader and run the results through the render function.
         var reader = new FileReader();
         reader.onload = function(e) {
             var image = new Image();
             image.onload = function() {
                 // Adjust canvas size to the image dimensions
                 canvas.width = image.width;
                 canvas.height = image.height;
             
                 // Save a copy of loaded pixels 
                 context2d.drawImage(image, 0, 0);
                 currentBuffer = context2d.getImageData(0, 0, image.width, image.height);
             }
             image.src = e.target.result;
         };
         reader.readAsDataURL(src);
     }
     
     function onMouseOut(event) {
         if (!currentBuffer) {
             return;
         }
         drawBuffer();
     }
     
     function onMouseWheel(event) {
         if (!currentBuffer) {
             return;
         }
         
         // Chrome 
         if (event.wheelDelta) {
             switch (event.wheelDelta) {
                 case  120: toolRadious += 1; break;
                 case  240: toolRadious += 2; break;
                 case -120: toolRadious -= 1; break;
                 case -240: toolRadious -= 2; break;
             }
         } else if (event.detail) {
             if (event.detail < 0) {
                 toolRadious += 1;
             } else {
                 toolRadious -= 1;
             }
         }
         
         if (toolRadious < MIN_TOOL_RADIOUS) {
             toolRadious = MIN_TOOL_RADIOUS;
         }
         if (toolRadious > MAX_TOOL_RADIOUS) {                
             toolRadious = MAX_TOOL_RADIOUS;
         }                    

         drawTool(event.clientX, event.clientY);
     }

     function drawTool(clientX, clientY) {
         var rect = canvas.getBoundingClientRect();
         var x = clientX - rect.left;
         var y = clientY - rect.top;
         
         drawBuffer();
         
         context2d.beginPath();
         context2d.arc(x, y, toolRadious, 0, 2 * Math.PI, false);
         context2d.lineWidth = 1;
         context2d.strokeStyle = '#0000fa';
         context2d.closePath();
         context2d.stroke();            
     }

     function onMouseMove(event) {
         if (!currentBuffer) {
             return;
         }
         var rect = canvas.getBoundingClientRect();
         var x = (event.clientX - rect.left) | 0;
         var y = (event.clientY - rect.top) | 0;
         console.log(x, y);
         liquify(currentBuffer, x, y, toolRadious);
         drawBuffer();
     }

     function drawBuffer() {
         context2d.putImageData(currentBuffer, 0, 0);
     }

     function createCompatibleImageData(imgData) {
         return context2d.createImageData(imgData.width, imgData.height);
     }


     // This renders the 'imageData' parameter into the canvas
     function drawPixels(canvasId, imageData) {
         var context2d = getContext2d(canvasId);
         context2d.putImageData(imageData, 0, 0);
     }


     // Copy the pixels of the 'srcPixels' ImageData parameter
     // into the 'dstPixels' parameter
     function copyImageData(srcPixels, dstPixels, width, height) {
         var x, y, position;
         for (y = 0; y < height; ++y) {
             for (x = 0; x < width; ++x) {
                 position = y * width + x;
                 position *= 4;
                 dstPixels[position + 0] = srcPixels[position + 0];
                 dstPixels[position + 1] = srcPixels[position + 1];
                 dstPixels[position + 2] = srcPixels[position + 2];
                 dstPixels[position + 3] = srcPixels[position + 3];
             }
         }
     }

     function onMouseDown(event) {
         if (!currentBuffer) {
             return;
         }            
     
         var rect = canvas.getBoundingClientRect();
         var x = (event.clientX - rect.left) | 0;
         var y = (event.clientY - rect.top) | 0;
         console.log(x, y);
         // console.log("antes", currentBuffer.data);
         liquify(currentBuffer, x, y, toolRadious);
         // console.log("despues", currentBuffer.data);
         drawBuffer();
     }

     function liquifyHelper(x, y) {
         if (!currentBuffer) {
             return;
         }

         var rect = canvas.getBoundingClientRect();
         var newX = (x) | 0;
         var newY = (y) | 0;

         liquify(currentBuffer, newX, newY, toolRadious);

         drawBuffer();
     }


     function liquify(sourceImgData, x, y, radious) {
         console.log('x pos: ' + x);
         console.log('y pos: ' + y);
         var sourcePosition, destPosition;

         var destImgData = createCompatibleImageData(sourceImgData);
         var srcPixels = sourceImgData.data;
         var dstPixels = destImgData.data;

         var width = sourceImgData.width;
         var height = sourceImgData.height;

         var centerX = x;
         var centerY = y;
         
         var radiousSquared = radious * radious;

         copyImageData(srcPixels, dstPixels, width, height);

         var r, alpha, angle, degrees, delayBetweenFrames;
         var sourcePosition, destPosition;
         var newX, newY;
         var k, pos0, pos1, pos2, pos3;
         var componentX0, componentX1;
         var deltaX, deltaY;
         var x0, xf, y0, yf;
         var interpolationFactor;
         var finalPixelComponent;
         var offsetX, offsetY;
         var x, y; 
                     
         // Iterate over the interest square region 
         for (y = -radious; y < radious; ++y) {
             for (x = -radious; x < radious; ++x) {
                 // Check if the pixel is inside the effect circle
                 if (x * x + y * y <= radiousSquared) { 
                     offsetX = x + centerX;
                     offsetY = y + centerY;
                     // Check if pixels lies inside the image region 
                     if (offsetX < 0 || offsetX >= width || offsetY < 0 || offsetY >= height) {
                         continue;
                     }

                     // Get the pixel array position
                     destPosition = offsetY * width + offsetX;
                     destPosition *= 4;

                     // Transform the pixel Cartesian coordinates (x, y) to polar coordinates (r, alpha)
                     r = Math.sqrt(x * x + y * y);
                     alpha = Math.atan2(y, x);

                     // Remember that the angle alpha is in radians, transform it to degrees 
                     degrees = (alpha * 180.0) / Math.PI;

                     // Calculate the interpolation factor
                     interpolationFactor = r / radious;

                     // Do the interpolation
                     r = interpolationFactor * r + (1.0 - interpolationFactor) * effectIntensity * Math.sqrt(r);

                     // Transform back from polar coordinates to Cartesian 
                     alpha = (degrees * Math.PI) / 180.0;
                     newY = r * Math.sin(alpha);
                     newX = r * Math.cos(alpha);

                     offsetX = newX + centerX;
                     offsetY = newY + centerY;

                     if (offsetX < 0 || offsetX >= width || offsetY < 0 || offsetY >= height) {
                         continue;
                     }

                     // Calculate the (x, y) coordinates of the transformation and keep 
                     // the fractional  in the delta variables
                     x0 = Math.floor(newX); 
                     xf = x0 + 1;
                     y0 = Math.floor(newY); 
                     yf = y0 + 1;
                     deltaX = newX - x0;
                     deltaY = newY - y0;                                
                     
                     // Calculate the array position for the pixels (x, y), (x + 1, y), (x, y + 1) and (x + 1, y + 1)
                     pos0 = ((y0 + centerY) * width + x0 + centerX) * 4;
                     pos1 = ((y0 + centerY) * width + xf + centerX) * 4;
                     pos2 = ((yf + centerY) * width + x0 + centerX) * 4;
                     pos3 = ((yf + centerY) * width + xf + centerX) * 4;

                     // Do the bilinear interpolation thing for every component of the pixel
                     for (k = 0; k < 4; ++k) {
                         // Interpolate the pixels (x, y) and (x + 1, y)
                         componentX0 = (srcPixels[pos1 + k] - srcPixels[pos0 + k]) * deltaX + srcPixels[pos0 + k];
                         // Interpolate the pixels immediately below of (x, y), those are (x, y + 1) and (x + 1, y + 1)
                         componentX1 = (srcPixels[pos3 + k] - srcPixels[pos2 + k]) * deltaX + srcPixels[pos2 + k];
                         // Interpolate again the interpolated components  
                         finalPixelComponent = (componentX1 - componentX0) * deltaY + componentX0;
                         // Set the pixel in the image buffer but first check if it lies between 0 and 255, if not, clamp it to that range
                         dstPixels[destPosition + k] = finalPixelComponent > 255 ? 255 : (finalPixelComponent < 0 ? 0 : finalPixelComponent);
                     }
                 }
             }
         }

         copyImageData(dstPixels, srcPixels, width, height);
     }
     
     if (canvas.addEventListener) {
         canvas.addEventListener('mousemove', onMouseMove, false);
         canvas.addEventListener('mouseout', onMouseOut, false);
         canvas.addEventListener('mousewheel', onMouseWheel, false);
         canvas.addEventListener('DOMMouseScroll', onMouseWheel, false);
         canvas.addEventListener('mousedown', onMouseDown, false);
     }

     return { 
              loadImage: loadImage,
              setEffectIntensity: setEffectIntensity,
              liquifyHelper: liquifyHelper
            };
                   
 }("canvas1"));