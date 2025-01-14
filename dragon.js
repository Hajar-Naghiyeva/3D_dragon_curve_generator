/*
    CSCI 2408 Computer Graphics Fall 2023 
    (c)2023 by Hajar Naghiyeva  
    Submitted in partial fulfillment of the requirements of the course.
*/

// Creating Vector class representing a vector in 3D space (further used as vertices of the Dragon Curve) 
class Vector {   
  constructor(x, y, z) {
    this.x = x; // x component of a vector
    this.y = y; // y component of a vector
    this.z = z; // z component of a vector 
  }
  
  // Method for adding a vector with a vector for updating the positions of the vertices in the Dragon Curve
  vectorAddition(vector) { 
    return new Vector(this.x + vector.x, this.y + vector.y, this.z + vector.z);
  }
}

// Creating Matrix class representing a 3x3 matrix. It is used for performing rotations on a vector, although it can be used for performing other transformations as well
class Matrix { 
  // Elements parameter is a 2D array, where each inner array represents a row of the matrix 
  constructor(elements) { 
    this.elements = elements;
  }

  // Matrix multiplication with a vector assuming that vector is represented in homogeneous coordinates. It will be utilized for the rotation transformation
  matrixVectorMult(vector) { 
    let result = [0, 0, 0];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        result[i] += this.elements[i][j] * vector[j];
    }
  }
    return new Vector(result[0], result[1], result[2]);
    }
}

// Creating a DragonCurve class containing the main logic of the program
class DragonCurve { 
  // Two parameters for the number of iterations and height (depth) for the 3D effect
  constructor(numOfIterations, height) {  
    this.numOfIterations = numOfIterations; 
    this.height = height;
  }
  
  // Static method to generate a rotation matrix around the Z-axis by the given angle
  static rotationMatrix(angle) { 
  const radians = (Math.PI / 180) * angle;
  return new Matrix([
    [Math.cos(radians), -Math.sin(radians), 0],
    [Math.sin(radians), Math.cos(radians), 0],
    [0, 0, 1]
  ]);
}
  /* 
   Reference to the following pages for the "R" and "L" logic implementation for the generation of fractals:
   https://www.geeksforgeeks.org/heighways-dragon-curve-python/ 
   https://en.wikipedia.org/wiki/L-system 

   My code is also based on the Lindenmayer System (L-system).
   However, instead of using string rewriting, it uses an array (directions) to track the sequence of turns.
   Each iteration adds turns to this array following the Dragon Curve folding rule: 
   take the sequence from the previous iteration, reverse it, swap "R" with "L" (and vice versa), 
   and concatenate it back to the original sequence with an additional "R" turn in between.
  */


  // Method to generate a 2D Dragon Curve using the number of specified iterations 
  generateDragonCurve2D() { 
    let vertices = [new Vector(0, 0, 0), new Vector(1, 0, 0)]; // Initialized vertices array with two starting points of the curve
    let directions = ['R']; // Starting with a right turn direction as the first direction
    let currentDirection = 0; // Setting the initial direction to 0 degrees (facing right on the x-axis)

    for (let iteration = 0; iteration < this.numOfIterations; iteration++) {
      let additionalDirections = [];  // Temporary array to keep new directions 
      for (let j = directions.length - 1; j >= 0; j--) {
          additionalDirections.push(directions[j] === 'R' ? 'L' : 'R'); // Adding the opposite direction to the additionalDirections array
      }
      directions = directions.concat('R').concat(additionalDirections);
    }

    // Iterating over each direction to create the vertices of the curve
    for (let dir of directions) { 
      let lastVertex = vertices[vertices.length - 1];
      let rotateAngle = dir === 'R' ? 90 : - 90; // Determining the angle to rotate based on the direction (right or left turn)
      currentDirection = (currentDirection + rotateAngle) % 360; // Updating the current direction with the new angle for rotation, modulo 360 (to keep the angle within a full circle)
      let updatedVector = DragonCurve.rotationMatrix(currentDirection).matrixVectorMult([1, 0, 0]);
      vertices.push(lastVertex.vectorAddition(updatedVector));
    }

    return vertices;
  }

  // Method to generate a 3D Dragon Curve in OBJ file format
  generate3DDragonCurveOBJ() {
    const frontCurve = this.generateDragonCurve2D(); // Generating 2D Dragon Curve, which will be used as the front face of the 3D curve
    let backCurve = [];
    for (let vertex of frontCurve) {
        backCurve.push(new Vector(vertex.x, vertex.y, vertex.z + this.height)); // Creating a new vertex for the back curve by adding the height to the z-coordinate
        // of the current front curve vertex, and adding it to the back curve array
    }
    let vertices = frontCurve.concat(backCurve); // Combine the vertices of the front and back curves to get the complete set of vertices for the 3D Dragon Curve
    let faces = [];

    for (let index = 0; index < frontCurve.length - 1; index++) {
        // Calculating indices of the four corners of the face according to the OBJ file's 1-indexed format
        let v1 = index + 1; // Index of the current vertex on the front curve
        let v2 = index + 2; // Index of the next vertex on the front curve
        let v3 = v2 + frontCurve.length; // Index of the next vertex on the back curve
        let v4 = v1 + frontCurve.length; // Index of the current vertex on the back curve
        faces.push([v1, v2, v3, v4].join(' '));
    }

    let objContent = 'o DragonCurve3D\n';
    // Iterating over combined vertices of the front and back curves
    for (let v of vertices) {
        objContent += `v ${v.x.toFixed(4)} ${v.y.toFixed(4)} ${v.z.toFixed(4)}\n`; // Appending each vertex to the OBJ content, formatted with fixed-point notation
    }
    for (let f of faces) {
        objContent += `f ${f}\n`; // Appending each face to the OBJ content using "f" command indicating a face
    }

    return objContent; // Returning a complete OBJ file content as a string
  }
}


// For choosing the location to save the OBJ file, I referred to the following page's suggestion:
// https://github.com/jimmywarting/StreamSaver.js/discussions/277

async function downloadOBJFile(fileName, text) {
    try {
      // Creating a new handle for the new file to be written
      const handle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [{
          description: 'OBJ File',
          accept: {'text/plain': ['.obj']},
        }],
      });
  
      const writableStream = await handle.createWritable(); // Creating a FileSystemWritableFileStream to write to
  
      await writableStream.write(text); // Writing the contents of the file to the stream
  
      await writableStream.close(); // Closing the file and write the contents to disk
      
      alert('File was successfully saved! :)');
    } catch (error) {
      console.error(error);
      alert('File failed to save! :(');
    }
}

function init() {
    document.addEventListener('DOMContentLoaded', () => {
        document.getElementById('parameters-form').addEventListener('submit', function(event) {
            event.preventDefault();
            console.log('Form submission triggered.');

            // Getting values from the form
            const numOfIterations = parseInt(document.getElementById('iterations').value);
            const height = parseFloat(document.getElementById('height').value);
            const fileName = document.getElementById('filename').value;

            console.log(`Generating OBJ with iterations: ${numOfIterations}, height: ${height}, filename: ${fileName}`); // For debugging purposes

            const dragon = new DragonCurve(numOfIterations, height);
            const objData = dragon.generate3DDragonCurveOBJ(); // Calling the method to generate the OBJ data for the 3D Dragon Curve

            console.log('Generated OBJ data:', objData); // For debugging purposes
            
            downloadOBJFile(fileName, objData); // Triggering download
        });
    });
}

init();
