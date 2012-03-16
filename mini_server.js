var http = require('http');
var fs = require('fs');
var url = require('url');
var querystring = require("querystring");
var db_connector = require("./dbInterfaces");
var port = 3000;
//
function onRequest(request, response){
	//
	var pathname = url.parse(request.url).pathname;
	console.log("request received.... "+pathname);
	//
	// Load Application Container HTML
	if(pathname === '/'){
		fs.readFile('app_container.html', function(err, data){
			response.writeHead(200, {'Content-Type':'text/html'});
		    response.write(data);
		    response.end();
		});
	}
	//
	// Load Application Container CSS Dependencies
	if(pathname === '/css/style.css' ||
		pathname === '/css/stopwatch.css' ||
		pathname === '/css/average_time.css'){
		//
		var dep_pathname = pathname.substring(1);
		//
		fs.readFile(dep_pathname, function(err, data){
			response.writeHead(200, {'Content-Type':'text/css'});
		    response.write(data);
		    response.end();
		});
	}
	//
	// Load Application Container Javascript Dependencies
	if(pathname === '/js/libs/jquery-1.5.1.js' ||
		pathname === '/js/libs/modernizr-1.7.min.js' ||
		pathname === '/js/libs/jquery-cookie.js' ||
		pathname === '/js/plugins.js' ||
		pathname === '/js/script.js' ||
		pathname === '/js/mylibs/average_stopwatch.js'){
		//
		var dep_pathname = pathname.substring(1);	
		//
		fs.readFile(dep_pathname, function(err, data){
			response.writeHead(200, {'Content-Type':'text/javascript'});
		    response.write(data);
		    response.end();
		});
	}
	//
	// Load Application View HTML
	if(pathname === '/app.html'){
		//
		var dep_pathname = pathname.substring(1);
		//
		fs.readFile(dep_pathname, function(err, data){
			response.writeHead(200, {'Content-Type':'text/html'});
		    response.write(data);
		    response.end();
		});
	}
	//
	// Load Application View Image .png
	if(pathname === '/img/averagetimeofit_logo.png'){
			//
			var dep_pathname = pathname.substring(1);
			//
			fs.readFile(dep_pathname, function(err, data){
				response.writeHead(200, {'Content-Type':'image/png'});
			    response.write(data);
			    response.end();
			});
	}
	//
	// Load Application View Image .gif
	if(pathname === '/img/loading_gfx.gif'){
			//
			var dep_pathname = pathname.substring(1);
			//
			fs.readFile(dep_pathname, function(err, data){
				response.writeHead(200, {'Content-Type':'image/gif'});
			    response.write(data);
			    response.end();
			});
	}
	//
	// API ROUTE searchAverages
	if(pathname === '/searchAverages/'){
		console.log('searchAverages API request...');
		//
		var postcontent = '';
		var postvals = {};
		if (request.method == 'POST'){
			request.addListener('data', function(chunk) {
				postcontent+= chunk;
			});
			request.addListener('end', function() {
				postvals = querystring.parse(postcontent);
				db_connector.dbSearchAverages(request, response, postvals);	
			});
		}
	}
	//
	// API ROUTE updateAverage
	if(pathname === '/updateAverage/'){
		console.log('updateAverage API request...');
		//
		var postcontent = '';
		var postvals = {};
		if (request.method == 'POST'){
			request.addListener('data', function(chunk) {
				postcontent+= chunk;
			});
			request.addListener('end', function() {
				postvals = querystring.parse(postcontent);
				db_connector.dbUpdateAverage(request, response, postvals);	
			});
		}
	}
	//
	// API ROUTE createAverage
	if(pathname === '/createAverage/'){
		console.log('createAverage API request...');
		//
		var postcontent = '';
		var postvals = {};
		if (request.method == 'POST'){
			request.addListener('data', function(chunk) {
				postcontent+= chunk;
			});
			request.addListener('end', function() {
				postvals = querystring.parse(postcontent);
				db_connector.dbCreateAverage(request, response, postvals);	
			});
		}
	}
	//
	// API ROUTE getAverageDetails
	if(pathname === '/getAverageDetails/'){
		console.log('getAverageDetails API request...');
	}
}
//
http.createServer(onRequest).listen(port);