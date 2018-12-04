var len = undefined;

var nodes = new vis.DataSet();
var edges = new vis.DataSet();

var data = {
      nodes: nodes,
      edges: edges
};

// Remove file name from file path and return just the directory that file (or folder) resides in
const directory = function(input) {
      // Create variable to store output
      var output = "";
      // Split input into name of each directory and the file name
      input = input.split("\\");
      // Loop through all folders in file path (but not the file name)
      for (var i = 0; i < input.length - 1; i++) {
            // Add folder name to output
            output += input[i];
            // Only add backslash if not on last directory of file path
            if (i < input.length - 2) {
                  output += "\\";
            }
      }
      // return output. this line is pretty self-explanatory
      return output;
}

const subfolders = function(input) {
      return input.split("\\").length;
}

$.ajaxSetup({
      async: false
});
var dir = $.ajax({
      url: "./dir.txt",
      async: false
}).responseText;

var id = 0;
var group = 1;
var min_subfolders;
const update = function() {
      // Get input text from textarea
      var input = $("#input")[0].value;
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
      // Add root directory to list of file paths
      input.push(directory(min_subfolders));

      // Add nodes to represent files and folders
      // Loop through all file paths
      for (var i = 0; i < input.length; i++) {
            // Split file path into individual folders and files
            var split = input[i].split("\\");
            // Get filename from file path
            var name = split[split.length - 1];

            // Root node should be one color . . .
            if (i == input.length - 1) {
                  group = 3;
            }
            // Directories (folders) should be another . . .
            else if (name.includes(".")) {
                  group = 1;
            }
            // And files should be another
            else {
                  group = 2;
            }

            // Add node to network
            nodes.add({
                  id: id,
                  label: name,
                  group: group,
                  path: input[i]
            });

            id++;
      }

      // Add connections/edges to network
      for (var i = 0; i < input.length; i++) {
            // Loop through all existing nodes
            for (var j = 0; j < Object.keys(data.nodes._data).length; j++) {
                  // Check if directory of current node matches the full path of any other nodes
                  if (directory(input[i]) == data.nodes._data[j].path) {
                        // If the node belongs to the current directory, add a connection between the two nodes
                        edges.add({
                              from: j,
                              to: i
                        });

                        //nodes.update({
                        //id: i,
                        //group: group
                        //});
                        //group++;
                  }
            }
      }
}

update();

var container = $("#network")[0];

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
network = new vis.Network(container, data, options);