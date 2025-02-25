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

// Remove file name from file path and return just the directory
// Removes ?C or ?I if present at the end of the string before splitting
const directory = function(line) {
      var temp = line;
      if (temp.endsWith("?C") || temp.endsWith("?I")) {
            temp = temp.slice(0, -2);
      }
      temp = temp.split("\\");
      temp.pop();
      return temp.join("\\");
};

// Get number of sub-directories within a file path
// Removes ?C or ?I if present at the end of the string before splitting
const subfolders = function(line) {
      var temp = line;
      if (temp.endsWith("?C") || temp.endsWith("?I")) {
            temp = temp.slice(0, -2);
      }
      return temp.split("\\").length;
};

// Get default file paths from dir.txt
var dir = $.ajax({
      url: "./dir.txt",
      async: false
}).responseText;

// Get div where network will be displayed
var container = $("#network")[0];

// Define options for network visualization
var options = {
      nodes: {
            shape: 'dot',
            size: 30,
            font: {
                  size: 16
            },
            borderWidth: 2,
            shadow: true
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
            var line = input[i];
            var split = line.split("\\");
            var name = split[split.length - 1];

            if (color == "Object type") {
                  if (i == input.length - 1 && root) {
                        group = 3;
                  } else {
                        // Checks last two chars for ?C or ?I
                        var lastTwo = line.slice(-2);
                        if (lastTwo === "?C") {
                              group = 2;
                        } else if (lastTwo === "?I") {
                              group = 1;
                        } else {
                              group = -1;
                        }
                  }
            } else if (color == "File level") {
                  group = subfolders(line);
            } else if (color == "File type") {
                  // Only classify files if they end with ?I
                  var lastTwoChars = line.slice(-2);
                  if (lastTwoChars === "?I") {
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

// Generate network visualization based on input data
const update = function() {
      var id = 0;
      data.nodes = new vis.DataSet();
      data.edges = new vis.DataSet();

      input = $("#input")[0].value;
      if (input == undefined || input == "") {
            input = dir;
      }
      input = input.split("\n");
      input = input.filter(Boolean);

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

      // Add connections/edges
      for (var i = 0; i < input.length; i++) {
            for (var j = 0; j < Object.keys(data.nodes._data).length; j++) {
                  // Compare directory with the node path
                  if (directory(input[i]) == data.nodes._data[j].path) {
                        data.edges.add({
                              from: j,
                              to: i
                        });
                  }
            }
      }

      network = new vis.Network(container, data, options);
};

var color = "File level";
const uc = function() {
      $("#color-indicator").text(color);
      color_nodes();
};
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

$("#root-switch").click(() => {
      root = $("#root-switch")[0].checked;
      update();
});

update();
$("#load-button").click(update);
