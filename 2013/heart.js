// https://gist.github.com/RnbwNoise/8141962

var a = 0.0;
var t = 0;
var drawHeart = function() {
	if(a < Math.PI / 2 || a > Math.PI * 3/2)
		a += 0.20; // for old ghost values: 0.35;
	else
		a += 0.10; // for old ghost values: 0.25; // the top part is more detailed
	
	if(a >= Math.PI * 2)
		a = 0;
	
	// Madeloid formula is from http://johnthemathguy.blogspot.com/2013/02/the-function-of-heart.html
	var n = Math.PI - Math.abs(Math.PI - a); // the flipping function
	var p = 2.0 * (1 - n / Math.PI) +             // this is half-wing function, but together with
			0.3 * n * (Math.PI - n) +             // flipping function it makes a full-wing function
			0.6 * n * (Math.PI - n) * (n - Math.PI / 2);
	
	var px = -p * Math.sin(a);
	var py =  p * Math.cos(a);
	
	// t++; - with new ghost values - don't move the heart
	var event = {
		clientX: 400 + 100 * Math.sin(t / 100) + /* old ghost values: 50 */ 100 * px,
		clientY: 400 + 100 * Math.cos(t / 100) + /* old ghost values: 50 */ 100 * py,
		button: 2
	};
	mouseMove(event);
	mouseClick(event);
	
	me.angle = Math.atan2(py, px) / Math.PI * 180 + 90; // this is terrible
	setRotate(me.flag, me.angle);
	emit('scroll', {id: me.id, angle: me.angle});

	
	setTimeout(drawHeart, 200);
};
drawHeart();