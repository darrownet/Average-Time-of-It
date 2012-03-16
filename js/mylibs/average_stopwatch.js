function createStopwatch(obj){
	var clock = obj;
	var timer = 0;
	//
	clock.addClass('stopwatch');
	//
	// This is bit messy, but IE is a crybaby and must be coddled. 
	clock.html('<div id="ticker_display" class="display"><span class="day">00</span>:<span class="hr">00</span>:<span class="min">00</span>:<span class="sec">00</span></div>');
	clock.append('<input type="button" class="start" value="Start" />');
	clock.append('<input type="button" class="stop" value="Stop" />');
	clock.append('<input type="button" class="reset" value="Reset" />');
	clock.append('<br /><br />');
	clock.append('<input type="button" class="close" value="Close" />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<input type="button" class="save" value="Save" />');
	clock.append('<br /><br />');
	//
	// We have to do some searching, so we'll do it here, so we only have to do it once.
	var d = clock.find('.day');
	var h = clock.find('.hr');
	var m = clock.find('.min');
	var s = clock.find('.sec');
	var start = clock.find('.start');
	var stop = clock.find('.stop');
	var reset = clock.find('.reset');
	var close = clock.find('.close');
	var save = clock.find('.save');
	
	stop.hide();

	start.bind('click', function() {
		timer = setInterval(do_time, 1000);
		stop.show();
		start.hide();
	});
	
	stop.bind('click', function() {
		clearInterval(timer);
		timer = 0;
		start.show();
		stop.hide();
	});
	
	reset.bind('click', function() {
		clearInterval(timer);
		timer = 0;
		d.html("00");
		h.html("00");
		m.html("00");
		s.html("00");
		stop.hide();
		start.show();
	});
	
	close.bind('click', function(){
		$(this).parent().parent().hide();
	});
	
	save.bind('click', function(){
		saveStopWachTime($("#ticker_display").text());
		$(this).parent().parent().hide();
	});
	
	function do_time() {
		// parseInt() doesn't work here..
		day = parseFloat(d.text());
		hour = parseFloat(h.text());
		minute = parseFloat(m.text());
		second = parseFloat(s.text());
		
		second++;
		
		if(second > 59) {
			second = 0;
			minute = minute + 1;
		}
		if(minute > 59) {
			minute = 0;
			hour = hour + 1;
		}
		if(hour > 23) {
			hour = 0;
			day = day + 1;
		}
		
		d.html("0".substring(day >= 10) + day);
		h.html("0".substring(hour >= 10) + hour);
		m.html("0".substring(minute >= 10) + minute);
		s.html("0".substring(second >= 10) + second);
	}
};