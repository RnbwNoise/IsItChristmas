<?php
	// Copyright (C) 2014 Vladimir P.
	
	require_once('lib/Matrix.php');
	
	define('DATA_JSON_FILE', 'data.json');
	
	define('IMAGE_WIDTH',  800);
	define('IMAGE_HEIGHT', 600);
	
	define('FLAG_WIDTH',  40);
	define('FLAG_HEIGHT', 30);
	
	$data = json_decode(file_get_contents(DATA_JSON_FILE));
	foreach($data as $curveData) {
		$image = makeCurvePreviewImage($curveData, isset($_GET['d']));
		
		ob_start();
		imagePNG($image);
		$imageData = ob_get_clean();
		echo '<img src="data:image/png;base64,', base64_encode($imageData), '" /><hr />';
	}
	
	
	function makeCurvePreviewImage($data, $debug = true) {
		assert(isset($data->p) && isset($data->a) && count($data->p) % 2 === 0);
		$count = count($data->p) / 2;
		assert($count === count($data->a));
		
		$image = imageCreateTrueColor(IMAGE_WIDTH, IMAGE_HEIGHT);
		imageFilledRectangle($image, 0, 0, IMAGE_WIDTH - 1, IMAGE_HEIGHT - 1, 0xFFFFFF);
		
		imageLine($image, IMAGE_WIDTH * (3/8), IMAGE_HEIGHT / 2,
				  IMAGE_WIDTH * (5/8), IMAGE_HEIGHT / 2, 0xDDDDDD);
		imageLine($image, IMAGE_WIDTH / 2, IMAGE_HEIGHT * (3/8),
				  IMAGE_WIDTH / 2, IMAGE_HEIGHT * (5/8), 0xDDDDDD);
		
		$centerX = IMAGE_WIDTH / 2;
		$centerY = IMAGE_HEIGHT / 2;
		for($i = 0; $i < $count; ++$i) {
			$currX = $data->p[$i * 2    ] + $centerX;
			$currY = $data->p[$i * 2 + 1] + $centerY;
			$nextX = $data->p[($i + 1) % $count * 2    ] + $centerX;
			$nextY = $data->p[($i + 1) % $count * 2 + 1] + $centerY;
			
			if($debug) {
				imageLine($image, $currX, $currY, $nextX, $nextY, 0xFF0000);
				imageFilledRectangle($image, $currX - 2, $currY - 2, $currX + 2, $currY + 2, 0xFF0000);
				
				imageLine($image, $currX, $currY,
						  $currX + 20 * cos($data->a[$i]),
						  $currY + 20 * sin($data->a[$i]),
						  0x0000FF);
			}
			
			$m = new Matrix();
			$m->translate($currX, $currY);
			$m->rotate($data->a[$i]);
			$flag = [];
			$flag = array_merge($flag, $m->apply(-FLAG_WIDTH / 2, -FLAG_HEIGHT / 2));
			$flag = array_merge($flag, $m->apply(-FLAG_WIDTH / 2,  FLAG_HEIGHT / 2));
			$flag = array_merge($flag, $m->apply( FLAG_WIDTH / 2,  FLAG_HEIGHT / 2));
			$flag = array_merge($flag, $m->apply( FLAG_WIDTH / 2, -FLAG_HEIGHT / 2));
			imageFilledPolygon($image, $flag, count($flag) / 2,
							   imageColorResolveAlpha($image, 200, 200, 200, 92));
		}
		
		$label = $count . ' points';
		$labelWidth = imageFontWidth(5) * strlen($label);
		imageString($image, 5, IMAGE_WIDTH - 1 - $labelWidth, IMAGE_HEIGHT - 1 - imageFontHeight(5),
					$label, 0xFF0000);
		
		return $image;
	}