var url = require("url");
var querystring = require("querystring");
var mysql = require('/usr/local/node_modules/db-mysql');
var generic_pool = require('/usr/local/node_modules/generic-pool');
//
var pool = generic_pool.Pool({
    name: 'mysql',
    max: 10,
    create: function(callback) {
        new mysql.Database({
            hostname: 'just a security precaution',
            user: 'wouldnt you llike to know',
            password: 'Ill never tell',
            database: 'just a sec now, hmm... nah.'
        }).connect(function(err, server) {
            callback(err, this);
        });
    },
    destroy: function(db) {
        db.disconnect();
    }
});
//
function testModule(){
	return 'DB testModule working!';
}
//
//
function dbGetAllEntriesCount(response){
	pool.acquire(function(c_err, db) {
		if (c_err) {
            //console.log("CONNECTION error: "+c_err);
			pool.release(db);
			sendResponse(response, "CONNECTION error: "+c_err)
        }
        db.query().select('*').from('average_items').execute(function(q_err, rows, columns) {
            if (q_err) {
                //console.log("QUERY ERROR: "+q_err);
				pool.release(db);
				sendResponse(response, "QUERY ERROR: "+q_err)
            }
			pool.release(db);
			//console.log(rows.length);
			sendResponse(response, rows.length)
        });
    });
}
//
//
function dbSearchAverages(request, response, postvals){
	//
	console.log("dbSearchAverages(request, response, postvals)"+postvals);
	//
	var query_term = postvals.srchterm;
	var resp_obj = {};
	//
	if(query_term === ""){
		resp_obj.err = 1;
		resp_obj.qry = "";
		resp_obj.msg = "NoSearchTermRequested";
		resp_obj.dsc = "no query term provided"
		sendResponse(response, resp_obj);
		return;
	}else{
		pool.acquire(function(c_err, db) {
			if (c_err) {
				resp_obj.err = 1;
				resp_obj.qry = query_term;
				resp_obj.msg = "ConnectionError";
				resp_obj.dsc = c_err;
				sendResponse(response, resp_obj)
				pool.release(db);
				return;
	        }
			db.query().select('*').from('average_items').where('description = ?', [query_term]).limit(1).execute(function(q_err, rows, columns) {
	            if (q_err) {
	                resp_obj.err = 1;
					resp_obj.qry = query_term;
					resp_obj.msg = "QueryError";
					resp_obj.dsc = q_err;
					sendResponse(response, resp_obj);
					pool.release(db);
					return;
	            }
				if(rows.length === 0){
					resp_obj.err = 0;
					resp_obj.qry = query_term;
					resp_obj.msg = "AverageItemNotFound";
					resp_obj.dsc = "requested search term NOT found";
					sendResponse(response, resp_obj);
					pool.release(db);
					return;
				}else{
					resp_obj.err = 0;
					resp_obj.qry = query_term;
					resp_obj.msg = "AverageItemFound";
					resp_obj.dsc = "requested search term found";
					resp_obj.iid = rows[0].id;
					pool.release(db);
					retAverageTime(rows[0].id, response, resp_obj);
					return;
				}
	        });
		});
	}
}
function retAverageTime(id, response, resp_obj){
	//
	var times_arr = [];
	var times_avg = 0;
	//
	pool.acquire(function(c_err, db) {
		if (c_err) {
			resp_obj.err = 1;
			resp_obj.msg = "ConnectionError";
			resp_obj.dsc = c_err;
			sendResponse(response, resp_obj);
			pool.release(db);
			return;
        }
		db.query().select('*').from('time_entries').where('average_item_id = ?', [id]).execute(function(q_err, rows, columns) {
            if (q_err) {
                resp_obj.err = 1;
				resp_obj.msg = "QueryError";
				resp_obj.dsc = q_err;
				sendResponse(response, resp_obj);
				pool.release(db);
				return;
            }
			if(rows.length === 0){
				resp_obj.err = 1;
				resp_obj.msg = "NoAverageItemTimesFound";
				//resp_obj.dsc = "requested search term has no time associated / "+resp_obj.qry+" deleted.";
				//sendResponse(response, resp_obj);
				//pool.release(db);
				deleteOrpahAverage(db, response, resp_obj);
				return;
			}else{
				for (var i=0; i<rows.length; i++){
					times_arr.push(rows[i].time_entry)
				}
				times_avg = calculateAverage(times_arr);
				//
				resp_obj.avg = times_avg;
				sendResponse(response, resp_obj);;
				pool.release(db);
				return;
			}
        });
	});
}
//
//
function dbUpdateAverage(request, response, postvals){
	//
	console.log("dbUpdateAverage(request, response, postvals)"+postvals);
	//
	var time_val = postvals.time_value;
	var item_id = postvals.item_id;
	var resp_obj = {};
	//
	if(time_val === undefined || item_id === undefined){
		resp_obj.err = 1;
		resp_obj.msg = "AverageUpdateParamNotPopulated";
		resp_obj.dsc = "missing update params"
		sendResponse(response, resp_obj);
		return;
	}else if(!validateUpdateParams(time_val, item_id)){
		resp_obj.err = 1;
		resp_obj.msg = "AverageUpdateParamNotValid";
		resp_obj.avg = time_val;
		resp_obj.iid = item_id;
		resp_obj.dsc = "average item update params not valid";
		sendResponse(response, resp_obj);
		return;
	}else{
		//console.log("update params validation passed");
		time_val = stringToSeconds(time_val);
		//console.log(time_val);
		pool.acquire(function(c_err, db) {
			if (c_err) {
				resp_obj.err = 1;
				resp_obj.msg = "ConnectionError";
				resp_obj.dsc = c_err;
				sendResponse(response, resp_obj);
				pool.release(db);
				return;
	        }
			//console.log("update connection passed;");
			db.query().select('*').from('average_items').where('id = ?', [item_id]).limit(1).execute(function(q_err, rows, columns) {
	            if (q_err) {
	                resp_obj.err = 1;
					resp_obj.msg = "QueryError";
					resp_obj.dsc = q_err;
					sendResponse(response, resp_obj);
					pool.release(db);
	            }
				if(rows.length === 0){
					resp_obj.err = 1;
					resp_obj.msg = "AverageUpdateItemIdNotFound";
					resp_obj.dsc = "averge update average_item_id not found";
					resp_obj.iid = item_id;
					sendResponse(response, resp_obj);
					pool.release(db);
					return;
				}else{
					//
					resp_obj.qry = rows[0].description;
					//
					db.query().insert('time_entries',['average_item_id', 'time_entry'],[item_id, time_val]).execute(function(i_err, result) {
					    if (i_err) {
					        resp_obj.err = 1;
							resp_obj.msg = "InsertionError";
							resp_obj.dsc = i_err;
							sendResponse(response, resp_obj);
							pool.release(db);
							return;
					    }
						resp_obj.err = 0;
						resp_obj.msg = "AverageItemUpdateSuccess";
						resp_obj.dsc = "averge update item update successful";
						resp_obj.iid = item_id;
						resp_obj.avg = secondsToString(time_val);
						sendResponse(response, resp_obj);
						pool.release(db);
						return;
					});
				}
	        });
		});
	}
}
//
//
function dbCreateAverage(request, response, postvals){
	//
	console.log("createAverage(request, response, postvals)"+postvals);
	//
	var new_term  = postvals.desc;
	var time_val = postvals.time_value;
	var resp_obj = {};
	//
	if(new_term === undefined || time_val === undefined){
		resp_obj.err = 1;
		resp_obj.msg = "AverageCreateParamNotPopulated";
		resp_obj.dsc = "missing create params"
		sendResponse(response, resp_obj);
		return;
	}else if(!validateUpdateParams(time_val, 0)){
		resp_obj.err = 1;
		resp_obj.msg = "AverageCreateParamNotValid";
		resp_obj.avg = time_val;
		resp_obj.iid = item_id;
		resp_obj.dsc = "average item create param not valid";
		sendResponse(response, resp_obj);
		return;
	}else{
		time_val = stringToSeconds(time_val);
		//
		pool.acquire(function(c_err, db) {
			if (c_err) {
				resp_obj.err = 1;
				resp_obj.msg = "ConnectionError";
				resp_obj.dsc = c_err;
				sendResponse(response, resp_obj);
				pool.release(db);
				return;
	        }
			db.query().insert('average_items', ['description'], [new_term]).execute(function(i_err, result){
				if(i_err){
					resp_obj.err = 1;
					resp_obj.msg = "InsertionError";
					resp_obj.dsc = i_err;
					sendResponse(response, resp_obj);
					pool.release(db);
				}
				//
				var new_item_id = result.id;
				finalizeNewAverage(db, response, new_term, new_item_id, time_val, resp_obj);
			});
		});
	}
}
function finalizeNewAverage(db, response, new_term, new_item_id, time_val, resp_obj){
	db.query().insert('time_entries', ['average_item_id', 'time_entry'],[new_item_id, time_val]).execute(function(i_err, result){
		if(i_err){
			resp_obj.err = 1;
			resp_obj.msg = "InsertionError";
			resp_obj.dsc = i_err;
			sendResponse(response, resp_obj);
			pool.release(db);
			return;
		}
		resp_obj.err = 0;
		resp_obj.msg = "AverageItemCreateSuccess";
		resp_obj.dsc = "averge update item creation successful";
		resp_obj.iid = new_item_id;
		resp_obj.qry = new_term;
		resp_obj.avg = secondsToString(time_val);
		sendResponse(response, resp_obj);
		pool.release(db);
		return;
	});
}
//
//
function dbGetAverageDetails(request, response, postvals){
	//
}
//
//
exports.testModule = testModule;
exports.dbGetAllEntriesCount = dbGetAllEntriesCount;
exports.dbSearchAverages = dbSearchAverages;
exports.dbUpdateAverage = dbUpdateAverage;
exports.dbCreateAverage = dbCreateAverage;
exports.dbGetAverageDetails = dbGetAverageDetails;
//
//
/*	UTILITY FUNCTIONS */
//
function sendResponse(response, obj){
	response.writeHead(200, {"Content-Type": "application/json"});
	response.write(JSON.stringify(obj));
	response.end();
	console.log("response routed back...")
}
//
function deleteOrpahAverage(db, response, resp_obj){
	//
	console.log("deleteOrpahAverage(), id: "+resp_obj.iid);
	//
	db.query().delete().from('average_items').where('id = ?', [resp_obj.iid]).execute(function(d_err, result){
		if(d_err){
			resp_obj.msg = "NoAverageItemTimesFoundDeletionError";
			resp_obj.dsc = "requested search term has no time associated / "+resp_obj.qry+" NOT deleted.";
		}
		console.log(result);
		resp_obj.dsc = "requested search term has no time associated / "+resp_obj.qry+" deleted.";
		sendResponse(response, resp_obj)
		pool.release(db);
		return;
	})
}
//	
function calculateAverage(times_arr){
	//
	var tot_times = 0;
	var avg = 0;
	//
	for (var i=0; i<times_arr.length; i++){
		tot_times += times_arr[i];
	}
	//console.log("raw: "+tot_times/times_arr.length)
	avg = Math.floor(tot_times/times_arr.length);
	//
	return secondsToString(avg);
}
function secondsToString(totsecs){
	//
	var seconds = 0;
	var minutes = 0;
	var hours = 0;
	var days = 0;
	//
	//console.log("secondsToString:");
	//console.log(totsecs);
	//
	seconds = Math.round(totsecs) % 60;
	minutes = (Math.floor(totsecs/60)) % 60;
	hours = (Math.floor(totsecs/3600)) % 24;
	days = Math.floor(totsecs/86400);
	//
	//console.log(days);
	//console.log(hours);
	//console.log(minutes);
	//console.log(seconds);
	//
	if(days < 10){
		days = "0"+days;
	}
	if(hours < 10){
		hours = "0"+hours;
	}
	if(minutes < 10){
		minutes = "0"+minutes;
	}
	if(seconds < 10){
		seconds = "0"+seconds;
	}
	//
	return days+":"+hours+":"+minutes+":"+seconds;
	
}
function stringToSeconds(str){
	var arr = str.split(":");
	var totsecs = 0;
	//
	var d = arr[0];
	var h = arr[1];
	var m = arr[2];
	var s = arr[3];
	//
	//console.log("stringToSeconds:");
	//console.log(d);
	//console.log(h);
	//console.log(m);
	//console.log(s);
	//
	var days = d*86400;
	var hours = h*3600;
	var minutes = m*60;
	var seconds = Number(s);
	//
	//console.log(days);
	//console.log(hours);
	//console.log(minutes);
	//console.log(seconds);
	//
	var totsecs = Math.round(Number(days+hours+minutes+seconds));
	//
	//console.log(totsecs);
	//
	return totsecs;
}
function validateUpdateParams(timestr, id){
	var valid = true;
	//console.log(timestr);
	//console.log(id);
	//
	if(typeof timestr === undefined || typeof id === undefined){
		valid = false;
		//console.log("undefined param found during validation");
		return valid;
	}
	//
	// VALIDATE TIME STRING
	var arr = timestr.split(":");
	if(arr.length != 4){
		//console.log("split timestr arr length != 4, it = "+arr.length);
		valid = false;
	}
	var d = Number(arr[0]);
	var h = Number(arr[1]);
	var m = Number(arr[2]);
	var s = Number(arr[3]);
	//
	//console.log("	"+typeof d);
	//console.log("	"+typeof h);
	//console.log("	"+typeof m);
	//console.log("	"+typeof s);
	//
	if(typeof d != 'number' || typeof h != 'number' || typeof m != 'number' || typeof s != 'number'){
		//console.log("timestr arr element is NaN");
		valid = false;
	}
	//
	//console.log("		"+d);
	//console.log("		"+h);
	//console.log("		"+m);
	//console.log("		"+s);
	//
	if(d > 99 || h > 23 || m > 59 || s > 59){
		//console.log("time componet value is out of range");
		valid = false;
	}
	//
	// VALIDATE ID
	var i = Number(id);
	if(typeof i != 'number'){
		//console.log("id value is NaN");
		valid = false;
	}
	//
	return valid;
}