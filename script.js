$.global = {
    START_DATE: new Date(
        2016, 2 -1, 3,
        0, 30, 0
    ),
    current_frame: function() {getFrame(this.START_DATE);},
	current_path: new Path(),
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
		return `/img/week_${this.week}/day_${this.day}/h${this.hour}.jpg`;
	};

	this.recalculate = function (date) {
	   const msInHour = 1000*60*60;
	   const totalHours = Math.floor((date - $.global.START_DATE) / msInHour);
	   
	   this.week = (Math.floor((totalHours-1) / (7*24))) % this.getWeeksCount() + 1;
	   this.day = (Math.floor((totalHours-1) / 24) % 7) % this.getDaysCount() + 1;
	   this.hour = ((totalHours-1) % 24) % this.getHoursCount();
	};

	this.getWeeksCount = function() {
		if (this._weeksCount) {return this._weeksCount;}
		this._weeksCount = get_info('/drive/img/info.txt').meta.count;
		
		return this._weeksCount || 1;
	};
	this.getDaysCount = function() {
		if (this._daysCount) {return this._daysCount;}
		this._daysCount = get_info(
			`/drive/img/week_${this.week}/info.txt`
		).meta.count;
		
		return this._daysCount || 1;
	};
	this.getHoursCount = function() {
		if (this._hoursCount) {return this._hoursCount;}
		this._hoursCount = get_info(
			`/drive/img/week_${this.week}/day_${this.day}/info.txt`
		).meta.count;
		
		return this._hoursCount || 1;
	};
};

/**
region dev
*/
document.getElementById('_button').onclick = function (e) {
	var _p = $('#_date');
	_p.text(getFrame(get_current_datetime()));
}

function get_current_datetime() {
	var result = new Date();
	var _input = $('#_input');
	if (_input) {
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
			result = JSON.parse(data);
		}
	});
	return result;	
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


function getFrame(date) {
	/*
    deprecated. Use Path object
   */
   const msInHour = 1000*60*60;
   const totalHours = Math.floor((date - $.global.START_DATE) / msInHour);
   
   let week = Math.floor((totalHours-1) / (7*24)) + 1;
   let day = Math.floor((totalHours-1) / 24) % 7 + 1;
   let hour = (totalHours-1) % 24;

	$.global.current_path.week = week;
	$.global.current_path.day = day;
	$.global.current_path.hour = hour;
   //return '/img/week_'+week+'/day_'+day+'/h'+hour+'.jpg';

   return $.global.current_path.toString();
	// `/img/week_${week}/day_${day}/h${hour}.jpg`;
}

function initFrame() {
    
    let frameNode = $("<div></div>").addClass("slide");
    frameNode.css('background-image', 'url('+$.global.current_frame()+')');
}
