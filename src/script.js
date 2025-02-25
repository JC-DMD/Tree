// Grab the "root" checkbox state
var root = $("#root-switch")[0].checked;

// Store the parsed CSV data here
var csvData = [];
// Flag to track if the user has loaded a CSV file
var csvLoaded = false;

// Create datasets for nodes and edges
var nodes = new vis.DataSet();
var edges = new vis.DataSet();

// Store node and edges in one object
var data = {
      nodes: nodes,
      edges: edges
};

// Remove file name from file path and return just the directory that file (or folder) resides in
const directory = function(pathStr) {
      // Split path into pieces
      let parts = pathStr.split("\\");
      parts.pop(); // Remove the file/folder name at the end
      // Join back into a directory string
      return parts.join("\\");
};

// Get number of sub-directories within file path
const subfolders = function(pathStr) {
      return pathStr.split("\\").length;
};

// ----------------------------------------------------
// Fallback: Get default file paths from dir.txt (optional)
// If user doesn’t select a CSV, fall back to dir.txt.
var dir = $.ajax({
      url: "./dir.txt",
      async: false
}).responseText;
// ----------------------------------------------------

// Get the div where network will be displayed
var container = $("#network")[0];

// Define options for network visualization
var options = {
      layout: {
            improvedLayout: true,
            hierarchical: {
                  enabled: true,
                  direction: 'LR',
                  sortMethod: 'directed',
                  nodeSpacing: 50,
                  levelSeparation: 400
            }
      },
      nodes: {
            shape: 'box',
            fixed: true,
            font: {
                  size: 10,
                  color: '#000000',
                  vadjust: 0,
                  strokeColor: '#ffffff',
                  strokeWidth: 1
            },
            borderWidth: 2,
            shapeproperties: {
                  borderRadius: 6
            },
            shadow: true,
            margin: 5,
            widthConstraint: {
                  minimum: 50,
                  maximum: 150
            }
      },
      edges: {
            width: 2,
            shadow: true
      },
};

// Store the minimum-subfolder path globally
var min_subfolders;

// Track node colors
var color = "File level";

// Simple function to parse CSV content into an array of objects { path, isContainer }
function parseCSV(csvString) {
      // Split into lines
      let lines = csvString.split(/\r?\n/);
      // Remove empty lines
      lines = lines.filter(Boolean);

      // Shift off the header row (e.g. "FullName,PsIsContainer")
      lines.shift();

      let parsed = [];
      for (let i = 0; i < lines.length; i++) {
            // Split each line by comma
            let parts = lines[i].split(",");
            let path = parts[0];
            let isContainer = parts[1]; // "True" or "False"
            parsed.push({
                  path: path,
                  isContainer: isContainer
            });
      }
      return parsed;
}

// Listen for file selection in the file input (defined in your HTML)
document.getElementById("file-input").addEventListener("change", function(e) {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function(event) {
            // Parse the CSV file
            csvData = parseCSV(event.target.result);
            csvLoaded = true;
      };
      // Read the file as text
      reader.readAsText(file);
});
// ------------------------------------------------------------------------

// Node group (color) logic
const color_nodes = function() {
      let group = 0;
      let file_types = [];

      // Loop over each node (there should be as many nodes as input items)
      for (var i = 0; i < Object.keys(data.nodes._data).length; i++) {
            // data.nodes._data[i] was created in update() with path and label
            let currentPath = input[i].path;
            let currentIsDir = input[i].isContainer; // "True" or "False"

            // For file-level or file-type, we still rely on the path
            let split = currentPath.split("\\");
            let name = split[split.length - 1];

            if (color === "Object type") {
                  // Root node is one color, if root is enabled and this is the last item
                  // in our input array
                  if (i === input.length - 1 && root) {
                        group = 3; // for example, color for the root
                  }
                  else {
                        // Check the second column (isContainer)
                        if (currentIsDir === "True") {
                              // It's a directory
                              group = 2;
                        } else {
                              // It's a file
                              group = 1;
                        }
                  }
            }
            else if (color === "File level") {
                  group = subfolders(currentPath);
            }
            else if (color === "File type") {
                  // If it's a file, try to parse out extension
                  if (currentIsDir === "False" && name.includes(".")) {
                        let file_type = name.split(".").pop();
                        if (!file_types.includes(file_type)) {
                              file_types.push(file_type);
                        }
                        group = file_types.indexOf(file_type);
                  } else {
                        // Directories or no dot in name
                        group = -1;
                  }
            }

            data.nodes.update({
                  id: i,
                  group: group
            });
      }
};

// Generate network visualization based on input data
const update = function() {
      // ID of current node
      var id = 0;

      // Create fresh datasets for nodes and edges
      data.nodes = new vis.DataSet();
      data.edges = new vis.DataSet();

      //  1) if CSV was loaded, use that
      //  2) else if no CSV, fallback to dir.txt
      if (csvLoaded) {
            input = csvData; // This is an array of { path, isContainer }
      }
      else {
            // Fallback: parse 'dir' string from dir.txt into array of { path, isContainer="False" } 
            let lines = dir.split("\n").filter(Boolean);
            input = lines.map(function(line) {
                  return {
                        path: line,
                        isContainer: "False"
                  };
            });
      }

      // Find the path with the fewest subfolders (for the "root" logic)
      min_subfolders = input[0].path;
      for (var i = 0; i < input.length; i++) {
            if (subfolders(input[i].path) < subfolders(min_subfolders)) {
                  min_subfolders = input[i].path;
            }
      }

      // If root is enabled, push that directory as an extra node
      var root_dir = directory(min_subfolders);
      if (root) {
            // Add an entry at the end
            input.push({
                  path: root_dir,
                  isContainer: "True" // Typically root is a directory
            });
      }
      $("#root-switch-tooltip").text(root_dir);

      // Add nodes to represent files and folders
      for (var i = 0; i < input.length; i++) {
            let split = input[i].path.split("\\");
            let name = split[split.length - 1];

            data.nodes.add({
                  id: id,
                  label: name,
                  path: input[i].path,
                  isContainer: input[i].isContainer
            });
            id++;
      }

      // Assign colors/groups
      color_nodes();

      // Add connections/edges
      for (var i = 0; i < input.length; i++) {
            for (var j = 0; j < Object.keys(data.nodes._data).length; j++) {
                  // If the directory of input[i] matches the full path of data.nodes._data[j],
                  // then connect them
                  if (directory(input[i].path) === data.nodes._data[j].path) {
                        data.edges.add({
                              from: j,
                              to: i
                        });
                  }
            }
      }

      // Display network
      network = new vis.Network(container, data, options);
};

// Keep track of color mode
const uc = function() {
      $("#color-indicator").text(color);
      color_nodes();
};

// Buttons to toggle color mode
$("#color-object-type").click(() => {
      color = "Object type";
      uc();
});
$("#color-file-level").click(() => {
      color = "File level";
      uc();
});
$("#color-file-type").click(() => {
      color = "File type";
      uc();
});
uc();

// Root switch event
$("#root-switch").click(() => {
      root = $("#root-switch")[0].checked;
      update();
});

// When the program first loads, update() with the fallback or empty data
update();

// Re-run update when "Load" is clicked
$("#load-button").click(update);
