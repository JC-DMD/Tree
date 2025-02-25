var root = $("#root-switch")[0].checked;
var input;

// Create datasets for nodes and edges
var nodes = new vis.DataSet();
var edges = new vis.DataSet();

// Store node and edges in one object
var data = {
      nodes: nodes,
      edges: edges
};

// Remove file name from file path and return just the directory that file (or folder) resides in
const directory = function(input) {
      // Split input into name of each directory and the file name
      input = input.split("\\");
      input.pop();
      // return output. this line is pretty self-explanatory
      return input.join("\\");
}

// Get number of sub-directories within file path
const subfolders = function(input) {
      return input.split("\\").length;
}

// Helper function to remove ?C or ?I at the end of a path string
function stripSuffix(path) {
      return path.replace(/\?C$|\?I$/, "");
}

// Helper function to check if path ends with ?C (folder) or ?I (file)
function parseType(path) {
      if (path.endsWith("?C")) {
            return "folder";
      } else if (path.endsWith("?I")) {
            return "file";
      }
      return "unknown";
}

// Helper function to parse extension from a file name
// Even if there are multiple periods, it will take everything after the *last* period
function parseExtension(name) {
      var parts = name.split(".");
      if (parts.length > 1) {
            return parts[parts.length - 1].toLowerCase();
      }
      return "";
}

// Get default file paths from dir.txt
var dir = $.ajax({
      url: "./dir.txt",
      async: false
}).responseText;

// Get div where network will be displayed
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
            borderRadius: 6,
            shadow: true,
            margin: 5,
            widthConstraint: {
                  minimum: 50,
                  maximum: 150
            }
      },
      edges: {
            width: 2,
          smooth: {
            type: 'cubicBezier',
            forceDirection: 'none',
            roundness: 1
          }
      },
}

// Node group (color)
const color_nodes = function() {
      var group = 0;
      var file_types = [];

      // Loop through each node in the data set
      for (var i = 0; i < Object.keys(data.nodes._data).length; i++) {
            // Retrieve the node
            var node = data.nodes._data[i];

            if (color == "Object type") {
                  // Root node should be one color . . .
                  if (i == input.length - 1 && root) {
                        group = 3;
                  }
                  // If it's a file, color = 1
                  else if (node.itemType === "file") {
                        group = 1;
                  }
                  // If it's a folder, color = 2
                  else if (node.itemType === "folder") {
                        group = 2;
                  }
                  // Otherwise unknown
                  else {
                        group = -1;
                  }
            }
            else if (color == "File level") {
                  group = subfolders(node.path);
            }
            else if (color == "File type") {
                  // Only apply coloring if it's a file
                  if (node.itemType === "file") {
                        var ext = node.extension;
                        // Keep track of unique extensions
                        if (!file_types.includes(ext)) {
                              file_types.push(ext);
                        }
                        group = file_types.indexOf(ext);
                  } else {
                        group = -1;
                  }
            }

            data.nodes.update({
                  id: node.id,
                  group: group
            });
      }
}

// Minimum number of nested directories in all file paths
var min_subfolders;
// Generate network visualization based on input data
const update = function() {
      // ID of current node
      var id = 0;

      // Create datasets for nodes and edges
      data.nodes = new vis.DataSet();
      data.edges = new vis.DataSet();

      // Get input text from textarea
      input = $("#input")[0].value;
      // If no input is provided, use default
      if (input == undefined || input == "") {
            input = dir;
      }
      // Split input string into array of lines
      input = input.split("\n");
      // Remove empty lines from input
      input = input.filter(Boolean);

      // Find shortest file path
      // Start with first file path
      min_subfolders = input[0];
      // Loop through all file paths
      for (var i = 0; i < input.length; i++) {
            // Compare current shortest directory to current file path
            // If file path has fewer subfolders than min_subfolders, update min_subfolders
            if (subfolders(input[i]) < subfolders(min_subfolders)) {
                  min_subfolders = input[i];
            }
      }
      var root_dir = directory(stripSuffix(min_subfolders));
      if (root) {
            // Add root directory to list of file paths
            input.push(root_dir);
      }
      $("#root-switch-tooltip").text(root_dir);

      // Add nodes to represent files and folders
      // Loop through all file paths
      for (var i = 0; i < input.length; i++) {
            // Strip ?C or ?I suffix so parent paths match
            var cleanedPath = stripSuffix(input[i]);
            // Determine file vs folder vs unknown
            var type = parseType(input[i]);

            // Split file path into individual folders and files
            var split = cleanedPath.split("\\");
            // Get filename (no ?C or ?I)
            var name = split[split.length - 1];

            // Build extension if it's a file
            var ext = "";
            if (type === "file") {
                  ext = parseExtension(name);
            }

            // Add node to network
            data.nodes.add({
                  id: id,
                  label: name,       // Clean label without ?C or ?I
                  path: cleanedPath, // Full path without suffix
                  itemType: type,    // "file", "folder", or "unknown"
                  extension: ext
            });

            id++;
      }

      color_nodes();

      // Add connections/edges to network
      for (var i = 0; i < input.length; i++) {
            for (var j = 0; j < Object.keys(data.nodes._data).length; j++) {
                  // Check if directory of current node matches the full path of any other nodes
                  // Use stripped path for matching
                  if (directory(stripSuffix(input[i])) == data.nodes._data[j].path) {
                        // If the node belongs to the current directory, add a connection between the two nodes
                        data.edges.add({
                              from: j,
                              to: i
                        });
                  }
            }
      }

      // Display network
      network = new vis.Network(container, data, options);
}

var color = "File level";
const uc = function() {
      $("#color-indicator").text(color);
      color_nodes();
};
$("#color-object-type").click(
      () => {
            color = "Object type";
            uc();
      }
);
$("#color-file-level").click(
      () => {
            color = "File level";
            uc();
      }
);
$("#color-file-type").click(
      () => {
            color = "File type";
            uc();
      }
);
uc();

$("#root-switch").click(() => {
      root = $("#root-switch")[0].checked;
      update();
});

// Update network when program is started
update();

$("#load-button").click(update);
