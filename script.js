$.global = {
    START_DATE: new Date(
        2016, 2 -1, 3,
        0, 0, 0
    ),
    current_frame: getFrame(this.START_DATE),

    item: 1,
    total: 0,
};

$(document).ready(function() {
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
   const msInHour = 1000*60*60;
   const totalHours = Math.floor((date - $.global.START_DATE) / msInHour);
   
   let week = Math.floor((totalHours-1) / (7*24)) + 1;
   let day = Math.floor((totalHours-1) / 24) % 7 + 1;
   let hour = (totalHours-1) % 24;
   //return '/img/week_'+week+'/day_'+day+'/h'+hour+'.jpg';

   return `/img/week_${week}/day_${day}/h${hour}.jpg`;
}

drv4ever@yandex.ru
function initFrame() {
    
    let frameNode = $("<div></div>").addClass("slide");
    frameNode.css('background-image', `url(${getFrame($.global.current_frame)})`);

    
}
