if (process.argv.length != 4) {
    console.log("Please provide the agda file you want to typecheck and the level of parallelism.")
}

var root = process.argv[2].split(".agda")[0];
var mpar = parseInt(process.argv[3] , 10);

fs = require("fs");
path = require("path");

const { spawn } = require("child_process");


var par = 0;
var tclist = [];
var graph = {};

var pool = [];

function readFile (lpath) {
    try {
        var source = fs.readFileSync(lpath + ".agda" , {encoding: "utf-8"});
	return source;
    } catch (e) {
	return null;
    }
}


function findImports (source) {
    var r =  source.split("import");
    var list = [];
    var re = /\s+/;
    var re2 = /\./gi;
    for (var i = 1; i < r.length; i++) {
	list.push(r[i].split(re)[1].replace(re2,"/"))
    }
    return list;
}



function createGraph (root) {
    createNode(graph, root);
    return graph;
}

function addNode (graph , node) {
    if(graph[node.lpath] == null) {
	graph[node.lpath] = node;
	return true;
    }
    return false;
}


function createNode (graph ,lpath) {
    var node = {};
    node.lpath = lpath;
    node.forward = [];
    node.backward = [];

    nn = addNode(graph, node);
    if(nn) {
	source = readFile("./" + lpath);
	if (source == null) {
	    delete graph[lpath];
	    return null;
	}
	var imp = findImports(source);
        imp.map(function (x) {
	    var ln = createNode(graph, x);
	    if (ln != undefined) {
		ln.forward.push(lpath);
		node.backward.push(x);
	    }
        });
	return node;
    } else {
	return graph[node.lpath];
    }
}

function findInitialNodes(graph, node) {
   delete graph[node.lpath];
   if(node.backward.length == 0){
      tclist.push(node);
   } else {
       for(var i = 0; i < node.backward.length; i++) {
          if (graph[node.backward[i]] != undefined) {
             findInitialNodes(graph, graph[node.backward[i]]);
          }
       }
    }
}






function typeCheckNextNode() {

    while((pool.length != 0) && (tclist.length != 0)) {
        var nn = tclist.pop();
	par = par + 1;
	console.log("Starting to typecheck file " + nn.lpath + ".agda");
	console.log("Parellelism level : " + par);
	typeCheckFile(nn.lpath);
    }
    if((pool.length == mpar) && (tclist.length == 0)) {
	destroyPool();
    }
}

function typeCheckFile(lpath) {
    var node = graph[lpath]
    
    var ps = pool.pop();
    ps.counter = ps.counter - 1;

    
    var rpath = "./" + lpath + ".agda";
    ps.ps.stdin.write('IOTCM "' + rpath + '" None Direct (Cmd_load "' + rpath + '" [])\n');

    var cb = function(data) {
	out = data.toString();

	if(out.indexOf("((last . ") == -1) {
            return;
	}

	ps.ps.stdout.removeListener("data" , cb);
	addPsBack(ps);

	if(out.indexOf("((last . 1) . (agda2-goals-action '()))") == -1) {
	    console.log("Something didn't typecheck for file : " + lpath);
            par = par - 1;
	    typeCheckNextNode();
	    return;
	}

	console.log("I typechecked file " + node.lpath + ".agda"); 
        par = par - 1;

	for(var i = 0; i < node.forward.length; i++){
	    fn = graph[node.forward[i]];
            var index = fn.backward.indexOf(lpath);
	    fn.backward.splice(index, 1);
	    if(fn.backward.length == 0) {
		tclist.push(fn);
	    }
	}

       typeCheckNextNode();
    };
    
    ps.ps.stdout.on("data" , cb)
}


function createPs() {
    var child = spawn("agda",["--interaction" , "--caching"]);
    child.stdin.setEncoding('utf-8');
    var ps = {};
    ps.ps = child;
    ps.counter = 10;
    return ps;
}


function createProcessPool() {
    for(var i = 0; i < mpar; i++) {
	var ps = createPs();
	pool.push(ps);
    }
}

function addPsBack(ps) {
    var nps = ps;
    if(ps.counter == 0) {
	ps.ps.kill('SIGINT');
	nps = createPs();
    }
    pool.push(nps);
}

function destroyPool() {
    while(pool.length != 0) {
	var ps = pool.pop();
	ps.ps.kill('SIGINT');
    }
}


graph = createGraph(root);
findInitialNodes(Object.assign({} , graph), graph[root]);
createProcessPool();
typeCheckNextNode();
