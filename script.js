$.global = {
    START_DATE: new Date(
        2016, 2 -1, 3,
        0, 30, 0
    ),
	current_path: new Path(),
	preparing_paths: [],
    item: 1,
    total: 0,
};


function Path(week, day, hour) {
	/*
 	 week: int (1..199)
 	 day: int (1..7)
 	 hour: int (0..23)
	*/
	this.week = week || 1;
	this.day = day || 1;
	this.hour = hour || 0;

	this.toString = function () {
		return `/drive/img/week_${this.week}/day_${this.day}/h${this.hour}.jpg`;
	};

	this.recalculate = function (date) {
	    const msInHour = 1000*60*60;
	    const totalCount = this.getTotalCount();
	    const totalHours = Math.floor((date - $.global.START_DATE) / msInHour) % totalCount;
	   
	    let week = (Math.floor((totalHours-1) / (7*24))) % this.getWeeksCount() + 1;
	    let is_value_changed = week != this.week;
		this.week = week;
		
		let day = (Math.floor((totalHours-1) / 24) % 7) % this.getDaysCount() + 1;
		is_value_changed |= (day != this.day);
	    this.day = day;

		let hour = ((totalHours-1) % 24) % this.getHoursCount();
		is_value_changed |= (hour != this.hour);		
		this.hour = hour;

		// Use callback if values changed
		if (is_value_changed && this.callback) {
		   this.callback(this);
		}
	};
	this.getTotalCount = function() {
		if (this._totalCount) {return this._totalCount;}
		this._totalCount = get_info('/drive/img/info.json').meta.totalCount;
		
		return this._totalCount;
	};
	this.getWeeksCount = function() {
		if (this._weeksCount) {return this._weeksCount;}
		this._weeksCount = get_info('/drive/img/info.json').meta.count;
		
		return this._weeksCount || 1;
	};
	this.getDaysCount = function() {
		if (this._daysCount) {return this._daysCount;}
		try {
			this._daysCount = get_info(
				`/drive/img/week_${this.week}/info.json`
			).meta.count;
		}
		catch (e) {
			console.error(e);
			// FIXME
			this._daysCount = 7;
		}
		
		return this._daysCount;
	};
	this.getHoursCount = function() {
		if (this._hoursCount) {return this._hoursCount;}
		try {
			this._hoursCount = get_info(
				`/drive/img/week_${this.week}/day_${this.day}/info.json`
			).meta.count;
		} catch(e) {
			console.error(e);
			// FIXME
			this._hoursCount = 24;
		}
		
		return this._hoursCount;
	};
};

/**
region dev
*/
var b = document.getElementById('_button');
if (b) {
	b.onclick = function (e) {
		var _p = $('#_date');
		_p.text(getFrame(get_current_datetime()));
	}
}
function get_current_datetime() {
	var result = new Date();
	var _input = $('#_input');
	if (_input.val()) {
		let _it = _input.val().split(':');
		result.setHours(_it[0], _it[1]);
	}
	
	return result;
}

/**
endregion dev
*/

function get_info(url){
	var result;
	$.ajax({
		url: url,
		async: false,
		success: function (data) {
			if (data instanceof String) {
				result = JSON.parse(data);
			}
			result = data;
		},
		failure: function(err) {
			console.error(err);
		}
	});
	return result;	
}

function doRecalculate() {
	return $.global.current_path.recalculate(
		get_current_datetime()
	);
}

function prepare_cache_images() {
	// TODO
}

$(document).ready(function() {
	/**
	TODO: add regular loop function for recalculate Path object in global, 
	and update current image
	 *- Add simple current image
	 *- Add preparing hidden images for cache.
	*/
	var WindowWidth = $(window).width();
	var SlideCount = $('#slides li').length;
	var SlidesWidth = SlideCount * WindowWidth;

    $.global.item = 0;
    $.global.total = SlideCount;
	
    $('.slide').css('width',WindowWidth+'px');
    $('#slides').css('width',SlidesWidth+'px');

    $("#slides li:nth-child(1)").addClass('alive');
    
    $('#left').click(function() { Slide('back'); }); 
    $('#right').click(function() { Slide('forward'); }); 

	$.global.current_path.callback = setFrame;

	doRecalculate();
	setInterval(doRecalculate, 60000);
});

function Slide(direction) {

    if (direction == 'back') { var $target = $.global.item - 1; }
    if (direction == 'forward') { var $target = $.global.item + 1; }  
    
    if ($target == -1) { DoIt($.global.total-1); }
    else if ($target == $.global.total) { DoIt(0); }
    else { DoIt($target); }    
}

function DoIt(target) {
    
    var $windowwidth = $(window).width();
    var $margin = $windowwidth * target;
    var $actualtarget = target + 1;

    $("#slides li:nth-child("+$actualtarget+")").addClass('alive');
    
    $('#slides').css('transform','translate3d(-'+$margin+'px,0px,0px)');	
    
    $.global.item = target;
    
    $('#count').html($.global.item+1);
}

function setFrame(path) {    
    // let frameNode = $("<div></div>").addClass("slide");
	$('.alive').css('background-image', 'url('+path.toString()+')');
}
