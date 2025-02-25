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
      // Splits on backslashes, removes the last element, then rejoins
      input = input.split("\\");
      input.pop();
      return input.join("\\");
};

// Returns the number of sub-directories within a file path
const subfolders = function(input) {
      return input.split("\\").length;
};

// Gets default file paths from dir.txt
var dir = $.ajax({
      url: "./dir.txt",
      async: false
}).responseText;

// Gets the div where the network will be displayed
var container = $("#network")[0];

// Defines options for network visualization
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
      }
};

// Node group (color)
const color_nodes = function() {
    var group = 0;
    var file_types = [];

    for (var i = 0; i < Object.keys(data.nodes._data).length; i++) {
        // Splits this input line on backslashes to get parts of the path
        var split = input[i].split("\\");
        // Takes the last part, which is typically the filename
        var name = split[split.length - 1];
        // Stores the full line for checking the final two characters
        var line = input[i];

        if (color == "Object type") {
            // Checks if this is the appended root node
            if (i == input.length - 1 && root) {
                group = 3; // Assigns a special group for the root
            } else {
                // Looks at the last two characters to see if it's ?C or ?I
                var lastTwo = line.slice(-2);
                if (lastTwo === "?C") {
                    // Assigns group 2 to folders
                    group = 2;
                } else if (lastTwo === "?I") {
                    // Assigns group 1 to files
                    group = 1;
                } else {
                    // Assigns a fallback group if not recognized
                    group = -1;
                }
            }
        } else if (color == "File level") {
            group = subfolders(input[i]);
        } else if (color == "File type") {
            // Checks the last two characters to confirm file vs folder
            var lastTwoType = line.slice(-2);
            if (lastTwoType === "?I") {
                // Assigns a group based on the file's extension
                if (name.includes(".")) {
                    var file_type = name.split(".")[1];
                    if (!file_types.includes(file_type)) {
                        file_types.push(file_type);
                    }
                    group = file_types.indexOf(file_type);
                } else {
                    group = -1;
                }
            } else {
                // Folders or unrecognized items get -1
                group = -1;
            }
        }

        data.nodes.update({
            id: i,
            group: group
        });
    }
};

// Minimum number of nested directories in all file paths
var min_subfolders;
// Generates the network visualization based on input data
const update = function() {
      // Resets ID counter
      var id = 0;

      // Resets the node and edge datasets
      data.nodes = new vis.DataSet();
      data.edges = new vis.DataSet();

      // Gets input text from the textarea
      input = $("#input")[0].value;
      if (input == undefined || input == "") {
            input = dir;
      }
      input = input.split("\n");
      input = input.filter(Boolean);

      // Finds the shortest file path
      min_subfolders = input[0];
      for (var i = 0; i < input.length; i++) {
            if (subfolders(input[i]) < subfolders(min_subfolders)) {
                  min_subfolders = input[i];
            }
      }
      var root_dir = directory(min_subfolders);
      if (root) {
            input.push(root_dir);
      }
      $("#root-switch-tooltip").text(root_dir);

      // Adds nodes to represent files and folders
      for (var i = 0; i < input.length; i++) {
            var split = input[i].split("\\");
            var name = split[split.length - 1];

            data.nodes.add({
                  id: id,
                  label: name,
                  path: input[i]
            });

            id++;
      }
      color_nodes();

      // Adds connections/edges
      for (var i = 0; i < input.length; i++) {
            for (var j = 0; j < Object.keys(data.nodes._data).length; j++) {
                  if (directory(input[i]) == data.nodes._data[j].path) {
                        data.edges.add({
                              from: j,
                              to: i
                        });
                  }
            }
      }

      // Displays the network
      network = new vis.Network(container, data, options);
};

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

// Updates the network when the program is started
update();

$("#load-button").click(update);
